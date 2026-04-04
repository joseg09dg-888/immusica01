import db from '../config/database';

export interface Branding {
  id: number;
  artist_id: number;
  respuestas_test: string | null;
  arquetipo: string | null;
  manifiesto: string | null;
  colores: string | null;
  olores: string | null;
  sabores: string | null;
  texturas: string | null;
  lenguaje_tribu: string | null;
  simbolo: string | null;
  mercados_prioritarios: string | null;
  perfil_oyente: string | null;
  plan_contenidos: string | null;
  fecha_generacion_plan: string | null;
  created_at: string;
  updated_at: string;
}

export const createOrUpdateBranding = async (artistId: number, data: Partial<Branding>) => {
  const existing = await db.prepare('SELECT id FROM artist_branding WHERE artist_id = ?').get(artistId);

  if (existing) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    return db.prepare(`UPDATE artist_branding SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?`).run(...values, artistId);
  } else {
    const keys = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    return db.prepare(`INSERT INTO artist_branding (artist_id, ${keys}) VALUES (?, ${placeholders})`).run(artistId, ...values);
  }
};

export const getBrandingByArtist = async (artistId: number): Promise<Branding | undefined> => {
  return db.prepare('SELECT * FROM artist_branding WHERE artist_id = ?').get(artistId) as Promise<Branding | undefined>;
};
