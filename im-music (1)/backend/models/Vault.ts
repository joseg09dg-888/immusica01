import db from '../config/database';

export interface VaultFile {
  id: number;
  artist_id: number;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export const createVaultFile = (artistId: number, name: string, fileUrl: string, fileType?: string, fileSize?: number) => {
  const stmt = db.prepare(`
    INSERT INTO vault_files (artist_id, name, file_url, file_type, file_size)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(artistId, name, fileUrl, fileType, fileSize);
};

export const getVaultFilesByArtist = (artistId: number): VaultFile[] => {
  return db.prepare('SELECT * FROM vault_files WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as VaultFile[];
};

export const deleteVaultFile = (id: number) => {
  return db.prepare('DELETE FROM vault_files WHERE id = ?').run(id);
};
