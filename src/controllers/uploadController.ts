import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import * as UploadModel from '../models/Upload';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// @ts-ignore  // <--- Ignoramos la falta de tipos de adm-zip
import AdmZip from 'adm-zip';
import * as mm from 'music-metadata';
import sharp from 'sharp';
import exifr from 'exifr';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB máximo
});

// ============================================
// SUBIR ARCHIVOS (inicia un job)
// ============================================
export const uploadFiles = [
  upload.array('files', 50), // máximo 50 archivos por vez
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });

      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
      const artist = artists[0];

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos' });
      }

      // Crear el job
      const jobResult = UploadModel.createUploadJob(artist.id);
      const jobId = jobResult.lastInsertRowid as number;

      // Registrar cada archivo
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        UploadModel.createUploadItem({
          job_id: jobId,
          original_filename: file.originalname,
          file_path: file.path,
          file_type: determinarTipoArchivo(file.originalname),
          mime_type: file.mimetype,
          file_size: file.size,
          extracted_data: null,                // <--- añadido
          suggested_track_id: null,             // <--- añadido
          status: 'pending',
          error: null                           // <--- añadido
        });
      }

      // Actualizar contadores
      UploadModel.updateUploadJob(jobId, {
        total_items: files.length,
        status: 'pending'
      });

      // Iniciar procesamiento en segundo plano (no esperamos)
      procesarJob(jobId).catch(console.error);

      res.json({
        mensaje: 'Archivos subidos correctamente. El procesamiento comenzará en segundo plano.',
        jobId,
        totalArchivos: files.length
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir archivos' });
    }
  }
];

