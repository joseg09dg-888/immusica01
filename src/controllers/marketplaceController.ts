import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as BeatModel from '../models/Beat';
import * as PurchaseModel from '../models/Purchase';
import * as RatingModel from '../models/Rating';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import configDb from '../config/database';

dotenv.config();

// Configuración de multer para subir archivos (demos, portadas, beats completos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'demo') folder += 'demos/';
    else if (file.fieldname === 'full') folder += 'full/';
    else if (file.fieldname === 'cover') folder += 'covers/';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ============================================
// LISTAR BEATS CON RANKINGS
// ============================================

export const listarBeats = async (req: Request, res: Response) => {
  try {
    const { genero, orden } = req.query;
    const beats = await BeatModel.getAllBeats({ genero: genero as string, orden: orden as string });

    // Enriquecer con datos adicionales (valoraciones, compras)
    const beatsConDetalles = await Promise.all(beats.map(async (beat) => {
      const promedio = await RatingModel.getAverageRatingByBeat(beat.id);
      const compras = await PurchaseModel.getPurchasesByBeat(beat.id);
      return {
        ...beat,
        rating_promedio: promedio,
        total_compras: compras.length
      };
    }));

    // Aplicar ordenamientos personalizados
    if (orden === 'mas_comprados') {
      beatsConDetalles.sort((a, b) => b.total_compras - a.total_compras);
    } else if (orden === 'mejor_puntuados') {
      beatsConDetalles.sort((a, b) => b.rating_promedio - a.rating_promedio);
    }

    res.json(beatsConDetalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar beats' });
  }
};

// ============================================
// OBTENER DETALLE DE UN BEAT
// ============================================

export const verBeat = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const beat = await BeatModel.getBeatById(id);
    if (!beat) return res.status(404).json({ error: 'Beat no encontrado' });

    const promedio = await RatingModel.getAverageRatingByBeat(id);
    const compras = await PurchaseModel.getPurchasesByBeat(id);
    const ratings = await RatingModel.getRatingsByBeat(id);

    res.json({
      ...beat,
      rating_promedio: promedio,
      total_compras: compras.length,
      ratings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener beat' });
  }
};

// ============================================
// SUBIR UN BEAT (SOLO PRODUCTORES)
// ============================================

export const subirBeat = [
  upload.fields([
    { name: 'demo', maxCount: 1 },
    { name: 'full', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });

      const artists = await ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Debes ser artista para vender beats' });
      const artist = artists[0];

      const { titulo, genero, bpm, tonalidad, precio, descripcion } = req.body;
      if (!titulo || !genero || !precio) {
        return res.status(400).json({ error: 'Título, género y precio son requeridos' });
      }

      // Manejo de archivos
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const demoUrl = files['demo'] ? '/uploads/demos/' + files['demo'][0].filename : null;
      const fullUrl = files['full'] ? '/uploads/full/' + files['full'][0].filename : null;
      const coverUrl = files['cover'] ? '/uploads/covers/' + files['cover'][0].filename : null;

      const result = await BeatModel.createBeat({
        productor_id: artist.id,
        titulo,
        genero,
        bpm: bpm ? parseInt(bpm) : null,
        tonalidad: tonalidad || null,
        precio: Math.round(parseFloat(precio) * 100), // convertir a centavos
        archivo_url: demoUrl,
        archivo_completo_url: fullUrl,
        portada_url: coverUrl,
        descripcion: descripcion || null,
        estado: 'disponible'
      });

      const newBeat = await BeatModel.getBeatById(result.lastInsertRowid as number);
      res.status(201).json(newBeat);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir beat' });
    }
  }
];

// ============================================
// COMPRAR UN BEAT
// ============================================

export const comprarBeat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const beatId = parseInt(req.params.id as string);
    const beat = await BeatModel.getBeatById(beatId);
    if (!beat) return res.status(404).json({ error: 'Beat no encontrado' });
    if (beat.estado !== 'disponible') return res.status(400).json({ error: 'Beat no disponible' });

    // Verificar que el comprador no sea el mismo productor (opcional)
    if (beat.productor_id === req.user.id) {
      return res.status(400).json({ error: 'No puedes comprar tu propio beat' });
    }

    // Calcular comisión del 5%
    const monto = beat.precio;
    const comision = Math.round(monto * 0.05);
    const montoVendedor = monto - comision;

    // Registrar la compra
    const purchase = await PurchaseModel.createPurchase({
      beat_id: beatId,
      comprador_id: req.user.id,
      monto,
      comision_plataforma: comision,
      fecha: new Date().toISOString()
    });

    // Registrar transacción con comisión en marketplace_transactions
    try {
      await configDb.prepare(`
        INSERT INTO marketplace_transactions
          (purchase_id, beat_id, buyer_id, seller_id, total_amount, commission_amount, seller_amount, commission_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.05)
      `).run(
        (purchase as any).lastInsertRowid ?? null,
        beatId,
        req.user.id,
        beat.productor_id,
        monto,
        comision,
        montoVendedor
      );
    } catch (txErr) {
      console.error('Error registrando marketplace_transaction:', txErr);
    }

    // Opcional: generar URL de descarga (el archivo completo)
    const downloadUrl = beat.archivo_completo_url;

    res.json({
      mensaje: 'Compra exitosa',
      beatId,
      monto,
      comision,
      montoVendedor,
      downloadUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al comprar beat' });
  }
};

