"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportMessage = exports.getRecentMessages = exports.sendMessage = void 0;
const database_1 = __importDefault(require("../database"));
const moderationService_1 = require("../services/moderationService");
const app_1 = require("../app"); // lo necesitamos para emitir mensajes
// Enviar un mensaje al chat
const sendMessage = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { message, link } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }
        // Verificar si el usuario está baneado
        const ban = database_1.default.prepare('SELECT * FROM chat_bans WHERE user_id = ?').get(req.user.id);
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
        const user = database_1.default.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
        const userName = user?.name || 'Usuario';
        // Moderar el mensaje con IA
        const moderation = await (0, moderationService_1.moderateMessage)(message);
        if (moderation.flagged) {
            // Registrar infracción
            const insertInfraction = database_1.default.prepare(`
        INSERT INTO user_infractions (user_id, reason, message)
        VALUES (?, ?, ?)
      `);
            insertInfraction.run(req.user.id, moderation.reason || 'Lenguaje inapropiado', message);
            // Actualizar contador de strikes y posible baneo
            await updateUserBans(req.user.id, moderation.severity || 'medium');
            return res.status(400).json({
                error: 'Mensaje inapropiado detectado',
                reason: moderation.reason,
                severity: moderation.severity
            });
        }
        // Guardar mensaje en la base de datos
        const insert = database_1.default.prepare(`
      INSERT INTO chat_messages (user_id, user_name, message, link)
      VALUES (?, ?, ?, ?)
    `);
        const result = insert.run(req.user.id, userName, message, link || null);
        const messageId = result.lastInsertRowid;
        // Recuperar el mensaje recién insertado
        const newMessage = database_1.default.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
        // Emitir el mensaje a todos los clientes conectados
        app_1.io.emit('new-message', newMessage);
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};
exports.sendMessage = sendMessage;
// Obtener mensajes recientes (para cargar el chat)
const getRecentMessages = (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const messages = database_1.default.prepare(`
      SELECT * FROM chat_messages
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
        res.json(messages.reverse());
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};
exports.getRecentMessages = getRecentMessages;
// Reportar un mensaje (para moderación humana)
const reportMessage = (req, res) => {
    const { messageId } = req.params;
    try {
        database_1.default.prepare('UPDATE chat_messages SET flagged = 1 WHERE id = ?').run(messageId);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al reportar mensaje' });
    }
};
exports.reportMessage = reportMessage;
// Función auxiliar para actualizar baneos según strikes
async function updateUserBans(userId, severity) {
    let ban = database_1.default.prepare('SELECT * FROM chat_bans WHERE user_id = ?').get(userId);
    const now = new Date();
    if (!ban) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        database_1.default.prepare(`
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
    }
    else if (newStrikeCount === 2) {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        banExpiresAt = expires.toISOString();
    }
    else {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        banExpiresAt = expires.toISOString();
    }
    database_1.default.prepare(`
    UPDATE chat_bans
    SET strike_count = ?, permanently_banned = ?, ban_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(newStrikeCount, permanentlyBanned ? 1 : 0, banExpiresAt, userId);
}