// ============================================
// CONSULTAR ESTADO DEL JOB
// ============================================
export const getJobStatus = (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const jobId = parseInt(req.params.jobId as string); // <--- añadido 'as string'
    const job = UploadModel.getUploadJobById(jobId);
    if (!job) return res.status(404).json({ error: 'Job no encontrado' });

    // Verificar que el job pertenezca al artista
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0 || job.artist_id !== artists[0].id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const items = UploadModel.getUploadItemsByJob(jobId);

    res.json({
      job,
      items: items.map(item => ({
        id: item.id,
        filename: item.original_filename,
        status: item.status,
        extracted_data: item.extracted_data ? JSON.parse(item.extracted_data) : null,
        error: item.error
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
};

// ============================================
// CONFIRMAR EXTRACCIÓN (crea los tracks definitivos)
// ============================================
export const confirmExtraction = (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const jobId = parseInt(req.params.jobId as string); // <--- añadido 'as string'
    const job = UploadModel.getUploadJobById(jobId);
    if (!job) return res.status(404).json({ error: 'Job no encontrado' });

    // Verificar propiedad
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0 || job.artist_id !== artists[0].id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const items = UploadModel.getUploadItemsByJob(jobId);
    const tracksCreados = [];

    for (const item of items) {
      if (item.status === 'completed' && item.extracted_data) {
        const data = JSON.parse(item.extracted_data);
        
        // Si es un archivo de audio, crear track
        if (item.file_type === 'audio' && data.track) {
          const track = data.track;
          const result = TrackModel.createTrack(
            artists[0].id,
            track.title || 'Sin título',
            track.release_date || null,
            track.cover || null,
            track.audio_url || null,
            track.isrc || null,
            track.upc || null
          );
          const newTrack = TrackModel.getTrackById(result.lastInsertRowid as number);
          
          // Si hay splits, guardarlos
          if (data.splits && Array.isArray(data.splits)) {
            for (const split of data.splits) {
              UploadModel.createSplit({
                track_id: newTrack!.id,
                artist_name: split.artist_name,
                role: split.role,
                percentage: split.percentage,
                contract_ref: split.contract_ref
              });
            }
          }
          
          tracksCreados.push(newTrack);
          
          // Marcar item como confirmado
          UploadModel.updateUploadItem(item.id, { status: 'confirmed' });
        }
      }
    }

    // Marcar job como completado
    UploadModel.updateUploadJob(jobId, { status: 'completed' });

    res.json({
      mensaje: 'Extracción confirmada. Tracks creados.',
      tracks: tracksCreados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar extracción' });
  }
};

// ============================================
// FUNCIONES DE PROCESAMIENTO (en segundo plano)
// ============================================

async function procesarJob(jobId: number) {
  try {
    UploadModel.updateUploadJob(jobId, { status: 'processing' });
    
    const items = UploadModel.getUploadItemsByJob(jobId);
    let processed = 0;

    for (const item of items) {
      try {
        UploadModel.updateUploadItem(item.id, { status: 'processing' });
        
        let extractedData: any = {};

        // Procesar según tipo de archivo
        if (item.file_type === 'audio') {
          extractedData = await procesarAudio(item.file_path, item.original_filename);
        } else if (item.file_type === 'document') {
          extractedData = await procesarDocumento(item.file_path, item.original_filename);
        } else if (item.file_type === 'spreadsheet') {
          extractedData = await procesarHojaCalculo(item.file_path, item.original_filename);
        } else if (item.file_type === 'image') {
          extractedData = await procesarImagen(item.file_path, item.original_filename);
        } else if (item.file_type === 'archive') {
          extractedData = await procesarArchivoComprimido(item.file_path, item.original_filename, jobId);
        }

        UploadModel.updateUploadItem(item.id, {
          extracted_data: JSON.stringify(extractedData),
          status: 'completed',
          processed_at: new Date().toISOString()
        });

      } catch (error: any) {
        UploadModel.updateUploadItem(item.id, {
          status: 'failed',
          error: error.message
        });
      } finally {
        processed++;
        const progress = Math.round((processed / items.length) * 100);
        UploadModel.updateUploadJob(jobId, { 
          processed_items: processed,
          progress 
        });
      }
    }

    UploadModel.updateUploadJob(jobId, { 
      status: 'reviewing', // esperando confirmación del artista
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en job:', error);
    UploadModel.updateUploadJob(jobId, { status: 'failed' });
  }
}

async function procesarAudio(filePath: string, filename: string): Promise<any> {
  try {
    // Extraer metadatos del archivo
    const metadata = await mm.parseFile(filePath);
    
    // Mover archivo a ubicación permanente (opcional)
    const permanentPath = `uploads/audio/${Date.now()}-${filename}`;
    const dir = path.dirname(permanentPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(filePath, permanentPath);

    // Preparar datos para el track
    const trackData = {
      title: metadata.common.title || path.basename(filename, path.extname(filename)),
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre?.[0],
      duration: metadata.format.duration,
      bpm: metadata.common.bpm,
      audio_url: permanentPath.replace(/\\/g, '/'),
      isrc: metadata.common.isrc?.[0]
    };

    // Usar Gemini para extraer más metadatos si es necesario
    let splits: any[] = [];
    if (metadata.common.composer || metadata.common.lyricist) {
      // Podríamos enviar a Gemini para estructurar splits
      const prompt = `
        Dado un archivo de audio con los siguientes metadatos:
        - Título: ${trackData.title}
        - Artista: ${trackData.artist}
        - Compositor: ${metadata.common.composer}
        - Letrista: ${metadata.common.lyricist}

        Extrae la información de splits (reparto de derechos) en formato JSON:
        [
          {
            "artist_name": "nombre del artista",
            "role": "composer|lyricist|producer|performer",
            "percentage": número (0-100)
          }
        ]
        Si no hay información, devuelve array vacío.
      `;
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          splits = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing splits:', e);
      }
    }

    return { track: trackData, splits };
  } catch (error) {
    console.error('Error procesando audio:', error);
    throw error;
  }
}

async function procesarDocumento(filePath: string, filename: string): Promise<any> {
  try {
    const fs = require('fs');
    let contenido = '';

    if (filename.endsWith('.pdf')) {
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      contenido = pdfData.text;
    } else if (filename.endsWith('.docx')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      contenido = result.value;
    } else if (filename.endsWith('.txt')) {
      contenido = fs.readFileSync(filePath, 'utf8');
    }

    // Usar Gemini para extraer información estructurada
    const prompt = `
      Analiza el siguiente documento que contiene información sobre música, contratos o splits.
      Extrae toda la información relevante en formato JSON con esta estructura:
      {
        "tipo_documento": "contrato|split|letra|otro",
        "tracks": [
          {
            "title": "título de la canción",
            "artists": ["artista1", "artista2"],
            "isrc": "código ISRC si existe",
            "release_date": "fecha en formato YYYY-MM-DD si existe"
          }
        ],
        "splits": [
          {
            "track_title": "título de la canción",
            "artist_name": "nombre del artista",
            "role": "composer|producer|performer",
            "percentage": número (0-100)
          }
        ],
        "letras": [
          {
            "track_title": "título",
            "lyrics": "letra completa"
          }
        ]
      }

      Documento:
      ${contenido.substring(0, 10000)} (limitado a 10000 caracteres)
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { contenido_original: contenido.substring(0, 500) };
  } catch (error) {
    console.error('Error procesando documento:', error);
    throw error;
  } finally {
    // Limpiar archivo temporal
    fs.unlinkSync(filePath);
  }
}

async function procesarHojaCalculo(filePath: string, filename: string): Promise<any> {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const tracks = [];

    // Procesar cada hoja
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Asumimos que la primera fila son encabezados
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      for (const row of rows) {
        const track: any = {};
        headers.forEach((header, index) => {
          const value = row[index];
          if (value !== undefined && value !== null) {
            track[header.toLowerCase().replace(/[^a-z0-9]/g, '_')] = value;
          }
        });
        
        if (Object.keys(track).length > 0) {
          tracks.push(track);
        }
      }
    }

    return { tracks, fuente: 'excel' };
  } catch (error) {
    console.error('Error procesando hoja de cálculo:', error);
    throw error;
  } finally {
    fs.unlinkSync(filePath);
  }
}

async function procesarImagen(filePath: string, filename: string): Promise<any> {
  try {
    // Extraer metadatos EXIF
    const metadata = await exifr.parse(filePath);
    
    // Procesar imagen con sharp para optimizar
    const outputPath = `uploads/covers/${Date.now()}-${filename}`;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    // Limpiar archivo temporal
    fs.unlinkSync(filePath);

    return {
      cover_url: outputPath.replace(/\\/g, '/'),
      metadata: {
        width: metadata?.ImageWidth,
        height: metadata?.ImageHeight,
        make: metadata?.Make,
        model: metadata?.Model,
        datetime: metadata?.DateTimeOriginal
      }
    };
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
}

async function procesarArchivoComprimido(filePath: string, filename: string, jobId: number): Promise<any> {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    const results = [];

    // Extraer todos los archivos a una carpeta temporal
    const extractPath = `uploads/temp/${Date.now()}/`;
    zip.extractAllTo(extractPath, true);

    // Registrar cada archivo extraído como un nuevo item del job
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const entryPath = path.join(extractPath, entry.entryName);
        const tipo = determinarTipoArchivo(entry.entryName);
        
        // Crear nuevo item en la base de datos
        UploadModel.createUploadItem({
          job_id: jobId,
          original_filename: entry.entryName,
          file_path: entryPath,
          file_type: tipo,
          mime_type: obtenerMimeType(entry.entryName),
          file_size: entry.header.size,
          extracted_data: null,                // <--- añadido
          suggested_track_id: null,             // <--- añadido
          status: 'pending',
          error: null                           // <--- añadido
        });
        
        results.push(entry.entryName);
      }
    }

    // Limpiar archivo ZIP original
    fs.unlinkSync(filePath);

    return {
      archivos_extraidos: results,
      mensaje: 'Archivos extraídos y encolados para procesamiento'
    };
  } catch (error) {
    console.error('Error procesando archivo comprimido:', error);
    throw error;
  }
}

// Funciones auxiliares
function determinarTipoArchivo(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf', '.docx', '.doc', '.txt'].includes(ext)) return 'document';
  if (['.xlsx', '.xls', '.csv'].includes(ext)) return 'spreadsheet';
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  return 'other';
}

function obtenerMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.zip': 'application/zip'
  };
  return mimes[ext] || 'application/octet-stream';
}