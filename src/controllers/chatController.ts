import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import { moderateMessage } from '../services/moderationService';
import { io } from '../app'; // lo necesitamos para emitir mensajes

// Enviar un mensaje al chat
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { message, link } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Verificar si el usuario está baneado
    const ban = await db.prepare('SELECT * FROM chat_bans WHERE user_id = ?').get(req.user.id) as any;
    if (ban) {
      if (ban.permanently_banned) {
        return res.status(403).json({ error: 'Has sido baneado permanentemente del chat' });
      }
      if (ban.ban_expires_at && new Date(ban.ban_expires_at) > new Date()) {
        const expires = new Date(ban.ban_expires_at).toLocaleString();
        return res.status(403).json({ error: `Estás baneado hasta ${expires}` });
      }
    }

    // Obtener nombre del usuario (de la tabla users)
    const user = await db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id) as any;
    const userName = user?.name || 'Usuario';

    // Moderar el mensaje con IA
    const moderation = await moderateMessage(message);
    if (moderation.flagged) {
      // Registrar infracción
      const insertInfraction = db.prepare(`
        INSERT INTO user_infractions (user_id, reason, message)
        VALUES (?, ?, ?)
      `);
      await insertInfraction.run(req.user.id, moderation.reason || 'Lenguaje inapropiado', message);

      // Actualizar contador de strikes y posible baneo
      await updateUserBans(req.user.id, moderation.severity || 'medium');

      return res.status(400).json({
        error: 'Mensaje inapropiado detectado',
        reason: moderation.reason,
        severity: moderation.severity
      });
    }

    // Guardar mensaje en la base de datos
    const newMessage = await db.prepare(`
      INSERT INTO chat_messages (user_id, user_name, message, link)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).get(req.user.id, userName, message, link || null) || { user_id: req.user.id, user_name: userName, message, created_at: new Date().toISOString() };

    // Emitir el mensaje a todos los clientes conectados
    io.emit('new-message', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

// Obtener mensajes recientes (para cargar el chat)
export const getRecentMessages = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await db.prepare(`
      SELECT * FROM chat_messages
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// Reportar un mensaje (para moderación humana)
export const reportMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  try {
    await db.prepare('UPDATE chat_messages SET flagged = 1 WHERE id = ?').run(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reportar mensaje' });
  }
};

// Función auxiliar para actualizar baneos según strikes
async function updateUserBans(userId: number, severity: string) {
  let ban = await db.prepare('SELECT * FROM chat_bans WHERE user_id = ?').get(userId) as any;
  const now = new Date();

  if (!ban) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    await db.prepare(`
      INSERT INTO chat_bans (user_id, strike_count, ban_expires_at)
      VALUES (?, 1, ?)
    `).run(userId, expires.toISOString());
    return;
  }

  let newStrikeCount = ban.strike_count + 1;
  let permanentlyBanned = false;
  let banExpiresAt = null;

  if (newStrikeCount >= 3) {
    permanentlyBanned = true;
  } else if (newStrikeCount === 2) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    banExpiresAt = expires.toISOString();
  } else {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    banExpiresAt = expires.toISOString();
  }

  await db.prepare(`
    UPDATE chat_bans
    SET strike_count = ?, permanently_banned = ?, ban_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(newStrikeCount, permanentlyBanned ? 1 : 0, banExpiresAt, userId);
}