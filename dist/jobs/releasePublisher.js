"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReleasePublisher = void 0;
const database_1 = __importDefault(require("../database"));
const startReleasePublisher = () => {
    console.log('🚀 Release publisher job started');
    // Ejecutar cada minuto
    setInterval(() => {
        try {
            const now = new Date().toISOString();
            // Buscar tracks programados cuya fecha sea <= ahora
            const tracksToPublish = database_1.default.prepare(`
        SELECT id FROM tracks
        WHERE status = 'scheduled' AND scheduled_date <= ?
      `).all(now);
            if (tracksToPublish.length > 0) {
                console.log(`Publicando ${tracksToPublish.length} tracks...`);
                const updateStmt = database_1.default.prepare(`
          UPDATE tracks
          SET status = 'published', release_date = ?, published_at = ?, scheduled_date = NULL
          WHERE id = ?
        `);
                for (const track of tracksToPublish) {
                    updateStmt.run(now, now, track.id);
                }
                console.log('✅ Publicación completada');
            }
        }
        catch (error) {
            console.error('Error en release publisher:', error);
        }
    }, 60 * 1000); // 60 segundos
};
exports.startReleasePublisher = startReleasePublisher;
