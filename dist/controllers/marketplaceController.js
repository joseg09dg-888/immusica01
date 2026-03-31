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
exports.rankings = exports.estadisticasUsuario = exports.misCompras = exports.misBeats = exports.valorarBeat = exports.comprarBeat = exports.subirBeat = exports.verBeat = exports.listarBeats = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const BeatModel = __importStar(require("../models/Beat"));
const PurchaseModel = __importStar(require("../models/Purchase"));
const RatingModel = __importStar(require("../models/Rating"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configuración de multer para subir archivos (demos, portadas, beats completos)
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/';
        if (file.fieldname === 'demo')
            folder += 'demos/';
        else if (file.fieldname === 'full')
            folder += 'full/';
        else if (file.fieldname === 'cover')
            folder += 'covers/';
        if (!fs_1.default.existsSync(folder))
            fs_1.default.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// ============================================
// LISTAR BEATS CON RANKINGS
// ============================================
const listarBeats = (req, res) => {
    try {
        const { genero, orden } = req.query;
        const beats = BeatModel.getAllBeats({ genero: genero, orden: orden });
        // Enriquecer con datos adicionales (valoraciones, compras)
        const beatsConDetalles = beats.map((beat) => {
            const promedio = RatingModel.getAverageRatingByBeat(beat.id);
            const compras = PurchaseModel.getPurchasesByBeat(beat.id);
            return {
                ...beat,
                rating_promedio: promedio,
                total_compras: compras.length
            };
        });
        // Aplicar ordenamientos personalizados
        if (orden === 'mas_comprados') {
            beatsConDetalles.sort((a, b) => b.total_compras - a.total_compras);
        }
        else if (orden === 'mejor_puntuados') {
            beatsConDetalles.sort((a, b) => b.rating_promedio - a.rating_promedio);
        }
        res.json(beatsConDetalles);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar beats' });
    }
};
exports.listarBeats = listarBeats;
// ============================================
// OBTENER DETALLE DE UN BEAT
// ============================================
const verBeat = (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const beat = BeatModel.getBeatById(id);
        if (!beat)
            return res.status(404).json({ error: 'Beat no encontrado' });
        const promedio = RatingModel.getAverageRatingByBeat(id);
        const compras = PurchaseModel.getPurchasesByBeat(id);
        const ratings = RatingModel.getRatingsByBeat(id);
        res.json({
            ...beat,
            rating_promedio: promedio,
            total_compras: compras.length,
            ratings
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener beat' });
    }
};
exports.verBeat = verBeat;
// ============================================
// SUBIR UN BEAT (SOLO PRODUCTORES)
// ============================================
exports.subirBeat = [
    upload.fields([
        { name: 'demo', maxCount: 1 },
        { name: 'full', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Debes ser artista para vender beats' });
            const artist = artists[0];
            const { titulo, genero, bpm, tonalidad, precio, descripcion } = req.body;
            if (!titulo || !genero || !precio) {
                return res.status(400).json({ error: 'Título, género y precio son requeridos' });
            }
            // Manejo de archivos
            const files = req.files;
            const demoUrl = files['demo'] ? '/uploads/demos/' + files['demo'][0].filename : null;
            const fullUrl = files['full'] ? '/uploads/full/' + files['full'][0].filename : null;
            const coverUrl = files['cover'] ? '/uploads/covers/' + files['cover'][0].filename : null;
            const result = BeatModel.createBeat({
                productor_id: artist.id,
                titulo,
                genero,
                bpm: bpm ? parseInt(bpm) : null,
                tonalidad: tonalidad || null,
                precio: Math.round(parseFloat(precio) * 100), // convertir a centavos
                archivo_url: demoUrl,
                archivo_completo_url: fullUrl,
                portada_url: coverUrl,
                descripcion: descripcion || null,
                estado: 'disponible'
            });
            const newBeat = BeatModel.getBeatById(result.lastInsertRowid);
            res.status(201).json(newBeat);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir beat' });
        }
    }
];
// ============================================
// COMPRAR UN BEAT
// ============================================
const comprarBeat = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const beatId = parseInt(req.params.id);
        const beat = BeatModel.getBeatById(beatId);
        if (!beat)
            return res.status(404).json({ error: 'Beat no encontrado' });
        if (beat.estado !== 'disponible')
            return res.status(400).json({ error: 'Beat no disponible' });
        // Verificar que el comprador no sea el mismo productor (opcional)
        if (beat.productor_id === req.user.id) {
            return res.status(400).json({ error: 'No puedes comprar tu propio beat' });
        }
        // Calcular comisión del 5%
        const monto = beat.precio;
        const comision = Math.round(monto * 0.05);
        // Registrar la compra
        const purchase = PurchaseModel.createPurchase({
            beat_id: beatId,
            comprador_id: req.user.id,
            monto,
            comision_plataforma: comision,
            fecha: new Date().toISOString()
        });
        // Opcional: generar URL de descarga (el archivo completo)
        const downloadUrl = beat.archivo_completo_url;
        res.json({
            mensaje: 'Compra exitosa',
            beatId,
            monto,
            comision,
            downloadUrl
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al comprar beat' });
    }
};
exports.comprarBeat = comprarBeat;
// ============================================
// VALORAR UN BEAT
// ============================================
const valorarBeat = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const beatId = parseInt(req.params.id);
        const { puntuacion, comentario } = req.body;
        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5' });
        }
        const beat = BeatModel.getBeatById(beatId);
        if (!beat)
            return res.status(404).json({ error: 'Beat no encontrado' });
        RatingModel.createRating({
            beat_id: beatId,
            usuario_id: req.user.id,
            puntuacion,
            comentario: comentario || null
        });
        // Devolver el nuevo promedio
        const promedio = RatingModel.getAverageRatingByBeat(beatId);
        res.json({ mensaje: 'Valoración guardada', promedio });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al valorar beat' });
    }
};
exports.valorarBeat = valorarBeat;
// ============================================
// MIS BEATS (los que he subido)
// ============================================
const misBeats = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No eres artista' });
        const artist = artists[0];
        const beats = BeatModel.getBeatsByProducer(artist.id);
        const beatsConDetalles = beats.map((beat) => {
            const promedio = RatingModel.getAverageRatingByBeat(beat.id);
            const compras = PurchaseModel.getPurchasesByBeat(beat.id);
            return {
                ...beat,
                rating_promedio: promedio,
                total_compras: compras.length
            };
        });
        res.json(beatsConDetalles);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tus beats' });
    }
};
exports.misBeats = misBeats;
// ============================================
// MIS COMPRAS (beats que he comprado)
// ============================================
const misCompras = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const purchases = PurchaseModel.getPurchasesByBuyer(req.user.id);
        // Enriquecer con datos del beat
        const comprasConBeat = purchases.map((p) => {
            const beat = BeatModel.getBeatById(p.beat_id);
            return { ...p, beat };
        });
        res.json(comprasConBeat);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener compras' });
    }
};
exports.misCompras = misCompras;
// ============================================
// ESTADÍSTICAS DE USUARIO (para el hot ranking)
// ============================================
const estadisticasUsuario = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Estadísticas como comprador
        const totalCompras = PurchaseModel.getTotalComprasPorComprador(req.user.id);
        // Estadísticas como vendedor (si es productor)
        let beatsSubidos = 0;
        let totalVentas = 0;
        let promedioRatingVendedor = 0;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length > 0) {
            const artist = artists[0];
            const beats = BeatModel.getBeatsByProducer(artist.id);
            beatsSubidos = beats.length;
            totalVentas = PurchaseModel.getTotalComprasPorProductor(artist.id);
            // Calcular promedio de rating de todos sus beats
            if (beats.length > 0) {
                const ratings = beats.map(b => RatingModel.getAverageRatingByBeat(b.id));
                const suma = ratings.reduce((acc, r) => acc + r, 0);
                promedioRatingVendedor = suma / beats.length;
            }
        }
        res.json({
            compras_realizadas: totalCompras,
            beats_subidos: beatsSubidos,
            ventas_realizadas: totalVentas,
            rating_promedio_vendedor: promedioRatingVendedor
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
exports.estadisticasUsuario = estadisticasUsuario;
// ============================================
// RANKINGS GLOBALES (para la página principal dopamínica)
// ============================================
const rankings = (req, res) => {
    try {
        // Beats más comprados
        const beatsMasComprados = BeatModel.getAllBeats();
        const beatsConCompras = beatsMasComprados.map((beat) => {
            const compras = PurchaseModel.getPurchasesByBeat(beat.id);
            return { ...beat, total_compras: compras.length };
        });
        beatsConCompras.sort((a, b) => b.total_compras - a.total_compras);
        const top10MasComprados = beatsConCompras.slice(0, 10);
        // Beats mejor puntuados
        const beatsMejorPuntuados = BeatModel.getAllBeats();
        const beatsConRating = beatsMejorPuntuados.map((beat) => {
            const promedio = RatingModel.getAverageRatingByBeat(beat.id);
            return { ...beat, rating_promedio: promedio };
        });
        beatsConRating.sort((a, b) => b.rating_promedio - a.rating_promedio);
        const top10MejorPuntuados = beatsConRating.slice(0, 10);
        // Usuarios que más compran (top compradores) - se puede implementar después
        res.json({
            mas_comprados: top10MasComprados,
            mejor_puntuados: top10MejorPuntuados
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener rankings' });
    }
};
exports.rankings = rankings;
