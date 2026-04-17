import db from '../database';

export const getUserMaxArtists = async (userId: number): Promise<number> => {
  try {
    const subscription = await db.prepare(`
      SELECT plan_id FROM subscriptions
      WHERE user_email = (SELECT email FROM users WHERE id = ?)
      AND status IN ('active', 'ACTIVE')
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) as { plan_id: string } | undefined;
    const plan = subscription?.plan_id?.toLowerCase() || '';
    if (plan === 'pro' || plan === 'label') return 999;
    if (plan === 'indie' || plan === 'basic') return 3;
    return 1;  // default: 1 artist allowed without subscription
  } catch {
    return 1;  // column missing or table issue — allow 1 artist
  }
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
