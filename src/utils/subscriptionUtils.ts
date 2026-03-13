import db from '../database';

/**
 * Obtiene el número máximo de artistas permitido para un usuario según su suscripción activa.
 * Si no tiene suscripción activa, retorna 0 (no puede crear artistas).
 */
export const getUserMaxArtists = (userId: number): number => {
  const subscription = db.prepare(`
    SELECT max_artists FROM subscriptions
    WHERE user_email = (SELECT email FROM users WHERE id = ?)
    AND status = 'ACTIVE'
    ORDER BY start_date DESC LIMIT 1
  `).get(userId) as { max_artists: number } | undefined;

  return subscription?.max_artists || 0;
};

/**
 * Cuenta cuántos artistas tiene el usuario como 'owner' (propietario).
 */
export const countUserArtists = (userId: number): number => {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM user_artists
    WHERE user_id = ? AND role = 'owner'
  `).get(userId) as { count: number };
  return result.count;
};

/**
 * Verifica si el usuario puede agregar un nuevo artista.
 */
export const canUserAddArtist = (userId: number): boolean => {
  const max = getUserMaxArtists(userId);
  if (max === 0) return false;
  const current = countUserArtists(userId);
  return current < max;
};

/**
 * Obtiene el límite y el número actual para mostrarlo en el frontend.
 */
export const getUserArtistLimitInfo = (userId: number): { max: number; current: number; canAdd: boolean } => {
  const max = getUserMaxArtists(userId);
  const current = countUserArtists(userId);
  return { max, current, canAdd: current < max };
};