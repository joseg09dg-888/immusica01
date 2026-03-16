import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as RoyaltyModel from '../models/Royalty';

export const checkEligibility = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json({ elegible: false, puntuacion: 0, razon: 'No hay artista' });
    
    const summary = RoyaltyModel.getSummary(artists[0].id);
    
    // Lógica simple de elegibilidad basada en ingresos
    const totalEarnings = summary.total || 0;
    const score = Math.min(100, Math.floor(totalEarnings / 10));
    
    res.json({
      elegible: totalEarnings > 500,
      puntuacion: score,
      ofertaMax: totalEarnings * 5,
      razon: totalEarnings > 500 ? 'Ingresos suficientes' : 'Ingresos insuficientes (mínimo $500)'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar elegibilidad' });
  }
};

export const solicitarAdelanto = async (req: AuthRequest, res: Response) => {
  // Simulación de solicitud
  res.json({ 
    success: true, 
    message: 'Solicitud recibida. Un asesor se pondrá en contacto contigo.',
    contactUrl: 'https://wa.me/1234567890?text=Hola,%20estoy%20interesado%20en%20un%20adelanto%20de%20regalías.'
  });
};
