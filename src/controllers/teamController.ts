import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as UserArtistModel from '../models/UserArtist';
import * as ArtistModel from '../models/Artist';
import { canUserAddArtist, getUserArtistLimitInfo } from '../utils/subscriptionUtils';

// ============================================
// GESTIÓN DE ARTISTAS ASIGNADOS
// ============================================

// Asignar un artista a otro usuario (manager)
export const assignArtistToUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { artistId, userId, role } = req.body;
    if (!artistId || !userId) {
      return res.status(400).json({ error: 'artistId y userId son obligatorios' });
    }

    // Convertir a números (los IDs vienen como string en el body)
    const artistIdNum = parseInt(artistId);
    const userIdNum = parseInt(userId);
    if (isNaN(artistIdNum) || isNaN(userIdNum)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Verificar que el usuario actual es owner del artista o admin
    const currentUserRole = await UserArtistModel.getUserArtistRole(req.user.id, artistIdNum);
    if (currentUserRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para asignar este artista' });
    }

    // Verificar que el artista existe
    const artist = ArtistModel.getArtistById(artistIdNum);
    if (!artist) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    // Verificar que el usuario a asignar existe
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(userIdNum);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar límite para el usuario destino
    if (!canUserAddArtist(userIdNum)) {
      const info = await getUserArtistLimitInfo(userIdNum);
      return res.status(403).json({
        error: `El usuario destino ha alcanzado su límite de artistas (${info.current}/${info.max}).`
      });
    }

    // Asignar
    const id = UserArtistModel.assignUserToArtist(userIdNum, artistIdNum, role || 'manager');

    res.status(201).json({
      id,
      message: 'Usuario asignado al artista correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar usuario' });
  }
};

// Quitar acceso de un usuario a un artista
export const removeArtistFromUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { artistId, userId } = req.params;

    // Convertir a números (los parámetros de ruta vienen como string o string[])
    const artistIdStr = Array.isArray(artistId) ? artistId[0] : artistId;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const artistIdNum = parseInt(artistIdStr);
    const userIdNum = parseInt(userIdStr);
    if (isNaN(artistIdNum) || isNaN(userIdNum)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const currentUserRole = await UserArtistModel.getUserArtistRole(req.user.id, artistIdNum);
    if (currentUserRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para quitar acceso' });
    }

    UserArtistModel.removeUserFromArtist(userIdNum, artistIdNum);

    res.json({ message: 'Acceso removido correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al remover acceso' });
  }
};

// Listar artistas a los que tiene acceso el usuario actual
export const getMyArtists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = UserArtistModel.getArtistsByUser(req.user.id);
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener artistas' });
  }
};

// Listar usuarios con acceso a un artista (solo para owners)
export const getArtistUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { artistId } = req.params;

    // Convertir a número
    const artistIdStr = Array.isArray(artistId) ? artistId[0] : artistId;
    const artistIdNum = parseInt(artistIdStr);
    if (isNaN(artistIdNum)) {
      return res.status(400).json({ error: 'ID de artista inválido' });
    }

    const currentUserRole = await UserArtistModel.getUserArtistRole(req.user.id, artistIdNum);
    if (currentUserRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
    }

    const users = UserArtistModel.getUsersByArtist(artistIdNum);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ============================================
// GESTIÓN DE EQUIPOS (SELLOS) - OPCIONAL
// ============================================

export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    }

    const result = await db.prepare(`INSERT INTO teams (name, owner_id) VALUES (?, ?)`).run(name, req.user.id);

    await db.prepare(`INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'admin')`).run(result.lastInsertRowid, req.user.id);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Equipo creado correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { teamId } = req.params;
    const { userId, role } = req.body;

    // Convertir a números
    const teamIdStr = Array.isArray(teamId) ? teamId[0] : teamId;
    const teamIdNum = parseInt(teamIdStr);
    const userIdNum = parseInt(userId);
    if (isNaN(teamIdNum) || isNaN(userIdNum)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const member = await db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamIdNum, req.user.id) as { role: string } | undefined;

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para agregar miembros' });
    }

    await db.prepare(`
      INSERT OR IGNORE INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(teamIdNum, userIdNum, role || 'member');

    res.json({ message: 'Miembro agregado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar miembro' });
  }
};