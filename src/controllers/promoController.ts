import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createCanvas, loadImage } from 'canvas';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Definir interfaz para Track con datos del artista
interface TrackWithArtist extends TrackModel.Track {
  artist_name?: string;
}

// Generar tarjeta promocional
export const generatePromoCard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId, message, backgroundColor = '#1a1a1a', textColor = '#ffffff' } = req.body;

    if (!trackId) {
      return res.status(400).json({ error: 'trackId es obligatorio' });
    }

    // Obtener artist_id del usuario
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    // Obtener información del track y el nombre del artista
    const track = await TrackModel.getTrackById(trackId) as TrackWithArtist | null;
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Obtener el nombre del artista (buscando en la tabla artists)
    const artist = artists.find(a => a.id === track.artist_id) || artists[0];
    track.artist_name = artist?.name || 'Artista';

    // Configurar el canvas (imagen de 1080x1080 para Instagram)
    const width = 1080;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Cargar y dibujar la portada si existe
    if (track.cover) {
      try {
        const coverImage = await loadImage(track.cover);
        const coverSize = 600;
        ctx.drawImage(coverImage, (width - coverSize) / 2, 100, coverSize, coverSize);
      } catch (error) {
        console.error('Error cargando imagen de portada:', error);
        // Si falla, dibujar un rectángulo de placeholder
        ctx.fillStyle = '#333';
        ctx.fillRect((width - 600) / 2, 100, 600, 600);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SIN PORTADA', width / 2, 400);
      }
    } else {
      // Placeholder si no hay portada
      ctx.fillStyle = '#333';
      ctx.fillRect((width - 600) / 2, 100, 600, 600);
    }

    // Texto del título
    ctx.fillStyle = textColor;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    
    // Dividir título largo en varias líneas
    const titleWords = track.title.split(' ');
    let titleLine1 = track.title;
    let titleLine2 = '';
    
    if (titleWords.length > 4) {
      const mid = Math.ceil(titleWords.length / 2);
      titleLine1 = titleWords.slice(0, mid).join(' ');
      titleLine2 = titleWords.slice(mid).join(' ');
    }

    ctx.fillText(titleLine1, width / 2, 750);
    if (titleLine2) {
      ctx.fillText(titleLine2, width / 2, 830);
    }

    // Artista
    ctx.font = '40px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(track.artist_name, width / 2, 900);

    // Mensaje personalizado (si se proporciona)
    if (message) {
      ctx.font = '30px Arial';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(message, width / 2, 980);
    }

    // Convertir canvas a buffer PNG
    const buffer = canvas.toBuffer('image/png');

    // Guardar archivo temporal (opcional)
    const filename = `promo-${trackId}-${Date.now()}.png`;
    const filepath = path.join(__dirname, '../../uploads', filename);
    fs.writeFileSync(filepath, buffer);

    // Devolver la imagen
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar tarjeta promocional' });
  }
};

// Versión simple que genera una tarjeta con texto solamente
export const generateSimpleCard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { title, artist, message, backgroundColor = '#1a1a1a', textColor = '#ffffff' } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'title y artist son obligatorios' });
    }

    const width = 1080;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Título
    ctx.fillStyle = textColor;
    ctx.font = 'bold 70px Arial';
    ctx.textAlign = 'center';
    
    const titleLines = [];
    const words = title.split(' ');
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 900) {
        titleLines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    titleLines.push(currentLine);

    let yPos = 400;
    titleLines.forEach(line => {
      ctx.fillText(line, width / 2, yPos);
      yPos += 80;
    });

    // Artista
    ctx.font = '50px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(artist, width / 2, yPos + 50);

    // Mensaje
    if (message) {
      ctx.font = '40px Arial';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(message, width / 2, yPos + 150);
    }

    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="promo-${Date.now()}.png"`);
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar tarjeta simple' });
  }
};