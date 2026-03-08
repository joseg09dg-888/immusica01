import db from '../config/database';

export interface UploadJob {
  id: number;
  artist_id: number;
  status: string;
  progress: number;
  total_items: number;
  processed_items: number;
  created_at: string;
  completed_at: string | null;
}

export interface UploadItem {
  id: number;
  job_id: number;
  original_filename: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  extracted_data: string | null;      // <--- estaba faltando
  suggested_track_id: number | null;  // <--- estaba faltando
  status: string;
  error: string | null;                // <--- estaba faltando
  created_at: string;
  processed_at: string | null;
}

export interface Split {
  id: number;
  track_id: number;
  artist_name: string;
  role: string;
  percentage: number;
  contract_ref: string | null;
  created_at: string;
}

// ========== JOBS ==========
export const createUploadJob = (artistId: number) => {
  const stmt = db.prepare(`
    INSERT INTO upload_jobs (artist_id, status, progress, total_items, processed_items)
    VALUES (?, 'pending', 0, 0, 0)
  `);
  return stmt.run(artistId);
};

export const getUploadJobById = (id: number): UploadJob | undefined => {
  return db.prepare('SELECT * FROM upload_jobs WHERE id = ?').get(id) as UploadJob | undefined;
};

export const updateUploadJob = (id: number, data: Partial<UploadJob>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  const stmt = db.prepare(`UPDATE upload_jobs SET ${fields} WHERE id = ?`);
  return stmt.run(...values, id);
};

// ========== ITEMS ==========
export const createUploadItem = (data: Omit<UploadItem, 'id' | 'created_at' | 'processed_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO upload_items (
      job_id, original_filename, file_path, file_type, mime_type, file_size,
      extracted_data, suggested_track_id, status, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.job_id,
    data.original_filename,
    data.file_path,
    data.file_type,
    data.mime_type,
    data.file_size,
    data.extracted_data,
    data.suggested_track_id,
    data.status,
    data.error
  );
};

export const getUploadItemsByJob = (jobId: number): UploadItem[] => {
  return db.prepare('SELECT * FROM upload_items WHERE job_id = ? ORDER BY id').all(jobId) as UploadItem[];
};

export const updateUploadItem = (id: number, data: Partial<UploadItem>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  const stmt = db.prepare(`UPDATE upload_items SET ${fields} WHERE id = ?`);
  return stmt.run(...values, id);
};

// ========== SPLITS ==========
export const createSplit = (data: Omit<Split, 'id' | 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO splits (track_id, artist_name, role, percentage, contract_ref)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.track_id, data.artist_name, data.role, data.percentage, data.contract_ref);
};

export const getSplitsByTrack = (trackId: number): Split[] => {
  return db.prepare('SELECT * FROM splits WHERE track_id = ?').all(trackId) as Split[];
};