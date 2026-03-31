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
exports.uploadCatalog = exports.uploadPDF = exports.uploadAudio = exports.uploadCover = exports.uploadFile = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const music_metadata_1 = __importDefault(require("music-metadata"));
const sharp_1 = __importDefault(require("sharp"));
// Configuración de multer para subida de archivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = path_1.default.join(__dirname, '../../uploads/temp');
        if (file.mimetype.startsWith('audio/')) {
            uploadDir = path_1.default.join(__dirname, '../../uploads/audio');
        }
        else if (file.mimetype.startsWith('image/')) {
            uploadDir = path_1.default.join(__dirname, '../../uploads/covers');
        }
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// ============================================
// SUBIDA DE ARCHIVO ÚNICO (AUDIO O IMAGEN)
// ============================================
exports.uploadFile = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            // Devolver la URL del archivo subido
            const fileUrl = `/uploads/${req.file.destination.split('uploads')[1]}/${req.file.filename}`;
            res.json({ url: fileUrl, filename: req.file.filename });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir archivo' });
        }
    }
];
// ============================================
// SUBIDA DE CARÁTULA (CON REDIMENSIONADO)
// ============================================
exports.uploadCover = [
    upload.single('cover'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ninguna imagen' });
            // Redimensionar imagen a 1400x1400 (tamaño recomendado para plataformas)
            const outputPath = path_1.default.join(__dirname, '../../uploads/covers', `resized-${req.file.filename}`);
            await (0, sharp_1.default)(req.file.path)
                .resize(1400, 1400, { fit: 'cover' })
                .toFile(outputPath);
            // Eliminar archivo original
            fs_1.default.unlinkSync(req.file.path);
            const coverUrl = `/uploads/covers/resized-${req.file.filename}`;
            res.json({ url: coverUrl });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar la imagen' });
        }
    }
];
// ============================================
// SUBIDA DE ARCHIVO DE AUDIO (CON EXTRACCIÓN DE METADATOS)
// ============================================
exports.uploadAudio = [
    upload.single('audio'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            // Extraer metadatos del audio
            const metadata = await music_metadata_1.default.parseFile(req.file.path);
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar el audio' });
        }
    }
];
// ============================================
// SUBIDA DE ARCHIVO PDF (para letras, contratos, etc.)
// ============================================
exports.uploadPDF = [
    upload.single('pdf'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            const pdfUrl = `/uploads/temp/${req.file.filename}`;
            res.json({ url: pdfUrl, filename: req.file.originalname });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir PDF' });
        }
    }
];
// ============================================
// SUBIDA DE ARCHIVO ZIP (CATÁLOGO COMPLETO)
// ============================================
exports.uploadCatalog = [
    upload.single('catalog'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Artista no encontrado' });
            const artistId = artists[0].id;
            const zip = new adm_zip_1.default(req.file.path);
            const zipEntries = zip.getEntries();
            const tracks = [];
            for (const entry of zipEntries) {
                if (entry.entryName.match(/\.(mp3|wav|flac|m4a)$/i)) {
                    // Extraer audio temporalmente
                    const tempAudioPath = path_1.default.join(__dirname, '../../uploads/temp', entry.entryName);
                    fs_1.default.writeFileSync(tempAudioPath, entry.getData());
                    // Extraer metadatos
                    const metadata = await music_metadata_1.default.parseFile(tempAudioPath);
                    // Buscar una imagen en el ZIP que pueda ser la portada
                    const coverEntry = zipEntries.find(e => e.entryName.match(/\.(jpg|jpeg|png|gif)$/i));
                    let coverUrl = null;
                    if (coverEntry) {
                        const coverPath = path_1.default.join(__dirname, '../../uploads/covers', `catalog-${Date.now()}.jpg`);
                        fs_1.default.writeFileSync(coverPath, coverEntry.getData());
                        coverUrl = `/uploads/covers/${path_1.default.basename(coverPath)}`;
                    }
                    // Mover audio a carpeta definitiva
                    const audioFilename = `audio-${Date.now()}-${entry.entryName}`;
                    const audioPath = path_1.default.join(__dirname, '../../uploads/audio', audioFilename);
                    fs_1.default.renameSync(tempAudioPath, audioPath);
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
            fs_1.default.unlinkSync(req.file.path);
            res.json({
                message: 'Catálogo procesado',
                tracks
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar el catálogo' });
        }
    }
];
