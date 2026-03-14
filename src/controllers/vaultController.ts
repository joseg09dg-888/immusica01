import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para subida de archivos al vault
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/vault');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'vault-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB límite por archivo
});

// Interfaces para tipado
interface VaultFileRow {
  id: number;
  artist_id: number;
  filename: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  description: string | null;
  uploaded_at: string;
}

// ============================================
// SUBIR ARCHIVO AL VAULT
// ============================================
export const uploadToVault = [
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const { category, description } = req.body;

      // Obtener el artista principal del usuario
      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
      const artistId = artists[0].id;

      const fileUrl = `/uploads/vault/${req.file.filename}`;

      // Insertar en la base de datos
      const insert = db.prepare(`
        INSERT INTO vault_files (artist_id, filename, file_url, file_size, mime_type, category, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insert.run(
        artistId,
        req.file.originalname,
        fileUrl,
        req.file.size,
        req.file.mimetype,
        category || 'other',
        description || null
      );

      res.status(201).json({
        id: result.lastInsertRowid,
        file_url: fileUrl,
        message: 'Archivo subido al vault correctamente'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir archivo' });
    }
  }
];

// ============================================
// LISTAR ARCHIVOS DEL VAULT DEL ARTISTA
// ============================================
export const listVaultFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const files = db.prepare(`
      SELECT * FROM vault_files
      WHERE artist_id = ?
      ORDER BY uploaded_at DESC
    `).all(artistId) as VaultFileRow[];

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
};

// ============================================
// OBTENER UN ARCHIVO POR ID
// ============================================
export const getVaultFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    // Manejar si id es un array (posible en algunos routers)
    const idStr = Array.isArray(id) ? id[0] : id;
    const fileId = parseInt(idStr);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const file = db.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId) as VaultFileRow | undefined;

    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener archivo' });
  }
};

// ============================================
// DESCARGAR UN ARCHIVO
// ============================================
export const downloadVaultFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const fileId = parseInt(idStr);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const file = db.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId) as VaultFileRow | undefined;

    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const filePath = path.join(__dirname, '../..', file.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo físico no encontrado' });
    }

    res.download(filePath, file.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al descargar archivo' });
  }
};

// ============================================
// ELIMINAR UN ARCHIVO
// ============================================
export const deleteVaultFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const fileId = parseInt(idStr);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const file = db.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId) as VaultFileRow | undefined;

    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../..', file.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro de la base de datos
    db.prepare('DELETE FROM vault_files WHERE id = ?').run(fileId);

    res.json({ message: 'Archivo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
};