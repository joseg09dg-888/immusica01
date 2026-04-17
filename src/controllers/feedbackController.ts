import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

// ============================================
// ENVIAR UNA SUGERENCIA O REPORTE
// ============================================
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { type, title, description, priority } = req.body;
    if (!type || !title || !description) {
      return res.status(400).json({ error: 'type, title y description son obligatorios' });
    }

    const insert = db.prepare(`
      INSERT INTO feedback (user_id, type, title, description, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    const result = await insert.run(req.user.id, type, title, description);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Feedback enviado correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar feedback' });
  }
};

// ============================================
// LISTAR MIS FEEDBACKS (usuario autenticado)
// ============================================
export const getMyFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const feedbacks = await db.prepare(`
      SELECT * FROM feedback
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener feedbacks' });
  }
};

// ============================================
// OBTENER UN FEEDBACK POR ID (solo admin o propietario)
// ============================================
export const getFeedbackById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    // Convertir a string seguro (maneja arrays)
    const idStr = Array.isArray(id) ? id[0] : id;
    const idNum = parseInt(idStr, 10);
    if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

    const feedback = await db.prepare(`
      SELECT * FROM feedback WHERE id = ?
    `).get(idNum) as any;

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback no encontrado' });
    }

    // Solo el propietario o admin pueden verlo
    if (feedback.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver este feedback' });
    }

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener feedback' });
  }
};

// ============================================
// ACTUALIZAR ESTADO DE UN FEEDBACK (solo admin)
// ============================================
export const updateFeedbackStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado' });
    }

    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const idNum = parseInt(idStr, 10);
    if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'reviewing', 'implemented', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    db.prepare(`
      UPDATE feedback SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, admin_notes || null, idNum);

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar feedback' });
  }
};

// ============================================
// LISTAR TODOS LOS FEEDBACKS (solo admin)
// ============================================
export const getAllFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores' });
    }

    const feedbacks = await db.prepare(`
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `).all();

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener feedbacks' });
  }
};