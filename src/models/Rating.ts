import db from '../config/database';

export interface Rating {
  id: number;
  beat_id: number;
  usuario_id: number; // quien valora
  puntuacion: number; // 1 a 5
  comentario: string | null;
  created_at: string;
}

export const createRating = (data: Omit<Rating, 'id' | 'created_at'>) => {
  // Evitar duplicados (un usuario no puede valorar dos veces el mismo beat)
  const existing = db.prepare('SELECT id FROM ratings WHERE beat_id = ? AND usuario_id = ?').get(data.beat_id, data.usuario_id);
  if (existing) {
    // Actualizar en lugar de insertar
    const stmt = db.prepare('UPDATE ratings SET puntuacion = ?, comentario = ? WHERE beat_id = ? AND usuario_id = ?');
    return stmt.run(data.puntuacion, data.comentario, data.beat_id, data.usuario_id);
  } else {
    const stmt = db.prepare('INSERT INTO ratings (beat_id, usuario_id, puntuacion, comentario) VALUES (?, ?, ?, ?)');
    return stmt.run(data.beat_id, data.usuario_id, data.puntuacion, data.comentario);
  }
};

export const getRatingsByBeat = (beatId: number): Rating[] => {
  return db.prepare('SELECT * FROM ratings WHERE beat_id = ? ORDER BY created_at DESC').all(beatId) as Rating[];
};

export const getAverageRatingByBeat = (beatId: number): number => {
  const result = db.prepare('SELECT AVG(puntuacion) as promedio FROM ratings WHERE beat_id = ?').get(beatId) as { promedio: number };
  return result.promedio || 0;
};

export const getRatingsByUser = (usuarioId: number): Rating[] => {
  return db.prepare('SELECT * FROM ratings WHERE usuario_id = ? ORDER BY created_at DESC').all(usuarioId) as Rating[];
};