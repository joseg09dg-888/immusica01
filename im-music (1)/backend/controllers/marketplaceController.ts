import { Request, Response } from 'express';
import db from '../config/database';

// Mock beats for the marketplace
const mockBeats = [
  { id: 1, titulo: "Neon Nights", productor: "CyberSynth", precio: 2999, genero: "Synthwave", bpm: 110, key: "Am" },
  { id: 2, titulo: "Urban Jungle", productor: "BeatMaster", precio: 4999, genero: "Trap", bpm: 140, key: "F#m" },
  { id: 3, titulo: "Midnight Rain", productor: "LoFiKing", precio: 1999, genero: "Lo-Fi", bpm: 85, key: "Cmaj" },
  { id: 4, titulo: "Electric Soul", productor: "SoulVibe", precio: 3499, genero: "R&B", bpm: 95, key: "Gm" },
  { id: 5, titulo: "Cyber Rebellion", productor: "EliteBeats", precio: 5999, genero: "Industrial", bpm: 128, key: "Dm" },
];

export const getBeats = (req: Request, res: Response) => {
  res.json(mockBeats);
};

export const buyBeat = (req: Request, res: Response) => {
  const { beatId } = req.body;
  const beat = mockBeats.find(b => b.id === beatId);
  if (!beat) return res.status(404).json({ error: 'Beat no encontrado' });
  
  // En un sistema real, aquí se procesaría el pago y se daría acceso al archivo
  res.json({ success: true, message: `Has comprado "${beat.titulo}"`, beat });
};
