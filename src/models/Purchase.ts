import db from '../config/database';

export interface Purchase {
  id: number;
  beat_id: number;
  comprador_id: number; // ID del artista que compra
  monto: number; // en centavos
  comision_plataforma: number; // 5% del monto
  fecha: string;
  created_at: string;
}

export const createPurchase = (data: Omit<Purchase, 'id' | 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO purchases (beat_id, comprador_id, monto, comision_plataforma, fecha)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.beat_id, data.comprador_id, data.monto, data.comision_plataforma, data.fecha);
};

export const getPurchasesByBeat = (beatId: number): Purchase[] => {
  return db.prepare('SELECT * FROM purchases WHERE beat_id = ? ORDER BY fecha DESC').all(beatId) as Purchase[];
};

export const getPurchasesByBuyer = (compradorId: number): Purchase[] => {
  return db.prepare('SELECT * FROM purchases WHERE comprador_id = ? ORDER BY fecha DESC').all(compradorId) as Purchase[];
};

export const getTotalComprasPorProductor = (productorId: number): number => {
  const result = db.prepare(`
    SELECT COUNT(*) as total FROM purchases p
    JOIN beats b ON p.beat_id = b.id
    WHERE b.productor_id = ?
  `).get(productorId) as { total: number };
  return result.total;
};

export const getTotalComprasPorComprador = (compradorId: number): number => {
  const result = db.prepare('SELECT COUNT(*) as total FROM purchases WHERE comprador_id = ?').get(compradorId) as { total: number };
  return result.total;
};