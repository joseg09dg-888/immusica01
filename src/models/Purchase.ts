import db from '../config/database';

export interface Purchase {
  id: number;
  beat_id: number;
  comprador_id: number;
  monto: number;
  comision_plataforma: number;
  fecha: string;
  created_at: string;
}

export const createPurchase = async (data: Omit<Purchase, 'id' | 'created_at'>) => {
  return db.prepare(`
    INSERT INTO purchases (beat_id, comprador_id, monto, comision_plataforma, fecha)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.beat_id, data.comprador_id, data.monto, data.comision_plataforma, data.fecha);
};

export const getPurchasesByBeat = async (beatId: number): Promise<Purchase[]> => {
  return db.prepare('SELECT * FROM purchases WHERE beat_id = ? ORDER BY fecha DESC').all(beatId) as Promise<Purchase[]>;
};

export const getPurchasesByBuyer = async (compradorId: number): Promise<Purchase[]> => {
  return db.prepare('SELECT * FROM purchases WHERE comprador_id = ? ORDER BY fecha DESC').all(compradorId) as Promise<Purchase[]>;
};

export const getTotalComprasPorProductor = async (productorId: number): Promise<number> => {
  const result = await db.prepare(`
    SELECT COUNT(*) as total FROM purchases p
    JOIN beats b ON p.beat_id = b.id
    WHERE b.productor_id = ?
  `).get(productorId) as { total: number };
  return result.total;
};

export const getTotalComprasPorComprador = async (compradorId: number): Promise<number> => {
  const result = await db.prepare('SELECT COUNT(*) as total FROM purchases WHERE comprador_id = ?').get(compradorId) as { total: number };
  return result.total;
};
