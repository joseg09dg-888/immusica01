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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArtist = exports.updateArtist = exports.getArtistById = exports.getArtistLimit = exports.createArtist = exports.getMyArtists = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const UserArtistModel = __importStar(require("../models/UserArtist"));
const subscriptionUtils_1 = require("../utils/subscriptionUtils");
// Obtener todos los artistas del usuario autenticado
const getMyArtists = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Usar UserArtistModel, no ArtistModel
        const artists = UserArtistModel.getArtistsByUser(req.user.id);
        res.json(artists);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener artistas' });
    }
};
exports.getMyArtists = getMyArtists;
// Crear un nuevo artista (solo si no se ha alcanzado el límite)
const createArtist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Verificar límite
        if (!(0, subscriptionUtils_1.canUserAddArtist)(req.user.id)) {
            const info = (0, subscriptionUtils_1.getUserArtistLimitInfo)(req.user.id);
            return res.status(403).json({
                error: `Has alcanzado el límite de artistas de tu plan (${info.current}/${info.max}). Mejora tu plan para crear más.`
            });
        }
        const { name, genre, bio, tier, avatar } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del artista es obligatorio' });
        }
        // Crear el artista
        const artistId = ArtistModel.createArtist({
            user_id: req.user.id,
            name,
            genre,
            bio,
            tier: tier || 'Basic',
            avatar
        });
        // Asociar al usuario como owner
        UserArtistModel.assignUserToArtist(req.user.id, artistId, 'owner');
        res.status(201).json({ id: artistId, message: 'Artista creado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear artista' });
    }
};
exports.createArtist = createArtist;
// Obtener información del límite (útil para el frontend)
const getArtistLimit = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const info = (0, subscriptionUtils_1.getUserArtistLimitInfo)(req.user.id);
        res.json(info);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener límite' });
    }
};
exports.getArtistLimit = getArtistLimit;
// Obtener un artista por ID (solo si el usuario tiene acceso)
const getArtistById = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Manejar correctamente el parámetro id (puede ser string o string[])
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const artistId = parseInt(idStr, 10);
        if (isNaN(artistId)) {
            return res.status(400).json({ error: 'ID de artista inválido' });
        }
        // Verificar que el usuario tiene acceso a ese artista
        const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
        if (!role) {
            return res.status(403).json({ error: 'No tienes acceso a este artista' });
        }
        const artist = ArtistModel.getArtistById(artistId);
        if (!artist)
            return res.status(404).json({ error: 'Artista no encontrado' });
        res.json(artist);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener artista' });
    }
};
exports.getArtistById = getArtistById;
// Actualizar artista (solo owner o manager)
const updateArtist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const artistId = parseInt(idStr, 10);
        if (isNaN(artistId)) {
            return res.status(400).json({ error: 'ID de artista inválido' });
        }
        const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
        if (!role || (role !== 'owner' && role !== 'manager')) {
            return res.status(403).json({ error: 'No tienes permiso para editar este artista' });
        }
        const { name, genre, bio, tier, avatar } = req.body;
        ArtistModel.updateArtist(artistId, { name, genre, bio, tier, avatar });
        res.json({ message: 'Artista actualizado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar artista' });
    }
};
exports.updateArtist = updateArtist;
// Eliminar artista (solo owner)
const deleteArtist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const artistId = parseInt(idStr, 10);
        if (isNaN(artistId)) {
            return res.status(400).json({ error: 'ID de artista inválido' });
        }
        const role = await UserArtistModel.getUserArtistRole(req.user.id, artistId);
        if (role !== 'owner') {
            return res.status(403).json({ error: 'Solo el propietario puede eliminar el artista' });
        }
        ArtistModel.deleteArtist(artistId);
        res.json({ message: 'Artista eliminado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar artista' });
    }
};
exports.deleteArtist = deleteArtist;
