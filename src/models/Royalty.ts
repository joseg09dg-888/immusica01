import db from '../config/database';

export interface Royalty {
  id: number;
  fecha: string;
  plataforma: string;
  tipo: string | null;
  cantidad: number;
  track_id: number | null;
  concepto: string | null;
  estado: string;
  created_at: string;
}

export const createRoyalty = async (data: Omit<Royalty, 'id' | 'created_at'>) => {
  return db.prepare(`
    INSERT INTO royalties (fecha, plataforma, tipo, cantidad, track_id, concepto, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.fecha, data.plataforma, data.tipo, data.cantidad, data.track_id, data.concepto, data.estado);
};

export const getRoyaltiesByArtist = async (artistId: number): Promise<Royalty[]> => {
  return db.prepare(`
    SELECT r.* FROM royalties r
    LEFT JOIN tracks t ON r.track_id = t.id
    WHERE t.artist_id = ? OR r.track_id IS NULL
    ORDER BY r.fecha DESC
  `).all(artistId) as Promise<Royalty[]>;
};

export const getAllRoyalties = async (): Promise<Royalty[]> => {
  return db.prepare('SELECT * FROM royalties ORDER BY fecha DESC').all() as Promise<Royalty[]>;
};

export const getSummary = async (artistId?: number) => {
  let query = `
    SELECT
      SUM(cantidad) as total,
      plataforma,
      TO_CHAR(COALESCE(fecha::timestamp, NOW()), 'YYYY-MM') as mes
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
  const rows = await db.prepare(query).all(...params) as any[];

  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const byPlatform = rows.reduce((acc: any, r) => {
    if (!acc[r.plataforma]) acc[r.plataforma] = 0;
    acc[r.plataforma] += r.total;
    return acc;
  }, {});
  const byMonth = rows.reduce((acc: any, r) => {
    if (!acc[r.mes]) acc[r.mes] = 0;
    acc[r.mes] += r.total;
    return acc;
  }, {});

  return { total, byPlatform, byMonth };
};
