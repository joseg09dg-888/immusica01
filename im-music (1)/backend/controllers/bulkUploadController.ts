import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const bulkUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Crea un artista primero' });
    const artist = artists[0];

    const results = [];
    for (const file of req.files as Express.Multer.File[]) {
      // Si es un archivo de texto, PDF o imagen, intentamos extraer metadata con Gemini
      const mimeType = file.mimetype;
      const isMetadataFile = mimeType.includes('pdf') || mimeType.includes('image') || mimeType.includes('text');
      
      if (isMetadataFile) {
        const base64 = fs.readFileSync(file.path).toString('base64');
        const prompt = `
          Extract music track metadata from this document. 
          Return a JSON array of tracks with "title", "isrc", "upc", "release_date".
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            { inlineData: { data: base64, mimeType: mimeType } },
            { text: prompt }
          ],
          config: { responseMimeType: "application/json" }
        });

        const extracted = JSON.parse(response.text || '[]');
        if (Array.isArray(extracted)) {
          for (const t of extracted) {
            TrackModel.createTrack(
              artist.id,
              t.title,
              t.release_date || new Date().toISOString().split('T')[0],
              undefined, // cover
              undefined, // audioUrl
              t.isrc || null,
              t.upc || null
            );
          }
          results.push({ file: file.originalname, tracksExtracted: extracted.length });
        }
      } else if (mimeType.includes('audio')) {
        // Si es audio, lo registramos como un track pendiente
        TrackModel.createTrack(
          artist.id,
          file.originalname.split('.')[0],
          new Date().toISOString().split('T')[0],
          undefined, // cover
          file.path // audioUrl
        );
        results.push({ file: file.originalname, status: 'audio_uploaded' });
      }
      
      // Limpiar archivo temporal
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    res.json({ message: 'Procesamiento masivo completado', results });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en procesamiento masivo' });
  }
};
