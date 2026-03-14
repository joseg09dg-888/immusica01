import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import musicMetadata from 'music-metadata';
import sharp from 'sharp';
import exifr from 'exifr';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = path.join(__dirname, '../../uploads/temp');
    if (file.mimetype.startsWith('audio/')) {
      uploadDir = path.join(__dirname, '../../uploads/audio');
    } else if (file.mimetype.startsWith('image/')) {
      uploadDir = path.join(__dirname, '../../uploads/covers');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ============================================
// SUBIDA DE ARCHIVO ÚNICO (AUDIO O IMAGEN)
// ============================================
export const uploadFile = [
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      // Devolver la URL del archivo subido
      const fileUrl = `/uploads/${req.file.destination.split('uploads')[1]}/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir archivo' });
    }
  }
];

// ============================================
// SUBIDA DE CARÁTULA (CON REDIMENSIONADO)
// ============================================
export const uploadCover = [
  upload.single('cover'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });

      // Redimensionar imagen a 1400x1400 (tamaño recomendado para plataformas)
      const outputPath = path.join(__dirname, '../../uploads/covers', `resized-${req.file.filename}`);
      await sharp(req.file.path)
        .resize(1400, 1400, { fit: 'cover' })
        .toFile(outputPath);

      // Eliminar archivo original
      fs.unlinkSync(req.file.path);

      const coverUrl = `/uploads/covers/resized-${req.file.filename}`;
      res.json({ url: coverUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar la imagen' });
    }
  }
];

// ============================================
// SUBIDA DE ARCHIVO DE AUDIO (CON EXTRACCIÓN DE METADATOS)
// ============================================
export const uploadAudio = [
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      // Extraer metadatos del audio
      const metadata = await musicMetadata.parseFile(req.file.path);
      const audioUrl = `/uploads/audio/${req.file.filename}`;

      res.json({
        url: audioUrl,
        metadata: {
          title: metadata.common.title || req.file.originalname,
          artist: metadata.common.artist,
          album: metadata.common.album,
          genre: metadata.common.genre,
          year: metadata.common.year,
          duration: metadata.format.duration
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar el audio' });
    }
  }
];

// ============================================
// SUBIDA DE ARCHIVO PDF (para letras, contratos, etc.)
// ============================================
export const uploadPDF = [
  upload.single('pdf'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const pdfUrl = `/uploads/temp/${req.file.filename}`;
      res.json({ url: pdfUrl, filename: req.file.originalname });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir PDF' });
    }
  }
];

// ============================================
// SUBIDA DE ARCHIVO ZIP (CATÁLOGO COMPLETO)
// ============================================
export const uploadCatalog = [
  upload.single('catalog'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
      const artistId = artists[0].id;

      const zip = new AdmZip(req.file.path);
      const zipEntries = zip.getEntries();

      const tracks: any[] = [];

      for (const entry of zipEntries) {
        if (entry.entryName.match(/\.(mp3|wav|flac|m4a)$/i)) {
          // Extraer audio temporalmente
          const tempAudioPath = path.join(__dirname, '../../uploads/temp', entry.entryName);
          fs.writeFileSync(tempAudioPath, entry.getData());

          // Extraer metadatos
          const metadata = await musicMetadata.parseFile(tempAudioPath);
          
          // Buscar una imagen en el ZIP que pueda ser la portada
          const coverEntry = zipEntries.find(e => e.entryName.match(/\.(jpg|jpeg|png|gif)$/i));
          let coverUrl = null;
          if (coverEntry) {
            const coverPath = path.join(__dirname, '../../uploads/covers', `catalog-${Date.now()}.jpg`);
            fs.writeFileSync(coverPath, coverEntry.getData());
            coverUrl = `/uploads/covers/${path.basename(coverPath)}`;
          }

          // Mover audio a carpeta definitiva
          const audioFilename = `audio-${Date.now()}-${entry.entryName}`;
          const audioPath = path.join(__dirname, '../../uploads/audio', audioFilename);
          fs.renameSync(tempAudioPath, audioPath);
          const audioUrl = `/uploads/audio/${audioFilename}`;

          // Crear track en BD usando el modelo con objeto
          const trackId = TrackModel.createTrack({
            artist_id: artistId,
            title: metadata.common.title || entry.entryName,
            release_date: null,
            cover: coverUrl,
            audio_url: audioUrl,
            status: 'draft',
            isrc: null,
            upc: null
          });

          tracks.push({
            id: trackId,
            title: metadata.common.title || entry.entryName,
            cover: coverUrl,
            audio_url: audioUrl
          });
        }
      }

      // Eliminar el ZIP
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Catálogo procesado',
        tracks
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar el catálogo' });
    }
  }
];