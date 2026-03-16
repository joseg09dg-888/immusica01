import db from '../config/database';

export interface YoutubeContentId {
  id: number;
  track_id: number;
  registration_id: string;
  status: string;
  created_at: string;
}

export const registerContentId = (trackId: number, registrationId: string) => {
  const stmt = db.prepare(`
    INSERT INTO youtube_content_id (track_id, registration_id)
    VALUES (?, ?)
  `);
  return stmt.run(trackId, registrationId);
};

export const getContentIdByTrack = (trackId: number): YoutubeContentId | undefined => {
  return db.prepare('SELECT * FROM youtube_content_id WHERE track_id = ?').get(trackId) as YoutubeContentId | undefined;
};

export const getAllContentIdsByArtist = (artistId: number): YoutubeContentId[] => {
  return db.prepare(`
    SELECT y.* FROM youtube_content_id y
    JOIN tracks t ON y.track_id = t.id
    WHERE t.artist_id = ?
  `).all(artistId) as YoutubeContentId[];
};
