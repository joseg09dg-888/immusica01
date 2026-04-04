import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as UserArtistModel from '../models/UserArtist';
import { canUserAddArtist, getUserArtistLimitInfo } from '../utils/subscriptionUtils';

export const getMyArtists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const artists = await UserArtistModel.getArtistsByUser(req.user.id);
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener artistas' });
  }
};

export const createArtist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const canAdd = await canUserAddArtist(req.user.id);
    if (!canAdd) {
      const info = await getUserArtistLimitInfo(req.user.id);
      return res.status(403).json({
        error: `Has alcanzado el límite de artistas de tu plan (${info.current}/${info.max}). Mejora tu plan para crear más.`
      });
    }

    const { name, genre, bio, tier, avatar } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del artista es obligatorio' });
    }

    const artistId = await ArtistModel.createArtist({
      user_id: req.user.id,
      name,
      genre,
      bio,
      tier: tier || 'Basic',
      avatar
    });

    await UserArtistModel.assignUserToArtist(req.user.id, artistId, 'owner');

    res.status(201).json({ id: artistId, message: 'Artista creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear artista' });
  }
};

export const getArtistLimit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const info = await getUserArtistLimitInfo(req.user.id);
    res.json(info);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener límite' });
  }
};

export const getArtistById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const artistId = parseInt(idStr, 10);

    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'ID de artista inválido' });
    }

    const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
    if (!role) {
      return res.status(403).json({ error: 'No tienes acceso a este artista' });
    }

    const artist = await ArtistModel.getArtistById(artistId);
    if (!artist) return res.status(404).json({ error: 'Artista no encontrado' });

    res.json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener artista' });
  }
};

export const updateArtist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const artistId = parseInt(idStr, 10);

    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'ID de artista inválido' });
    }

    const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
    if (!role || (role !== 'owner' && role !== 'manager')) {
      return res.status(403).json({ error: 'No tienes permiso para editar este artista' });
    }

    const { name, genre, bio, tier, avatar } = req.body;
    await ArtistModel.updateArtist(artistId, { name, genre, bio, tier, avatar });

    res.json({ message: 'Artista actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar artista' });
  }
};

export const deleteArtist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const artistId = parseInt(idStr, 10);

    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'ID de artista inválido' });
    }

    const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
    if (role !== 'owner') {
      return res.status(403).json({ error: 'Solo el propietario puede eliminar el artista' });
    }

    await ArtistModel.deleteArtist(artistId);
    res.json({ message: 'Artista eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar artista' });
  }
};
