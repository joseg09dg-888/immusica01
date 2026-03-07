import db from '../config/database';

export interface FinancingEligibility {
  id: number;
  artist_id: number;
  ingresos_anuales: number | null;
  numero_canciones_publicadas: number | null;
  es_propietario_masters: boolean | null;
  puntuacion_total: number | null;
  es_elegible: boolean | null;
  fecha_ultima_evaluacion: string | null;
  nombre_completo: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
}

export const createOrUpdateEligibility = (artistId: number, data: Partial<FinancingEligibility>) => {
  const existing = db.prepare('SELECT id FROM financing_eligibility WHERE artist_id = ?').get(artistId);

  if (existing) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = db.prepare(`UPDATE financing_eligibility SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?`);
    return stmt.run(...values, artistId);
  } else {
    const keys = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const stmt = db.prepare(`INSERT INTO financing_eligibility (artist_id, ${keys}) VALUES (?, ${placeholders})`);
    return stmt.run(artistId, ...values);
  }
};

export const getEligibilityByArtist = (artistId: number): FinancingEligibility | undefined => {
  return db.prepare('SELECT * FROM financing_eligibility WHERE artist_id = ?').get(artistId) as FinancingEligibility | undefined;
};