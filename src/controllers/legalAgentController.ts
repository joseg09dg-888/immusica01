import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as LegalQueryModel from '../models/LegalQuery';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const LEGAL_SYSTEM_PROMPT = `
Eres un asesor legal experto en propiedad intelectual y derecho del entretenimiento, con especialización internacional.
Tu rol es ayudar a artistas musicales y productores a entender sus derechos, contratos y opciones legales.
Debes ser empático, claro y detallado en tus respuestas.

**Áreas de especialización:**
- Splits, lanzamientos, master, publishing, gestión colectiva
- Contratos de licencia, cesión, sincronización
- Derechos conexos, regalías, royalties
- Detección de abusos, cláusulas abusivas
- Legislación internacional

**IMPORTANTE:** Al final de cada respuesta, incluye una advertencia de que esto es solo orientativo y que deben consultar con un abogado real.
`;

export const consultarLegal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Crea un artista primero' });
    const artist = artists[0];

    const { pregunta } = req.body;
    if (!pregunta) return res.status(400).json({ error: 'La pregunta es obligatoria' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: LEGAL_SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: `El artista pregunta: ${pregunta}` }] }
      ]
    });
    let respuesta = result.response.text();

    if (!respuesta.includes('abogado')) {
      respuesta += '\n\n**Nota:** Esta información es solo orientativa. Consulta con un abogado especializado.';
    }

    await LegalQueryModel.createLegalQuery(artist.id, pregunta, respuesta);
    res.json({ respuesta });
  } catch (error: any) {
    const msg: string = error?.message || '';
    if (msg.toLowerCase().includes('depleted') || msg.toLowerCase().includes('credits') || msg.includes('429')) {
      return res.status(503).json({ error: 'Créditos de IA agotados. Recarga en AI Studio para continuar.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la consulta legal' });
  }
};

export const analizarContrato = (req: AuthRequest, res: Response) => {
  res.status(501).json({ error: 'Funcionalidad en mantenimiento. Pronto podrás subir contratos.' });
};

export const getHistorial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Crea un artista primero' });
    const artist = artists[0];

    const queries = await LegalQueryModel.getQueriesByArtist(artist.id);
    res.json(queries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
