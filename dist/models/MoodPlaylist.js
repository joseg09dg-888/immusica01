"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistById = exports.getPlaylistsByArtist = exports.createMoodPlaylist = void 0;
const database_1 = __importDefault(require("../config/database"));
const createMoodPlaylist = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO mood_playlists (artist_id, mood_description, playlist_url, playlist_id, tracks_count, valence, energy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(data.artist_id, data.mood_description, data.playlist_url, data.playlist_id, data.tracks_count, data.valence, data.energy);
};
exports.createMoodPlaylist = createMoodPlaylist;
const getPlaylistsByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM mood_playlists WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
};
exports.getPlaylistsByArtist = getPlaylistsByArtist;
const getPlaylistById = (id) => {
    return database_1.default.prepare('SELECT * FROM mood_playlists WHERE id = ?').get(id);
};
exports.getPlaylistById = getPlaylistById;
