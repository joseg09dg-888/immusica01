import db from '../config/database';

export interface Royalty {
  id: number;
  artist_id: number | null;
  fecha: string;
  plataforma: string;
  tipo: string | null;
  cantidad: number;
  track_id: number | null;
  concepto: string | null;
  estado: string;
  created_at: string;
}

export const createRoyalty = (data: Omit<Royalty, 'id' | 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO royalties (artist_id, fecha, plataforma, tipo, cantidad, track_id, concepto, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.artist_id, data.fecha, data.plataforma, data.tipo, data.cantidad, data.track_id, data.concepto, data.estado);
};

export const getRoyaltiesByArtist = (artistId: number): Royalty[] => {
  return db.prepare(`
    SELECT * FROM royalties 
    WHERE artist_id = ? OR track_id IN (SELECT id FROM tracks WHERE artist_id = ?)
    ORDER BY fecha DESC
  `).all(artistId, artistId) as Royalty[];
};

export const getAllRoyalties = (): Royalty[] => {
  return db.prepare('SELECT * FROM royalties ORDER BY fecha DESC').all() as Royalty[];
};

export const getSummary = (artistId?: number) => {
  let query = `
    SELECT 
      SUM(cantidad) as total,
      plataforma,
      strftime('%Y-%m', fecha) as mes
    FROM royalties r
    LEFT JOIN tracks t ON r.track_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (artistId) {
    query += ' AND (t.artist_id = ? OR r.track_id IS NULL)';
    params.push(artistId);
  }
  query += ' GROUP BY plataforma, mes ORDER BY mes DESC';
  const rows = db.prepare(query).all(...params) as any[];
  
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const byPlatformMap = rows.reduce((acc: any, r) => {
    if (!acc[r.plataforma]) acc[r.plataforma] = 0;
    acc[r.plataforma] += r.total;
    return acc;
  }, {});
  
  const byPlatform = Object.entries(byPlatformMap).map(([platform, total]) => ({
    platform,
    total
  }));

  const byMonthMap = rows.reduce((acc: any, r) => {
    if (!acc[r.mes]) acc[r.mes] = 0;
    acc[r.mes] += r.total;
    return acc;
  }, {});

  const byMonth = Object.entries(byMonthMap).map(([mes, total]) => ({
    mes,
    total
  }));
  
  return { total, byPlatform, byMonth };
};
