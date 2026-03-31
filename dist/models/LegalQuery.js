"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueriesByArtist = exports.createLegalQuery = void 0;
const database_1 = __importDefault(require("../config/database"));
const createLegalQuery = (artistId, pregunta, respuesta) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO legal_queries (artist_id, pregunta, respuesta)
    VALUES (?, ?, ?)
  `);
    return stmt.run(artistId, pregunta, respuesta);
};
exports.createLegalQuery = createLegalQuery;
const getQueriesByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM legal_queries WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
};
exports.getQueriesByArtist = getQueriesByArtist;
