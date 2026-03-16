import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getCompositions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const compositions = db.prepare('SELECT * FROM compositions WHERE artist_id IN (SELECT id FROM artists WHERE user_id = ?)').all(req.user.id);
    res.json(compositions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener composiciones' });
  }
};

export const createComposition = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { artist_id, title, iswc, pro, share } = req.body;
    const result = db.prepare('INSERT INTO compositions (artist_id, title, iswc, pro, share) VALUES (?, ?, ?, ?, ?)').run(artist_id, title, iswc, pro, share);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear composición' });
  }
};

export const getPublishingRoyalties = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const royalties = db.prepare(`
      SELECT pr.*, c.title as composition_title 
      FROM publishing_royalties pr
      JOIN compositions c ON pr.composition_id = c.id
      WHERE c.artist_id IN (SELECT id FROM artists WHERE user_id = ?)
    `).all(req.user.id);
    res.json(royalties);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener regalías editoriales' });
  }
};

export const registerComposition = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { composition_id, pro } = req.body;
    const regNumber = 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const result = db.prepare('INSERT INTO composition_registrations (composition_id, pro, registration_number, status) VALUES (?, ?, ?, ?)').run(composition_id, pro, regNumber, 'registered');
    res.json({ id: result.lastInsertRowid, registration_number: regNumber });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar obra' });
  }
};

export const getPublishingSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const summary = db.prepare(`
      SELECT SUM(amount) as total_royalties, COUNT(DISTINCT composition_id) as total_compositions
      FROM publishing_royalties pr
      JOIN compositions c ON pr.composition_id = c.id
      WHERE c.artist_id IN (SELECT id FROM artists WHERE user_id = ?)
    `).get(req.user.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen editorial' });
  }
};
