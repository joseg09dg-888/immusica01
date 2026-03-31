"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMoods = exports.deletePlaylist = exports.updatePlaylist = exports.createPlaylist = exports.getPlaylistById = exports.getPlaylists = void 0;
const database_1 = __importDefault(require("../database"));
// Obtener todas las playlists (público, con filtros opcionales)
const getPlaylists = (req, res) => {
    try {
        const { genre, mood, limit = 50 } = req.query;
        let sql = 'SELECT * FROM playlists WHERE 1=1';
        const params = [];
        if (genre) {
            sql += ' AND genre = ?';
            params.push(genre);
        }
        if (mood) {
            // Versión simple con LIKE (busca el mood como substring en el JSON)
            sql += " AND mood_tags LIKE ?";
            params.push(`%${mood}%`);
        }
        sql += ' ORDER BY verified DESC, created_at DESC LIMIT ?';
        params.push(Number(limit));
        const playlists = database_1.default.prepare(sql).all(...params);
        res.json(playlists);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener playlists' });
    }
};
exports.getPlaylists = getPlaylists;
// Obtener una playlist por ID
const getPlaylistById = (req, res) => {
    const { id } = req.params;
    try {
        const playlist = database_1.default.prepare('SELECT * FROM playlists WHERE id = ?').get(id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        res.json(playlist);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener playlist' });
    }
};
exports.getPlaylistById = getPlaylistById;
// Crear una nueva playlist (requiere autenticación)
const createPlaylist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { name, url, genre, mood_tags, contact_email, description } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: 'Nombre y URL son obligatorios' });
        }
        // Validar URL (opcional, se puede mejorar)
        try {
            new URL(url);
        }
        catch (e) {
            return res.status(400).json({ error: 'URL inválida' });
        }
        // Convertir mood_tags a JSON si viene como array
        let moodTagsJson = null;
        if (mood_tags && Array.isArray(mood_tags)) {
            moodTagsJson = JSON.stringify(mood_tags);
        }
        else if (typeof mood_tags === 'string') {
            // Si viene como string separado por comas, convertirlo a array
            const tags = mood_tags.split(',').map((t) => t.trim());
            moodTagsJson = JSON.stringify(tags);
        }
        const insert = database_1.default.prepare(`
      INSERT INTO playlists (name, url, genre, mood_tags, contact_email, description, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = insert.run(name, url, genre || null, moodTagsJson, contact_email || null, description || null, req.user.id);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Playlist agregada correctamente'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear playlist' });
    }
};
exports.createPlaylist = createPlaylist;
// Actualizar una playlist (solo el creador o admin)
const updatePlaylist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const { name, url, genre, mood_tags, contact_email, description, verified } = req.body;
        // Verificar que la playlist existe y pertenece al usuario (o es admin)
        const playlist = database_1.default.prepare('SELECT * FROM playlists WHERE id = ?').get(id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        // Solo el propietario o admin pueden modificar
        if (playlist.submitted_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta playlist' });
        }
        // Construir la actualización dinámicamente
        const fields = [];
        const params = [];
        if (name) {
            fields.push('name = ?');
            params.push(name);
        }
        if (url) {
            fields.push('url = ?');
            params.push(url);
        }
        if (genre !== undefined) {
            fields.push('genre = ?');
            params.push(genre);
        }
        if (mood_tags) {
            let moodTagsJson = Array.isArray(mood_tags) ? JSON.stringify(mood_tags) : mood_tags;
            fields.push('mood_tags = ?');
            params.push(moodTagsJson);
        }
        if (contact_email !== undefined) {
            fields.push('contact_email = ?');
            params.push(contact_email);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            params.push(description);
        }
        // Solo admin puede cambiar verified
        if (verified !== undefined && req.user.role === 'admin') {
            fields.push('verified = ?');
            params.push(verified ? 1 : 0);
        }
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        params.push(id);
        const update = database_1.default.prepare(`UPDATE playlists SET ${fields.join(', ')} WHERE id = ?`);
        update.run(...params);
        res.json({ message: 'Playlist actualizada correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar playlist' });
    }
};
exports.updatePlaylist = updatePlaylist;
// Eliminar una playlist (solo el creador o admin)
const deletePlaylist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const playlist = database_1.default.prepare('SELECT * FROM playlists WHERE id = ?').get(id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        if (playlist.submitted_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta playlist' });
        }
        database_1.default.prepare('DELETE FROM playlists WHERE id = ?').run(id);
        res.json({ message: 'Playlist eliminada correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar playlist' });
    }
};
exports.deletePlaylist = deletePlaylist;
// Obtener moods disponibles (para el frontend)
const getMoods = (req, res) => {
    const moods = [
        'alegre', 'triste', 'energético', 'relajado', 'romántico', 'agresivo', 'feliz', 'melancólico'
    ];
    res.json(moods);
};
exports.getMoods = getMoods;
