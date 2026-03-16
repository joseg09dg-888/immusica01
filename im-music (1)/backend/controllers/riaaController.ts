import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as RiaaModel from '../models/Riaa';
import * as ArtistModel from '../models/Artist';
import db from '../config/database';

export const getCertifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const artistId = artists[0].id;
    
    // Calculate total streams
    const stats = db.prepare(`
      SELECT SUM(streams) as total_streams 
      FROM daily_stats ds
      JOIN tracks t ON ds.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId) as { total_streams: number };
    
    const totalStreams = stats?.total_streams || 0;
    
    // RIAA Thresholds (Simulated: 1 sale = 1500 streams)
    // Gold: 500,000 sales = 750,000,000 streams
    // Platinum: 1,000,000 sales = 1,500,000,000 streams
    // Diamond: 10,000,000 sales = 15,000,000,000 streams
    
    const thresholds = [
      { type: 'Gold', value: 750000000 },
      { type: 'Platinum', value: 1500000000 },
      { type: 'Multi-Platinum', value: 3000000000 },
      { type: 'Diamond', value: 15000000000 }
    ];
    
    const currentCerts = RiaaModel.getCertificationsByArtist(artistId);
    const achievedTypes = currentCerts.map(c => c.type);
    
    for (const t of thresholds) {
      if (totalStreams >= t.value && !achievedTypes.includes(t.type)) {
        RiaaModel.createCertification(artistId, t.type, t.value);
      }
    }
    
    const updatedCerts = db.prepare(`
      SELECT rc.*, a.name as artist_name
      FROM riaa_certifications rc
      JOIN artists a ON rc.artist_id = a.id
      WHERE rc.artist_id = ?
      ORDER BY rc.achieved_at DESC
    `).all(artistId);

    res.json({
      total_streams: totalStreams,
      certifications: updatedCerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener certificaciones RIAA' });
  }
};
