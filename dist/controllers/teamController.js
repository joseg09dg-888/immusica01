"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTeamMember = exports.createTeam = exports.getArtistUsers = exports.getMyArtists = exports.removeArtistFromUser = exports.assignArtistToUser = void 0;
const database_1 = __importDefault(require("../database"));
const UserArtistModel = __importStar(require("../models/UserArtist"));
const ArtistModel = __importStar(require("../models/Artist"));
const subscriptionUtils_1 = require("../utils/subscriptionUtils");
// ============================================
// GESTIÓN DE ARTISTAS ASIGNADOS
// ============================================
// Asignar un artista a otro usuario (manager)
const assignArtistToUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
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
        const user = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userIdNum);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Validar límite para el usuario destino
        if (!(0, subscriptionUtils_1.canUserAddArtist)(userIdNum)) {
            const info = (0, subscriptionUtils_1.getUserArtistLimitInfo)(userIdNum);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al asignar usuario' });
    }
};
exports.assignArtistToUser = assignArtistToUser;
// Quitar acceso de un usuario a un artista
const removeArtistFromUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al remover acceso' });
    }
};
exports.removeArtistFromUser = removeArtistFromUser;
// Listar artistas a los que tiene acceso el usuario actual
const getMyArtists = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = UserArtistModel.getArtistsByUser(req.user.id);
        res.json(artists);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener artistas' });
    }
};
exports.getMyArtists = getMyArtists;
// Listar usuarios con acceso a un artista (solo para owners)
const getArtistUsers = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
exports.getArtistUsers = getArtistUsers;
// ============================================
// GESTIÓN DE EQUIPOS (SELLOS) - OPCIONAL
// ============================================
const createTeam = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
        }
        const insert = database_1.default.prepare(`
      INSERT INTO teams (name, owner_id)
      VALUES (?, ?)
    `);
        const result = insert.run(name, req.user.id);
        database_1.default.prepare(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (?, ?, 'admin')
    `).run(result.lastInsertRowid, req.user.id);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Equipo creado correctamente'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear equipo' });
    }
};
exports.createTeam = createTeam;
const addTeamMember = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { teamId } = req.params;
        const { userId, role } = req.body;
        // Convertir a números
        const teamIdStr = Array.isArray(teamId) ? teamId[0] : teamId;
        const teamIdNum = parseInt(teamIdStr);
        const userIdNum = parseInt(userId);
        if (isNaN(teamIdNum) || isNaN(userIdNum)) {
            return res.status(400).json({ error: 'IDs inválidos' });
        }
        const member = database_1.default.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamIdNum, req.user.id);
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para agregar miembros' });
        }
        database_1.default.prepare(`
      INSERT OR IGNORE INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(teamIdNum, userIdNum, role || 'member');
        res.json({ message: 'Miembro agregado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar miembro' });
    }
};
exports.addTeamMember = addTeamMember;