// ============================================
// VALORAR UN BEAT
// ============================================

export const valorarBeat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const beatId = parseInt(req.params.id as string);
    const { puntuacion, comentario } = req.body;
    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5' });
    }

    const beat = await BeatModel.getBeatById(beatId);
    if (!beat) return res.status(404).json({ error: 'Beat no encontrado' });

    RatingModel.createRating({
      beat_id: beatId,
      usuario_id: req.user.id,
      puntuacion,
      comentario: comentario || null
    });

    // Devolver el nuevo promedio
    const promedio = await RatingModel.getAverageRatingByBeat(beatId);
    res.json({ mensaje: 'Valoración guardada', promedio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al valorar beat' });
  }
};

// ============================================
// MIS BEATS (los que he subido)
// ============================================

export const misBeats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No eres artista' });
    const artist = artists[0];

    const beats = await BeatModel.getBeatsByProducer(artist.id);
    const beatsConDetalles = await Promise.all(beats.map(async (beat) => {
      const promedio = await RatingModel.getAverageRatingByBeat(beat.id);
      const compras = await PurchaseModel.getPurchasesByBeat(beat.id);
      return {
        ...beat,
        rating_promedio: promedio,
        total_compras: compras.length
      };
    }));

    res.json(beatsConDetalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus beats' });
  }
};

// ============================================
// MIS COMPRAS (beats que he comprado)
// ============================================

export const misCompras = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const purchases = await PurchaseModel.getPurchasesByBuyer(req.user.id);
    // Enriquecer con datos del beat
    const comprasConBeat = await Promise.all(purchases.map(async (p) => {
      const beat = await BeatModel.getBeatById(p.beat_id);
      return { ...p, beat };
    }));

    res.json(comprasConBeat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

// ============================================
// ESTADÍSTICAS DE USUARIO (para el hot ranking)
// ============================================

export const estadisticasUsuario = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Estadísticas como comprador
    const totalCompras = await PurchaseModel.getTotalComprasPorComprador(req.user.id);

    // Estadísticas como vendedor (si es productor)
    let beatsSubidos = 0;
    let totalVentas = 0;
    let promedioRatingVendedor = 0;
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length > 0) {
      const artist = artists[0];
      const beats = await BeatModel.getBeatsByProducer(artist.id);
      beatsSubidos = beats.length;
      totalVentas = await PurchaseModel.getTotalComprasPorProductor(artist.id);

      // Calcular promedio de rating de todos sus beats
      if (beats.length > 0) {
        const ratings = await Promise.all(beats.map(b => RatingModel.getAverageRatingByBeat(b.id)));
        const suma = ratings.reduce((acc, r) => acc + r, 0);
        promedioRatingVendedor = suma / beats.length;
      }
    }

    res.json({
      compras_realizadas: totalCompras,
      beats_subidos: beatsSubidos,
      ventas_realizadas: totalVentas,
      rating_promedio_vendedor: promedioRatingVendedor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// RANKINGS GLOBALES (para la página principal dopamínica)
// ============================================

// ============================================
// ADMIN: COMISIONES MARKETPLACE
// ============================================

export const getCommissions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await configDb.prepare(`
      SELECT mt.*, b.titulo as beat_titulo
      FROM marketplace_transactions mt
      LEFT JOIN beats b ON mt.beat_id = b.id
      ORDER BY mt.created_at DESC
      LIMIT 100
    `).all() as any[];

    const totalCommission = transactions.reduce((sum: number, t: any) => sum + (t.commission_amount || 0), 0);
    const totalVolume = transactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

    res.json({
      transactions,
      summary: {
        total_transactions: transactions.length,
        total_volume: totalVolume,
        total_commission: totalCommission,
        commission_rate: 0.05
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener comisiones' });
  }
};

export const rankings = async (req: Request, res: Response) => {
  try {
    // Beats más comprados
    const beatsMasComprados = await BeatModel.getAllBeats();
    const beatsConCompras = await Promise.all(beatsMasComprados.map(async (beat) => {
      const compras = await PurchaseModel.getPurchasesByBeat(beat.id);
      return { ...beat, total_compras: compras.length };
    }));
    beatsConCompras.sort((a, b) => b.total_compras - a.total_compras);
    const top10MasComprados = beatsConCompras.slice(0, 10);

    // Beats mejor puntuados
    const beatsMejorPuntuados = await BeatModel.getAllBeats();
    const beatsConRating = await Promise.all(beatsMejorPuntuados.map(async (beat) => {
      const promedio = await RatingModel.getAverageRatingByBeat(beat.id);
      return { ...beat, rating_promedio: promedio };
    }));
    beatsConRating.sort((a, b) => b.rating_promedio - a.rating_promedio);
    const top10MejorPuntuados = beatsConRating.slice(0, 10);

    // Usuarios que más compran (top compradores) - se puede implementar después

    res.json({
      mas_comprados: top10MasComprados,
      mejor_puntuados: top10MejorPuntuados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener rankings' });
  }
};