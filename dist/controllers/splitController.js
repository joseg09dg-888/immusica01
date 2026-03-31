"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSplit = exports.getPendingSplits = exports.getSplits = exports.rejectSplit = exports.acceptSplit = exports.addSplit = void 0;
const database_1 = __importDefault(require("../database"));
const crypto_1 = __importDefault(require("crypto"));
// Generar token único para invitación
const generateToken = () => crypto_1.default.randomBytes(32).toString('hex');
// Crear un split (invitación)
const addSplit = (req, res) => {
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
    const trackStmt = database_1.default.prepare('SELECT id, artist_id FROM tracks WHERE id = ?');
    const track = trackStmt.get(trackId);
    if (!track) {
        return res.status(404).json({ error: 'Track no encontrado' });
    }
    // Calcular suma actual de splits (solo los aceptados)
    const sumStmt = database_1.default.prepare('SELECT SUM(percentage) as total FROM splits WHERE track_id = ? AND status = "accepted"');
    const sumResult = sumStmt.get(trackId);
    const total = sumResult?.total || 0;
    if (total + percent > 100) {
        return res.status(400).json({ error: 'La suma de porcentajes supera 100%' });
    }
    // Generar token único
    const token = generateToken();
    // Insertar split con estado 'pending'
    const insertSplit = database_1.default.prepare(`
    INSERT INTO splits (track_id, artist_name, email, role, percentage, status, invitation_token)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `);
    const result = insertSplit.run(trackId, name, email, role || 'collaborator', percent, token);
    const splitId = result.lastInsertRowid;
    // Insertar invitación
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // válida por 30 días
    const insertInvitation = database_1.default.prepare(`
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
exports.addSplit = addSplit;
// Aceptar invitación
const acceptSplit = (req, res) => {
    const { token } = req.params;
    // Buscar la invitación
    const invitationStmt = database_1.default.prepare(`
    SELECT si.*, s.track_id, s.percentage, s.artist_name
    FROM split_invitations si
    JOIN splits s ON si.split_id = s.id
    WHERE si.token = ? AND si.status = 'pending'
  `);
    const invitation = invitationStmt.get(token);
    if (!invitation) {
        return res.status(404).json({ error: 'Invitación no válida o ya expiró' });
    }
    // Verificar si expiró
    const now = new Date();
    const expires = new Date(invitation.expires_at);
    if (now > expires) {
        // Marcar como expirada
        database_1.default.prepare('UPDATE split_invitations SET status = "expired" WHERE id = ?').run(invitation.id);
        return res.status(400).json({ error: 'La invitación ha expirado' });
    }
    // Actualizar split a 'accepted'
    database_1.default.prepare('UPDATE splits SET status = "accepted", accepted_at = ? WHERE id = ?').run(now.toISOString(), invitation.split_id);
    // Marcar invitación como aceptada
    database_1.default.prepare('UPDATE split_invitations SET status = "accepted" WHERE id = ?').run(invitation.id);
    res.json({ message: 'Split aceptado correctamente' });
};
exports.acceptSplit = acceptSplit;
// Rechazar invitación
const rejectSplit = (req, res) => {
    const { token } = req.params;
    const splitStmt = database_1.default.prepare(`
    SELECT s.id as split_id
    FROM split_invitations si
    JOIN splits s ON si.split_id = s.id
    WHERE si.token = ? AND si.status = 'pending'
  `);
    const split = splitStmt.get(token);
    if (!split) {
        return res.status(404).json({ error: 'Invitación no encontrada' });
    }
    // Eliminar el split (o marcarlo como rechazado)
    database_1.default.prepare('DELETE FROM splits WHERE id = ?').run(split.split_id);
    database_1.default.prepare('UPDATE split_invitations SET status = "rejected" WHERE token = ?').run(token);
    res.json({ message: 'Split rechazado' });
};
exports.rejectSplit = rejectSplit;
// Obtener splits de un track (solo aceptados)
const getSplits = (req, res) => {
    const { trackId } = req.params;
    const splits = database_1.default.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "accepted"').all(trackId);
    res.json(splits);
};
exports.getSplits = getSplits;
// Obtener splits pendientes de un track
const getPendingSplits = (req, res) => {
    const { trackId } = req.params;
    const splits = database_1.default.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "pending"').all(trackId);
    res.json(splits);
};
exports.getPendingSplits = getPendingSplits;
// Eliminar un split (solo si está pendiente)
const deleteSplit = (req, res) => {
    const { splitId } = req.params;
    const split = database_1.default.prepare('SELECT status FROM splits WHERE id = ?').get(splitId);
    if (!split)
        return res.status(404).json({ error: 'Split no encontrado' });
    if (split.status !== 'pending') {
        return res.status(400).json({ error: 'Solo se pueden eliminar splits pendientes' });
    }
    database_1.default.prepare('DELETE FROM splits WHERE id = ?').run(splitId);
    database_1.default.prepare('DELETE FROM split_invitations WHERE split_id = ?').run(splitId);
    res.json({ success: true });
};
exports.deleteSplit = deleteSplit;
