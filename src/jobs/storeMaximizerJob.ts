import db from '../database';
import { STORES } from '../constants/stores';

export const startStoreMaximizer = () => {
  console.log('🏬 Store Maximizer job started');

  // Ejecutar cada 5 minutos (ajustable)
  setInterval(() => {
    try {
      // Obtener tracks con auto_distribute activado
      const tracks = db.prepare(`
        SELECT id FROM tracks
        WHERE auto_distribute = 1
      `).all() as { id: number }[];

      if (tracks.length === 0) return;

      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO store_distributions (track_id, store_name, status, sent_at)
        VALUES (?, ?, 'sent', ?)
      `);

      for (const track of tracks) {
        // Obtener tiendas ya enviadas para este track
        const existing = db.prepare('SELECT store_name FROM store_distributions WHERE track_id = ?').all(track.id) as { store_name: string }[];
        const existingStores = new Set(existing.map(e => e.store_name));

        // Distribuir a tiendas nuevas
        for (const store of STORES) {
          if (!existingStores.has(store.name)) {
            insert.run(track.id, store.name, now);
            console.log(`📤 Track ${track.id} distribuido a ${store.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error en Store Maximizer:', error);
    }
  }, 5 * 60 * 1000); // 5 minutos
};