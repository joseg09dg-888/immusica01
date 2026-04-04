import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as RoyaltyModel from '../models/Royalty';
import * as TrackModel from '../models/Track';
import * as FinancingModel from '../models/FinancingEligibility';

export const evaluarElegibilidad = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const royaltiesSummary = await RoyaltyModel.getSummary(artist.id);
    const ingresosAnuales = royaltiesSummary.total;

    const tracks = await TrackModel.getTracksByArtist(artist.id);
    const cancionesPublicadas = tracks.length;

    const esPropietarioMasters = cancionesPublicadas > 5;

    let puntuacion = 0;
    if (ingresosAnuales >= 5000) puntuacion += 40;
    else if (ingresosAnuales >= 3000) puntuacion += 30;
    else puntuacion += 10;

    if (cancionesPublicadas >= 10) puntuacion += 30;
    else if (cancionesPublicadas >= 5) puntuacion += 20;
    else puntuacion += 10;

    if (esPropietarioMasters) puntuacion += 20;

    const esElegible = puntuacion >= 70;

    await FinancingModel.createOrUpdateEligibility(artist.id, {
      ingresos_anuales: Math.round(ingresosAnuales * 100),
      numero_canciones_publicadas: cancionesPublicadas,
      es_propietario_masters: esPropietarioMasters,
      puntuacion_total: puntuacion,
      es_elegible: esElegible,
      fecha_ultima_evaluacion: new Date().toISOString()
    });

    res.json({
      mensaje: 'Evaluación completada',
      elegible: esElegible,
      puntuacion,
      detalles: { ingresosAnuales, cancionesPublicadas, esPropietarioMasters }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al evaluar elegibilidad' });
  }
};

export const obtenerMiElegibilidad = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const eligibility = await FinancingModel.getEligibilityByArtist(artist.id);

    if (!eligibility) {
      return await evaluarElegibilidad(req, res);
    }

    res.json({
      elegible: eligibility.es_elegible,
      puntuacion: eligibility.puntuacion_total,
      fecha_ultima_evaluacion: eligibility.fecha_ultima_evaluacion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener elegibilidad' });
  }
};

export const solicitarConsultoria = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const { nombre, telefono } = req.body;

    await FinancingModel.createOrUpdateEligibility(artist.id, {
      nombre_completo: nombre || null,
      telefono: telefono || null
    });

    const eligibility = await FinancingModel.getEligibilityByArtist(artist.id);
    const puntuacion = eligibility?.puntuacion_total || 0;

    const mensajeBase = `Hola, soy ${nombre || artist.name || 'un artista'} de IM MUSIC. Mi ID es ${artist.id} y mi puntuación de elegibilidad es ${puntuacion}. Estoy interesado en recibir asesoría sobre financiación para mi carrera musical.`;

    const metodo = process.env.FINANCING_CONTACT_METHOD || 'whatsapp';
    let contactUrl = '';

    if (metodo === 'whatsapp') {
      const whatsappNumber = process.env.FINANCING_WHATSAPP_NUMBER;
      if (!whatsappNumber) return res.status(500).json({ error: 'Número de WhatsApp no configurado' });
      contactUrl = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent(mensajeBase)}`;
    } else if (metodo === 'email') {
      const email = process.env.FINANCING_EMAIL;
      if (!email) return res.status(500).json({ error: 'Correo de contacto no configurado' });
      contactUrl = `mailto:${email}?subject=${encodeURIComponent('Solicitud de asesoría financiera desde IM MUSIC')}&body=${encodeURIComponent(mensajeBase)}`;
    } else {
      return res.status(500).json({ error: 'Método de contacto no válido' });
    }

    res.json({ mensaje: 'Redirigiendo al canal de atención', contactUrl, metodo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar la solicitud' });
  }
};
