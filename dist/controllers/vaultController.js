"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVaultFile = exports.downloadVaultFile = exports.getVaultFile = exports.listVaultFiles = exports.uploadToVault = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configurar multer para subida de archivos al vault
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/vault');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'vault-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB límite por archivo
});
// ============================================
// SUBIR ARCHIVO AL VAULT
// ============================================
exports.uploadToVault = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            const { category, description } = req.body;
            // Obtener el artista principal del usuario
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Artista no encontrado' });
            const artistId = artists[0].id;
            const fileUrl = `/uploads/vault/${req.file.filename}`;
            // Insertar en la base de datos
            const insert = database_1.default.prepare(`
        INSERT INTO vault_files (artist_id, filename, file_url, file_size, mime_type, category, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            const result = insert.run(artistId, req.file.originalname, fileUrl, req.file.size, req.file.mimetype, category || 'other', description || null);
            res.status(201).json({
                id: result.lastInsertRowid,
                file_url: fileUrl,
                message: 'Archivo subido al vault correctamente'
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir archivo' });
        }
    }
];
// ============================================
// LISTAR ARCHIVOS DEL VAULT DEL ARTISTA
// ============================================
const listVaultFiles = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const files = database_1.default.prepare(`
      SELECT * FROM vault_files
      WHERE artist_id = ?
      ORDER BY uploaded_at DESC
    `).all(artistId);
        res.json(files);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar archivos' });
    }
};
exports.listVaultFiles = listVaultFiles;
// ============================================
// OBTENER UN ARCHIVO POR ID
// ============================================
const getVaultFile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        // Manejar si id es un array (posible en algunos routers)
        const idStr = Array.isArray(id) ? id[0] : id;
        const fileId = parseInt(idStr);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const file = database_1.default.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        res.json(file);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener archivo' });
    }
};
exports.getVaultFile = getVaultFile;
// ============================================
// DESCARGAR UN ARCHIVO
// ============================================
const downloadVaultFile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const fileId = parseInt(idStr);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const file = database_1.default.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        const filePath = path_1.default.join(__dirname, '../..', file.file_url);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo físico no encontrado' });
        }
        res.download(filePath, file.filename);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al descargar archivo' });
    }
};
exports.downloadVaultFile = downloadVaultFile;
// ============================================
// ELIMINAR UN ARCHIVO
// ============================================
const deleteVaultFile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const fileId = parseInt(idStr);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const file = database_1.default.prepare(`
      SELECT * FROM vault_files
      WHERE id = ? AND artist_id = ?
    `).get(fileId, artistId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        // Eliminar archivo físico
        const filePath = path_1.default.join(__dirname, '../..', file.file_url);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Eliminar registro de la base de datos
        database_1.default.prepare('DELETE FROM vault_files WHERE id = ?').run(fileId);
        res.json({ message: 'Archivo eliminado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar archivo' });
    }
};
exports.deleteVaultFile = deleteVaultFile;
