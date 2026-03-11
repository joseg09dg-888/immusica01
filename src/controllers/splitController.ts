import { Request, Response } from 'express';
import db from '../database';
import crypto from 'crypto';

// Generar token único para invitación
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Definir tipos para los resultados de las consultas
interface TrackRow {
  id: number;
  artist_id: number;
}

interface SplitRow {
  id: number;
  track_id: number;
  artist_name: string;
  email: string;
  role: string;
  percentage: number;
  status: string;
  invitation_token: string;
  created_at: string;
  accepted_at: string | null;
}

interface InvitationRow {
  id: number;
  split_id: number;
  email: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  // Propiedades adicionales del join
  track_id?: number;
  percentage?: number;
  artist_name?: string;
}

interface SumResult {
  total: number | null;
}

// Crear un split (invitación)
export const addSplit = (req: Request, res: Response) => {
  const { trackId } = req.params;
  const { name, email, percentage, role } = req.body;

  if (!name || !email || !percentage) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const percent = parseFloat(percentage);
  if (isNaN(percent) || percent <= 0 || percent > 100) {
    return res.status(400).json({ error: 'Porcentaje inválido' });
  }

  // Verificar que el track existe
  const trackStmt = db.prepare('SELECT id, artist_id FROM tracks WHERE id = ?');
  const track = trackStmt.get(trackId) as TrackRow | undefined;
  if (!track) {
    return res.status(404).json({ error: 'Track no encontrado' });
  }

  // Calcular suma actual de splits (solo los aceptados)
  const sumStmt = db.prepare('SELECT SUM(percentage) as total FROM splits WHERE track_id = ? AND status = "accepted"');
  const sumResult = sumStmt.get(trackId) as SumResult | undefined;
  const total = sumResult?.total || 0;
  if (total + percent > 100) {
    return res.status(400).json({ error: 'La suma de porcentajes supera 100%' });
  }

  // Generar token único
  const token = generateToken();

  // Insertar split con estado 'pending'
  const insertSplit = db.prepare(`
    INSERT INTO splits (track_id, artist_name, email, role, percentage, status, invitation_token)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `);
  const result = insertSplit.run(trackId, name, email, role || 'collaborator', percent, token);
  const splitId = result.lastInsertRowid as number;

  // Insertar invitación
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // válida por 30 días
  const insertInvitation = db.prepare(`
    INSERT INTO split_invitations (split_id, email, token, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  insertInvitation.run(splitId, email, token, expiresAt.toISOString());

  // Aquí podrías enviar un email con el enlace de aceptación
  const acceptLink = `${process.env.FRONTEND_URL}/accept-split?token=${token}`;

  res.status(201).json({
    message: 'Invitación de split creada',
    splitId,
    token,
    acceptLink,
    pending: true
  });
};

// Aceptar invitación
export const acceptSplit = (req: Request, res: Response) => {
  const { token } = req.params;

  // Buscar la invitación
  const invitationStmt = db.prepare(`
    SELECT si.*, s.track_id, s.percentage, s.artist_name
    FROM split_invitations si
    JOIN splits s ON si.split_id = s.id
    WHERE si.token = ? AND si.status = 'pending'
  `);
  const invitation = invitationStmt.get(token) as (InvitationRow & { track_id: number; percentage: number; artist_name: string }) | undefined;

  if (!invitation) {
    return res.status(404).json({ error: 'Invitación no válida o ya expiró' });
  }

  // Verificar si expiró
  const now = new Date();
  const expires = new Date(invitation.expires_at);
  if (now > expires) {
    // Marcar como expirada
    db.prepare('UPDATE split_invitations SET status = "expired" WHERE id = ?').run(invitation.id);
    return res.status(400).json({ error: 'La invitación ha expirado' });
  }

  // Actualizar split a 'accepted'
  db.prepare('UPDATE splits SET status = "accepted", accepted_at = ? WHERE id = ?').run(now.toISOString(), invitation.split_id);

  // Marcar invitación como aceptada
  db.prepare('UPDATE split_invitations SET status = "accepted" WHERE id = ?').run(invitation.id);

  res.json({ message: 'Split aceptado correctamente' });
};

// Rechazar invitación
export const rejectSplit = (req: Request, res: Response) => {
  const { token } = req.params;

  const splitStmt = db.prepare(`
    SELECT s.id as split_id
    FROM split_invitations si
    JOIN splits s ON si.split_id = s.id
    WHERE si.token = ? AND si.status = 'pending'
  `);
  const split = splitStmt.get(token) as { split_id: number } | undefined;

  if (!split) {
    return res.status(404).json({ error: 'Invitación no encontrada' });
  }

  // Eliminar el split (o marcarlo como rechazado)
  db.prepare('DELETE FROM splits WHERE id = ?').run(split.split_id);
  db.prepare('UPDATE split_invitations SET status = "rejected" WHERE token = ?').run(token);

  res.json({ message: 'Split rechazado' });
};

// Obtener splits de un track (solo aceptados)
export const getSplits = (req: Request, res: Response) => {
  const { trackId } = req.params;
  const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "accepted"').all(trackId) as SplitRow[];
  res.json(splits);
};

// Obtener splits pendientes de un track
export const getPendingSplits = (req: Request, res: Response) => {
  const { trackId } = req.params;
  const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "pending"').all(trackId) as SplitRow[];
  res.json(splits);
};

// Eliminar un split (solo si está pendiente)
export const deleteSplit = (req: Request, res: Response) => {
  const { splitId } = req.params;

  const split = db.prepare('SELECT status FROM splits WHERE id = ?').get(splitId) as { status: string } | undefined;
  if (!split) return res.status(404).json({ error: 'Split no encontrado' });
  if (split.status !== 'pending') {
    return res.status(400).json({ error: 'Solo se pueden eliminar splits pendientes' });
  }

  db.prepare('DELETE FROM splits WHERE id = ?').run(splitId);
  db.prepare('DELETE FROM split_invitations WHERE split_id = ?').run(splitId);

  res.json({ success: true });
};