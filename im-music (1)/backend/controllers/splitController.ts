import { Request, Response } from 'express';
import db from '../config/database';
import crypto from 'crypto';

interface SplitRequest {
  name: string;
  email: string;
  percentage: number;
  role: string;
}

interface SplitRow {
  id: number;
  track_id: number;
  artist_name: string;
  email: string;
  percentage: number;
  role: string;
  status: string;
  invitation_token: string;
}

interface InvitationRow {
  id: number;
  split_id: number;
  token: string;
  status: string;
  expires_at: string;
}

export const createSplit = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  const { name, email, percentage, role } = req.body as SplitRequest;

  try {
    // Check total percentage
    const existingSplits = db.prepare('SELECT percentage FROM splits WHERE track_id = ?').all(trackId) as { percentage: number }[];
    const currentTotal = existingSplits.reduce((acc, s) => acc + s.percentage, 0);

    if (currentTotal + percentage > 100) {
      return res.status(400).json({ error: 'Total percentage cannot exceed 100%' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const info = db.prepare(`
      INSERT INTO splits (track_id, artist_name, email, percentage, role, invitation_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(trackId, name, email, percentage, role, token);

    const splitId = info.lastInsertRowid;

    db.prepare(`
      INSERT INTO split_invitations (split_id, token, expires_at)
      VALUES (?, ?, ?)
    `).run(splitId, token, expiresAt.toISOString());

    const acceptLink = `${process.env.APP_URL}/api/splits/accept/${token}`;

    res.json({ 
      message: 'Split invitation created', 
      splitId, 
      acceptLink 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrackSplits = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  try {
    const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "accepted"').all(trackId);
    res.json(splits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingSplits = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  try {
    const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "pending"').all(trackId);
    res.json(splits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptSplit = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const invitation = db.prepare('SELECT * FROM split_invitations WHERE token = ? AND status = "pending"').get(token) as any;
    if (!invitation) return res.status(404).json({ error: 'Invitation not found or already processed' });

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    db.prepare('UPDATE splits SET status = "accepted", accepted_at = CURRENT_TIMESTAMP WHERE id = ?').run(invitation.split_id);
    db.prepare('UPDATE split_invitations SET status = "accepted" WHERE id = ?').run(invitation.id);

    res.send('Split accepted successfully. You can close this window.');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectSplit = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const invitation = db.prepare('SELECT * FROM split_invitations WHERE token = ?').get(token) as any;
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

    db.prepare('DELETE FROM splits WHERE id = ?').run(invitation.split_id);
    // split_invitations will be deleted by cascade

    res.send('Split rejected and removed.');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSplit = async (req: Request, res: Response) => {
  const { splitId } = req.params;
  try {
    const split = db.prepare('SELECT status FROM splits WHERE id = ?').get(splitId) as any;
    if (!split) return res.status(404).json({ error: 'Split not found' });
    if (split.status === 'accepted') return res.status(400).json({ error: 'Cannot delete an accepted split' });

    db.prepare('DELETE FROM splits WHERE id = ?').run(splitId);
    res.json({ message: 'Split deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
