import db from '../database';

interface TrackRow { id: number; }

export const startReleasePublisher = () => {
  console.log('🚀 Release publisher job started');
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      const tracksToPublish = await db.prepare(`
        SELECT id FROM tracks WHERE status = 'scheduled' AND scheduled_date <= ?
      `).all(now) as TrackRow[];

      if (tracksToPublish.length > 0) {
        console.log(`Publicando ${tracksToPublish.length} tracks...`);
        for (const track of tracksToPublish) {
          await db.prepare(`
            UPDATE tracks SET status = 'published', release_date = ?, published_at = ?, scheduled_date = NULL WHERE id = ?
          `).run(now, now, track.id);
        }
        console.log('✅ Publicación completada');
      }
    } catch (error) {
      console.error('Error en release publisher:', error);
    }
  }, 60 * 1000);
};
