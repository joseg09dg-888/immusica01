import db from '../config/database';

export interface Beat {
  id: number;
  productor_id: number; // ID del artista que vende
  titulo: string;
  genero: string;
  bpm: number | null;
  tonalidad: string | null;
  precio: number; // en centavos (ej. 2999 = $29.99)
  archivo_url: string | null; // URL del archivo de audio (demo)
  archivo_completo_url: string | null; // URL del archivo completo (se entrega al comprar)
  portada_url: string | null;
  descripcion: string | null;
  estado: string; // 'disponible', 'vendido', 'oculto'
  created_at: string;
  updated_at: string;
}

export const createBeat = (data: Omit<Beat, 'id' | 'created_at' | 'updated_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO beats (productor_id, titulo, genero, bpm, tonalidad, precio, archivo_url, archivo_completo_url, portada_url, descripcion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.productor_id,
    data.titulo,
    data.genero,
    data.bpm,
    data.tonalidad,
    data.precio,
    data.archivo_url,
    data.archivo_completo_url,
    data.portada_url,
    data.descripcion,
    data.estado || 'disponible'
  );
};

export const getBeatById = (id: number): Beat | undefined => {
  return db.prepare('SELECT * FROM beats WHERE id = ?').get(id) as Beat | undefined;
};

export const getAllBeats = (filtros?: { genero?: string; orden?: string }): Beat[] => {
  let query = 'SELECT * FROM beats WHERE estado = "disponible"';
  const params: any[] = [];
  
  if (filtros?.genero) {
    query += ' AND genero = ?';
    params.push(filtros.genero);
  }
  
  if (filtros?.orden === 'mas_comprados') {
    // Necesitamos JOIN con compras para contar
    // Por ahora, lo dejamos simple
    query += ' ORDER BY id DESC';
  } else if (filtros?.orden === 'mejor_puntuados') {
    // Necesitamos JOIN con valoraciones
    query += ' ORDER BY id DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }
  
  return db.prepare(query).all(...params) as Beat[];
};

export const getBeatsByProducer = (productorId: number): Beat[] => {
  return db.prepare('SELECT * FROM beats WHERE productor_id = ? ORDER BY created_at DESC').all(productorId) as Beat[];
};

export const updateBeat = (id: number, data: Partial<Beat>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  const stmt = db.prepare(`UPDATE beats SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  return stmt.run(...values, id);
};

export const deleteBeat = (id: number) => {
  return db.prepare('DELETE FROM beats WHERE id = ?').run(id);
};