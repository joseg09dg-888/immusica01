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
exports.generateReel = exports.generateSimpleCard = exports.generatePromoCard = void 0;
const canvas_1 = require("canvas");
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
// Configurar ffmpeg con la ruta estática
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
// ============================================
// GENERAR TARJETA PROMOCIONAL (IMAGEN)
// ============================================
const generatePromoCard = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, message, backgroundColor = '#1a1a1a', textColor = '#ffffff' } = req.body;
        if (!trackId) {
            return res.status(400).json({ error: 'trackId es obligatorio' });
        }
        // Obtener artist_id del usuario
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        // Obtener información del track y el nombre del artista
        const track = await TrackModel.getTrackById(trackId);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Obtener el nombre del artista (buscando en la tabla artists)
        const artist = artists.find(a => a.id === track.artist_id) || artists[0];
        track.artist_name = artist?.name || 'Artista';
        // Configurar el canvas (imagen de 1080x1080 para Instagram)
        const width = 1080;
        const height = 1080;
        const canvas = (0, canvas_1.createCanvas)(width, height);
        const ctx = canvas.getContext('2d');
        // Fondo
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        // Cargar y dibujar la portada si existe
        if (track.cover) {
            try {
                const coverImage = await (0, canvas_1.loadImage)(track.cover);
                const coverSize = 600;
                ctx.drawImage(coverImage, (width - coverSize) / 2, 100, coverSize, coverSize);
            }
            catch (error) {
                console.error('Error cargando imagen de portada:', error);
                // Si falla, dibujar un rectángulo de placeholder
                ctx.fillStyle = '#333';
                ctx.fillRect((width - 600) / 2, 100, 600, 600);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('SIN PORTADA', width / 2, 400);
            }
        }
        else {
            // Placeholder si no hay portada
            ctx.fillStyle = '#333';
            ctx.fillRect((width - 600) / 2, 100, 600, 600);
        }
        // Texto del título
        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        // Dividir título largo en varias líneas
        const titleWords = track.title.split(' ');
        let titleLine1 = track.title;
        let titleLine2 = '';
        if (titleWords.length > 4) {
            const mid = Math.ceil(titleWords.length / 2);
            titleLine1 = titleWords.slice(0, mid).join(' ');
            titleLine2 = titleWords.slice(mid).join(' ');
        }
        ctx.fillText(titleLine1, width / 2, 750);
        if (titleLine2) {
            ctx.fillText(titleLine2, width / 2, 830);
        }
        // Artista
        ctx.font = '40px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(track.artist_name, width / 2, 900);
        // Mensaje personalizado (si se proporciona)
        if (message) {
            ctx.font = '30px Arial';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(message, width / 2, 980);
        }
        // Convertir canvas a buffer PNG
        const buffer = canvas.toBuffer('image/png');
        // Guardar archivo temporal (opcional)
        const filename = `promo-${trackId}-${Date.now()}.png`;
        const filepath = path_1.default.join(__dirname, '../../uploads', filename);
        fs_1.default.writeFileSync(filepath, buffer);
        // Devolver la imagen
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar tarjeta promocional' });
    }
};
exports.generatePromoCard = generatePromoCard;
// ============================================
// GENERAR TARJETA SIMPLE (SOLO TEXTO)
// ============================================
const generateSimpleCard = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { title, artist, message, backgroundColor = '#1a1a1a', textColor = '#ffffff' } = req.body;
        if (!title || !artist) {
            return res.status(400).json({ error: 'title y artist son obligatorios' });
        }
        const width = 1080;
        const height = 1080;
        const canvas = (0, canvas_1.createCanvas)(width, height);
        const ctx = canvas.getContext('2d');
        // Fondo con gradiente
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, backgroundColor);
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Título
        ctx.fillStyle = textColor;
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center';
        const titleLines = [];
        const words = title.split(' ');
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 900) {
                titleLines.push(currentLine);
                currentLine = words[i];
            }
            else {
                currentLine = testLine;
            }
        }
        titleLines.push(currentLine);
        let yPos = 400;
        titleLines.forEach(line => {
            ctx.fillText(line, width / 2, yPos);
            yPos += 80;
        });
        // Artista
        ctx.font = '50px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(artist, width / 2, yPos + 50);
        // Mensaje
        if (message) {
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(message, width / 2, yPos + 150);
        }
        const buffer = canvas.toBuffer('image/png');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="promo-${Date.now()}.png"`);
        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar tarjeta simple' });
    }
};
exports.generateSimpleCard = generateSimpleCard;
// ============================================
// GENERAR REEL (VIDEO CORTO)
// ============================================
const generateReel = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, message, duration = 15 } = req.body;
        if (!trackId) {
            return res.status(400).json({ error: 'trackId es obligatorio' });
        }
        // Verificar que el track pertenezca al artista
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = await TrackModel.getTrackById(trackId);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Obtener nombre del artista
        const artist = artists.find(a => a.id === track.artist_id) || artists[0];
        const artistName = artist?.name || 'Artista';
        // Verificar que el track tenga portada y audio
        if (!track.cover || !track.audio_url) {
            return res.status(400).json({ error: 'El track debe tener portada y audio para generar un reel' });
        }
        // Rutas de los archivos
        const coverPath = path_1.default.join(__dirname, '../..', track.cover);
        const audioPath = path_1.default.join(__dirname, '../..', track.audio_url);
        const outputDir = path_1.default.join(__dirname, '../../uploads/reels');
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const outputFilename = `reel-${trackId}-${Date.now()}.mp4`;
        const outputPath = path_1.default.join(outputDir, outputFilename);
        // Comprobar que los archivos existen
        if (!fs_1.default.existsSync(coverPath)) {
            return res.status(404).json({ error: 'Archivo de portada no encontrado en el servidor' });
        }
        if (!fs_1.default.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Archivo de audio no encontrado en el servidor' });
        }
        // Duración del video (máximo 30 segundos)
        const videoDuration = Math.min(duration, 30);
        // Texto a mostrar: título y artista, más un mensaje opcional
        const titleText = track.title;
        const artistText = artistName;
        const messageText = message ? `"${message}"` : '';
        // Construir filtros de texto
        let drawTextFilters = [
            `drawtext=text='${titleText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h/2-50:shadowx=2:shadowy=2`,
            `drawtext=text='${artistText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h/2+20:shadowx=2:shadowy=2`
        ];
        if (messageText) {
            drawTextFilters.push(`drawtext=text='${messageText}':fontcolor=yellow:fontsize=30:x=(w-text_w)/2:y=h-80:shadowx=2:shadowy=2`);
        }
        const filterComplex = drawTextFilters.join(',');
        // Ejecutar ffmpeg
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)()
                .input(coverPath)
                .loop(videoDuration)
                .input(audioPath)
                .audioCodec('aac')
                .videoCodec('libx264')
                .outputOptions([
                '-t', videoDuration.toString(),
                '-vf', filterComplex,
                '-pix_fmt', 'yuv420p',
                '-shortest'
            ])
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });
        // Enviar el video al cliente
        res.download(outputPath, `reel-${track.title}.mp4`, (err) => {
            if (err) {
                console.error('Error al enviar el archivo:', err);
            }
            // Eliminar el archivo temporal después de 1 minuto
            setTimeout(() => {
                fs_1.default.unlink(outputPath, () => { });
            }, 60000);
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar reel' });
    }
};
exports.generateReel = generateReel;
