import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as TrackModel from '../models/Track';
import * as ArtistModel from '../models/Artist';

export const getMyTracks = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // For simplicity, we get all tracks if admin, or tracks of artists owned by user
  if (req.user.role === 'admin') {
    const tracks = TrackModel.getAllTracks();
    return res.json(tracks);
  }

  const artists = ArtistModel.getArtistsByUser(req.user.id);
  const allTracks: any[] = [];
  for (const artist of artists) {
    const tracks = TrackModel.getTracksByArtist(artist.id);
    allTracks.push(...tracks);
  }
  res.json(allTracks);
};

export const createTrack = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const { artist_id, title, release_date, isrc, upc } = req.body;
  if (!artist_id || !title) return res.status(400).json({ error: 'Artist ID and title are required' });

  // Verify artist ownership
  const artist = ArtistModel.getArtistById(parseInt(artist_id));
  if (!artist || (artist.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const audio_url = req.file ? (req.file as any).path : req.body.file_url;

  const result = TrackModel.createTrack(
    parseInt(artist_id),
    title,
    release_date,
    undefined, // cover
    audio_url,
    isrc,
    upc
  );

  const newTrack = TrackModel.getTrackById(result.lastInsertRowid as number);
  res.status(201).json(newTrack);
};

export const updateTrack = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const track = TrackModel.getTrackById(id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  // Verify ownership
  const artist = ArtistModel.getArtistById(track.artist_id);
  if (!artist || (artist.user_id !== req.user?.id && req.user?.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, release_date, status, isrc, upc } = req.body;
  const data: any = {};
  if (title !== undefined) data.title = title;
  if (release_date !== undefined) data.release_date = release_date;
  if (status !== undefined) data.status = status;
  if (isrc !== undefined) data.isrc = isrc;
  if (upc !== undefined) data.upc = upc;

  if (req.file) {
    data.audio_url = (req.file as any).path;
  }

  TrackModel.updateTrack(id, data);
  const updated = TrackModel.getTrackById(id);
  res.json(updated);
};

export const deleteTrack = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const track = TrackModel.getTrackById(id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  const artist = ArtistModel.getArtistById(track.artist_id);
  if (!artist || (artist.user_id !== req.user?.id && req.user?.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  TrackModel.deleteTrack(id);
  res.json({ message: 'Track deleted' });
};

// Lyrics
export const uploadLyrics = (req: AuthRequest, res: Response) => {
  const trackId = parseInt(req.params.id);
  const { lyrics, type } = req.body;
  if (!lyrics || !type) return res.status(400).json({ error: 'Lyrics and type are required' });

  TrackModel.saveLyrics(trackId, lyrics, type);
  res.json({ message: 'Lyrics saved' });
};

export const getLyrics = (req: AuthRequest, res: Response) => {
  const trackId = parseInt(req.params.id);
  const lyrics = TrackModel.getLyrics(trackId);
  res.json(lyrics);
};

// Scheduled Releases
export const getScheduledReleases = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const artists = ArtistModel.getArtistsByUser(req.user.id);
  const allReleases: any[] = [];
  for (const artist of artists) {
    const releases = TrackModel.getScheduledReleasesByArtist(artist.id);
    allReleases.push(...releases);
  }
  res.json(allReleases);
};

export const scheduleRelease = (req: AuthRequest, res: Response) => {
  const { track_id, release_date, platforms } = req.body;
  if (!track_id || !release_date) return res.status(400).json({ error: 'Track ID and release date are required' });

  TrackModel.scheduleRelease(track_id, release_date, platforms || []);
  res.json({ message: 'Release scheduled' });
};

export const cancelScheduledRelease = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  TrackModel.cancelScheduledRelease(id);
  res.json({ message: 'Release cancelled' });
};

export const toggleAutoDistribute = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { auto_distribute } = req.body;
  
  TrackModel.updateTrack(id, { auto_distribute: !!auto_distribute });
  res.json({ message: `Auto-distribución ${auto_distribute ? 'activada' : 'desactivada'}` });
};

export const leaveALegacy = (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  // In a real app, we would verify payment here
  TrackModel.updateTrack(id, { leave_a_legacy: true });
  res.json({ message: 'Leave a Legacy activado para este track. Tu música permanecerá para siempre.' });
};
