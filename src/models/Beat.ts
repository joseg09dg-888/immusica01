import db from '../config/database';

export interface Beat {
  id: number;
  productor_id: number;
  titulo: string;
  genero: string;
  bpm: number | null;
  tonalidad: string | null;
  precio: number;
  archivo_url: string | null;
  archivo_completo_url: string | null;
  portada_url: string | null;
  descripcion: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export const createBeat = async (data: Omit<Beat, 'id' | 'created_at' | 'updated_at'>) => {
  return db.prepare(`
    INSERT INTO beats (productor_id, titulo, genero, bpm, tonalidad, precio, archivo_url, archivo_completo_url, portada_url, descripcion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.productor_id, data.titulo, data.genero, data.bpm, data.tonalidad, data.precio,
    data.archivo_url, data.archivo_completo_url, data.portada_url, data.descripcion, data.estado || 'disponible'
  );
};

export const getBeatById = async (id: number): Promise<Beat | undefined> => {
  return db.prepare('SELECT * FROM beats WHERE id = ?').get(id) as Promise<Beat | undefined>;
};

export const getAllBeats = async (filtros?: { genero?: string; orden?: string }): Promise<Beat[]> => {
  let query = "SELECT * FROM beats WHERE estado = 'disponible'";
  const params: any[] = [];

  if (filtros?.genero) {
    query += ' AND genero = ?';
    params.push(filtros.genero);
  }
  query += ' ORDER BY created_at DESC';

  return db.prepare(query).all(...params) as Promise<Beat[]>;
};

export const getBeatsByProducer = async (productorId: number): Promise<Beat[]> => {
  return db.prepare('SELECT * FROM beats WHERE productor_id = ? ORDER BY created_at DESC').all(productorId) as Promise<Beat[]>;
};

export const updateBeat = async (id: number, data: Partial<Beat>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  return db.prepare(`UPDATE beats SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
};

export const deleteBeat = async (id: number) => {
  return db.prepare('DELETE FROM beats WHERE id = ?').run(id);
};
