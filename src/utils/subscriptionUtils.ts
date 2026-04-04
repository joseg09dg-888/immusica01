import db from '../database';

export const getUserMaxArtists = async (userId: number): Promise<number> => {
  const subscription = await db.prepare(`
    SELECT max_artists FROM subscriptions
    WHERE user_email = (SELECT email FROM users WHERE id = ?)
    AND status = 'ACTIVE'
    ORDER BY start_date DESC LIMIT 1
  `).get(userId) as { max_artists: number } | undefined;

  return subscription?.max_artists || 0;
};

export const countUserArtists = async (userId: number): Promise<number> => {
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM user_artists
    WHERE user_id = ? AND role = 'owner'
  `).get(userId) as { count: number };
  return result.count;
};

export const canUserAddArtist = async (userId: number): Promise<boolean> => {
  const max = await getUserMaxArtists(userId);
  if (max === 0) return false;
  const current = await countUserArtists(userId);
  return current < max;
};

export const getUserArtistLimitInfo = async (userId: number): Promise<{ max: number; current: number; canAdd: boolean }> => {
  const max = await getUserMaxArtists(userId);
  const current = await countUserArtists(userId);
  return { max, current, canAdd: current < max };
};
