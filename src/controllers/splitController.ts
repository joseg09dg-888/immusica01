import { Request, Response } from 'express';
import db from '../database';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';

const generateToken = () => crypto.randomBytes(32).toString('hex');

interface TrackRow { id: number; artist_id: number; }
interface SplitRow { id: number; track_id: number; artist_name: string; email: string; role: string; percentage: number; status: string; invitation_token: string; created_at: string; accepted_at: string | null; }
interface InvitationRow { id: number; split_id: number; email: string; token: string; status: string; expires_at: string; created_at: string; track_id?: number; percentage?: number; artist_name?: string; }
interface SumResult { total: number | null; }

export const addSplit = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  const { name, email, percentage, role } = req.body;
  if (!name || !email || !percentage) return res.status(400).json({ error: 'Faltan campos requeridos' });
  const percent = parseFloat(percentage);
  if (isNaN(percent) || percent <= 0 || percent > 100) return res.status(400).json({ error: 'Porcentaje inválido' });
  try {
    const track = await db.prepare('SELECT id, artist_id FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;
    if (!track) return res.status(404).json({ error: 'Track no encontrado' });
    const sumResult = await db.prepare('SELECT SUM(percentage) as total FROM splits WHERE track_id = ?').get(trackId) as SumResult | undefined;
    const total = sumResult?.total || 0;
    if (total + percent > 100) return res.status(400).json({ error: 'La suma de porcentajes supera 100%' });
    const token = generateToken();
    const result = await db.prepare(`INSERT INTO splits (track_id, artist_name, email, role, percentage, status, invitation_token) VALUES (?, ?, ?, ?, ?, 'pending', ?) RETURNING id`).run(trackId, name, email, role || 'collaborator', percent, token);
    const splitId = result.lastInsertRowid as number;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 30);
    await db.prepare(`INSERT INTO split_invitations (split_id, email, token, expires_at) VALUES (?, ?, ?, ?)`).run(splitId, email, token, expiresAt.toISOString());
    const acceptLink = `${process.env.FRONTEND_URL}/accept-split?token=${token}`;
    res.status(201).json({ message: 'Invitación de split creada', splitId, token, acceptLink, pending: true });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al crear split' }); }
};

export const acceptSplit = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const invitation = await db.prepare(`SELECT si.*, s.track_id, s.percentage, s.artist_name FROM split_invitations si JOIN splits s ON si.split_id = s.id WHERE si.token = ? AND si.status = 'pending'`).get(token) as (InvitationRow & { track_id: number; percentage: number; artist_name: string }) | undefined;
    if (!invitation) return res.status(404).json({ error: 'Invitación no válida o ya expiró' });
    const now = new Date();
    if (now > new Date(invitation.expires_at)) {
      await db.prepare('UPDATE split_invitations SET status = $1 WHERE id = ?').run('expired', invitation.id);
      return res.status(400).json({ error: 'La invitación ha expirado' });
    }
    await db.prepare('UPDATE splits SET status = $1, accepted_at = ? WHERE id = ?').run('accepted', now.toISOString(), invitation.split_id);
    await db.prepare('UPDATE split_invitations SET status = $1 WHERE id = ?').run('accepted', invitation.id);
    res.json({ message: 'Split aceptado correctamente' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al aceptar split' }); }
};

export const rejectSplit = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const split = await db.prepare(`SELECT s.id as split_id FROM split_invitations si JOIN splits s ON si.split_id = s.id WHERE si.token = ? AND si.status = 'pending'`).get(token) as { split_id: number } | undefined;
    if (!split) return res.status(404).json({ error: 'Invitación no encontrada' });
    await db.prepare('DELETE FROM splits WHERE id = ?').run(split.split_id);
    await db.prepare('UPDATE split_invitations SET status = $1 WHERE token = ?').run('rejected', token);
    res.json({ message: 'Split rechazado' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al rechazar split' }); }
};

export const getSplits = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  try {
    const splits = await db.prepare("SELECT * FROM splits WHERE track_id = ? AND status = 'accepted'").all(trackId) as SplitRow[];
    res.json(splits);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener splits' }); }
};

export const getPendingSplits = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  try {
    const splits = await db.prepare("SELECT * FROM splits WHERE track_id = ? AND status = 'pending'").all(trackId) as SplitRow[];
    res.json(splits);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener splits pendientes' }); }
};

export const deleteSplit = async (req: Request, res: Response) => {
  const { splitId } = req.params;
  try {
    const split = await db.prepare('SELECT status FROM splits WHERE id = ?').get(splitId) as { status: string } | undefined;
    if (!split) return res.status(404).json({ error: 'Split no encontrado' });
    if (split.status !== 'pending') return res.status(400).json({ error: 'Solo se pueden eliminar splits pendientes' });
    await db.prepare('DELETE FROM splits WHERE id = ?').run(splitId);
    await db.prepare('DELETE FROM split_invitations WHERE split_id = ?').run(splitId);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar split' }); }
};

export const getAllSplitsByArtist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;
    const splits = await db.prepare(`
      SELECT s.*, t.title as track_title
      FROM splits s
      JOIN tracks t ON s.track_id = t.id
      WHERE t.artist_id = ?
      ORDER BY s.created_at DESC
    `).all(artistId) as (SplitRow & { track_title: string })[];
    res.json(splits);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener splits' }); }
};
