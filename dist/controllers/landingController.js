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
exports.deleteLandingPage = exports.getMyLandingPages = exports.captureLead = exports.getLandingPage = exports.createLandingPage = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
// Generar slug a partir del título
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 50);
};
// Crear una nueva landing page
const createLandingPage = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { track_id, title, description, cover_url, spotify_url, apple_music_url, youtube_url, other_url, config } = req.body;
        if (!track_id || !title) {
            return res.status(400).json({ error: 'track_id y title son obligatorios' });
        }
        // Obtener artist_id del usuario
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        // Verificar que el track pertenece al artista
        const track = database_1.default.prepare('SELECT id FROM tracks WHERE id = ? AND artist_id = ?').get(track_id, artistId);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Generar slug único
        let slug = generateSlug(title);
        let counter = 1;
        let uniqueSlug = slug;
        while (database_1.default.prepare('SELECT id FROM landing_pages WHERE slug = ?').get(uniqueSlug)) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        // Insertar landing page
        const insert = database_1.default.prepare(`
      INSERT INTO landing_pages 
      (track_id, artist_id, slug, title, description, cover_url, spotify_url, apple_music_url, youtube_url, other_url, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = insert.run(track_id, artistId, uniqueSlug, title, description || null, cover_url || null, spotify_url || null, apple_music_url || null, youtube_url || null, other_url || null, config ? JSON.stringify(config) : null);
        res.status(201).json({
            id: result.lastInsertRowid,
            slug: uniqueSlug,
            message: 'Landing page creada correctamente',
            url: `${process.env.FRONTEND_URL}/landing/${uniqueSlug}`
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear landing page' });
    }
};
exports.createLandingPage = createLandingPage;
// Obtener una landing page por slug (público)
const getLandingPage = (req, res) => {
    const { slug } = req.params;
    try {
        const page = database_1.default.prepare(`
      SELECT lp.*, t.title as track_title, t.cover as track_cover, t.audio_url
      FROM landing_pages lp
      JOIN tracks t ON lp.track_id = t.id
      WHERE lp.slug = ?
    `).get(slug);
        if (!page) {
            return res.status(404).json({ error: 'Landing page no encontrada' });
        }
        // Parsear config si existe
        if (page.config) {
            page.config = JSON.parse(page.config);
        }
        res.json(page);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener landing page' });
    }
};
exports.getLandingPage = getLandingPage;
// Capturar lead (email) de un fan
const captureLead = (req, res) => {
    const { slug } = req.params;
    const { email, name } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email es obligatorio' });
    }
    try {
        // Obtener el ID de la landing page
        const page = database_1.default.prepare('SELECT id FROM landing_pages WHERE slug = ?').get(slug);
        if (!page) {
            return res.status(404).json({ error: 'Landing page no encontrada' });
        }
        // Insertar lead (si ya existe, ON CONFLICT lo ignora)
        const insert = database_1.default.prepare(`
      INSERT OR IGNORE INTO leads (landing_page_id, email, name)
      VALUES (?, ?, ?)
    `);
        insert.run(page.id, email, name || null);
        res.json({ message: 'Lead capturado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al capturar lead' });
    }
};
exports.captureLead = captureLead;
// Listar landing pages del artista autenticado
const getMyLandingPages = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const pages = database_1.default.prepare(`
      SELECT lp.*, t.title as track_title,
      (SELECT COUNT(*) FROM leads WHERE landing_page_id = lp.id) as leads_count
      FROM landing_pages lp
      JOIN tracks t ON lp.track_id = t.id
      WHERE lp.artist_id = ?
      ORDER BY lp.created_at DESC
    `).all(artistId);
        res.json(pages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener landing pages' });
    }
};
exports.getMyLandingPages = getMyLandingPages;
// Eliminar una landing page (solo si es del artista)
const deleteLandingPage = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        // Verificar que la página pertenezca al artista
        const page = database_1.default.prepare('SELECT id FROM landing_pages WHERE id = ? AND artist_id = ?').get(id, artistId);
        if (!page) {
            return res.status(404).json({ error: 'Landing page no encontrada o no pertenece al artista' });
        }
        database_1.default.prepare('DELETE FROM landing_pages WHERE id = ?').run(id);
        res.json({ message: 'Landing page eliminada correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar landing page' });
    }
};
exports.deleteLandingPage = deleteLandingPage;
