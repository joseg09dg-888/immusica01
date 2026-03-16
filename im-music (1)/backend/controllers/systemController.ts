import { Request, Response } from 'express';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

dotenv.config();

export const getSystemInfo = (req: Request, res: Response) => {
  try {
    let gitInfo = {
      branch: 'unknown',
      lastCommit: 'unknown',
      repo: 'https://github.com/joseg09/rebellion-music' // Placeholder or inferred
    };

    try {
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      gitInfo.lastCommit = execSync('git log -1 --format=%s').toString().trim();
    } catch (e) {
      console.warn('Git not available or not a repo');
    }

    const ngrokUrl = process.env.VITE_API_URL || 'Not configured';

    res.json({
      status: 'online',
      git: gitInfo,
      ngrok: {
        url: ngrokUrl,
        status: ngrokUrl.includes('ngrok') ? 'active' : 'inactive'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: 'Error al obtener información del sistema' });
  }
};

export const pitchToPlaylist = (req: AuthRequest, res: Response) => {
  const { trackId, playlistId, message } = req.body;
  if (!trackId || !playlistId) return res.status(400).json({ error: 'Track ID and Playlist ID are required' });

  db.prepare('INSERT INTO pitches (track_id, playlist_id, message) VALUES (?, ?, ?)').run(
    trackId,
    playlistId,
    message
  );
  res.json({ message: 'Pitch submitted' });
};

export const getMyPitches = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Get pitches for tracks owned by user's artists
  const pitches = db.prepare(`
    SELECT p.*, t.title as track_title
    FROM pitches p
    JOIN tracks t ON p.track_id = t.id
    JOIN artists a ON t.artist_id = a.id
    WHERE a.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  
  res.json(pitches);
};
