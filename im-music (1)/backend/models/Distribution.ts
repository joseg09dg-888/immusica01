import db from '../config/database';

export interface StoreDistribution {
  id: number;
  track_id: number;
  platform: string;
  status: string;
  distributed_at: string | null;
  created_at: string;
}

export const createDistribution = (trackId: number, platform: string, status: string = 'pending') => {
  const stmt = db.prepare(`
    INSERT INTO store_distributions (track_id, platform, status)
    VALUES (?, ?, ?)
  `);
  return stmt.run(trackId, platform, status);
};

export const getDistributionsByTrack = (trackId: number): StoreDistribution[] => {
  return db.prepare('SELECT * FROM store_distributions WHERE track_id = ?').all(trackId) as StoreDistribution[];
};

export const updateDistributionStatus = (id: number, status: string, distributedAt?: string) => {
  if (distributedAt) {
    return db.prepare('UPDATE store_distributions SET status = ?, distributed_at = ? WHERE id = ?').run(status, distributedAt, id);
  }
  return db.prepare('UPDATE store_distributions SET status = ? WHERE id = ?').run(status, id);
};
