"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserArtistLimitInfo = exports.canUserAddArtist = exports.countUserArtists = exports.getUserMaxArtists = void 0;
const database_1 = __importDefault(require("../database"));
/**
 * Obtiene el número máximo de artistas permitido para un usuario según su suscripción activa.
 * Si no tiene suscripción activa, retorna 0 (no puede crear artistas).
 */
const getUserMaxArtists = (userId) => {
    const subscription = database_1.default.prepare(`
    SELECT max_artists FROM subscriptions
    WHERE user_email = (SELECT email FROM users WHERE id = ?)
    AND status = 'ACTIVE'
    ORDER BY start_date DESC LIMIT 1
  `).get(userId);
    return subscription?.max_artists || 0;
};
exports.getUserMaxArtists = getUserMaxArtists;
/**
 * Cuenta cuántos artistas tiene el usuario como 'owner' (propietario).
 */
const countUserArtists = (userId) => {
    const result = database_1.default.prepare(`
    SELECT COUNT(*) as count FROM user_artists
    WHERE user_id = ? AND role = 'owner'
  `).get(userId);
    return result.count;
};
exports.countUserArtists = countUserArtists;
/**
 * Verifica si el usuario puede agregar un nuevo artista.
 */
const canUserAddArtist = (userId) => {
    const max = (0, exports.getUserMaxArtists)(userId);
    if (max === 0)
        return false;
    const current = (0, exports.countUserArtists)(userId);
    return current < max;
};
exports.canUserAddArtist = canUserAddArtist;
/**
 * Obtiene el límite y el número actual para mostrarlo en el frontend.
 */
const getUserArtistLimitInfo = (userId) => {
    const max = (0, exports.getUserMaxArtists)(userId);
    const current = (0, exports.countUserArtists)(userId);
    return { max, current, canAdd: current < max };
};
exports.getUserArtistLimitInfo = getUserArtistLimitInfo;
