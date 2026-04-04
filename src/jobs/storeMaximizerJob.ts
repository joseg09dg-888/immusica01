import db from '../database';
import { STORES } from '../constants/stores';

export const startStoreMaximizer = () => {
  console.log('🏬 Store Maximizer job started');
  setInterval(async () => {
    try {
      const tracks = await db.prepare(`SELECT id FROM tracks WHERE auto_distribute = true`).all() as { id: number }[];
      if (tracks.length === 0) return;

      const now = new Date().toISOString();
      for (const track of tracks) {
        const existing = await db.prepare('SELECT store_name FROM store_distributions WHERE track_id = ?').all(track.id) as { store_name: string }[];
        const existingStores = new Set(existing.map(e => e.store_name));
        for (const store of STORES) {
          if (!existingStores.has(store.name)) {
            await db.prepare(`INSERT INTO store_distributions (track_id, store_name, status, sent_at) VALUES (?, ?, 'sent', ?)`).run(track.id, store.name, now);
            console.log(`📤 Track ${track.id} distribuido a ${store.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error en Store Maximizer:', error);
    }
  }, 5 * 60 * 1000);
};
