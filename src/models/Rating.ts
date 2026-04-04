import db from '../config/database';

export interface Rating {
  id: number;
  beat_id: number;
  usuario_id: number;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
}

export const createRating = async (data: Omit<Rating, 'id' | 'created_at'>) => {
  const existing = await db.prepare('SELECT id FROM ratings WHERE beat_id = ? AND usuario_id = ?').get(data.beat_id, data.usuario_id);
  if (existing) {
    return db.prepare('UPDATE ratings SET puntuacion = ?, comentario = ? WHERE beat_id = ? AND usuario_id = ?').run(data.puntuacion, data.comentario, data.beat_id, data.usuario_id);
  } else {
    return db.prepare('INSERT INTO ratings (beat_id, usuario_id, puntuacion, comentario) VALUES (?, ?, ?, ?)').run(data.beat_id, data.usuario_id, data.puntuacion, data.comentario);
  }
};

export const getRatingsByBeat = async (beatId: number): Promise<Rating[]> => {
  return db.prepare('SELECT * FROM ratings WHERE beat_id = ? ORDER BY created_at DESC').all(beatId) as Promise<Rating[]>;
};

export const getAverageRatingByBeat = async (beatId: number): Promise<number> => {
  const result = await db.prepare('SELECT AVG(puntuacion) as promedio FROM ratings WHERE beat_id = ?').get(beatId) as { promedio: number };
  return result.promedio || 0;
};

export const getRatingsByUser = async (usuarioId: number): Promise<Rating[]> => {
  return db.prepare('SELECT * FROM ratings WHERE usuario_id = ? ORDER BY created_at DESC').all(usuarioId) as Promise<Rating[]>;
};
