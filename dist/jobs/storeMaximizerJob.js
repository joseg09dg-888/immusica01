"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStoreMaximizer = void 0;
const database_1 = __importDefault(require("../database"));
const stores_1 = require("../constants/stores");
const startStoreMaximizer = () => {
    console.log('🏬 Store Maximizer job started');
    // Ejecutar cada 5 minutos (ajustable)
    setInterval(() => {
        try {
            // Obtener tracks con auto_distribute activado
            const tracks = database_1.default.prepare(`
        SELECT id FROM tracks
        WHERE auto_distribute = 1
      `).all();
            if (tracks.length === 0)
                return;
            const now = new Date().toISOString();
            const insert = database_1.default.prepare(`
        INSERT INTO store_distributions (track_id, store_name, status, sent_at)
        VALUES (?, ?, 'sent', ?)
      `);
            for (const track of tracks) {
                // Obtener tiendas ya enviadas para este track
                const existing = database_1.default.prepare('SELECT store_name FROM store_distributions WHERE track_id = ?').all(track.id);
                const existingStores = new Set(existing.map(e => e.store_name));
                // Distribuir a tiendas nuevas
                for (const store of stores_1.STORES) {
                    if (!existingStores.has(store.name)) {
                        insert.run(track.id, store.name, now);
                        console.log(`📤 Track ${track.id} distribuido a ${store.name}`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error en Store Maximizer:', error);
        }
    }, 5 * 60 * 1000); // 5 minutos
};
exports.startStoreMaximizer = startStoreMaximizer;
