import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(process.env.DATABASE_URL || "music_platform.db");

// Initialize Database with Security and Sample Data
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'artist'
  );

  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    genre TEXT,
    bio TEXT,
    tier TEXT DEFAULT 'Basic',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER,
    title TEXT,
    release_date TEXT,
    status TEXT DEFAULT 'draft',
    isrc TEXT,
    upc TEXT,
    FOREIGN KEY(artist_id) REFERENCES artists(id)
  );

  CREATE TABLE IF NOT EXISTS royalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER,
    amount REAL,
    period TEXT,
    platform TEXT,
    FOREIGN KEY(track_id) REFERENCES tracks(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER,
    name TEXT,
    budget REAL,
    status TEXT,
    platform TEXT,
    FOREIGN KEY(artist_id) REFERENCES artists(id)
  );
`);

// Seed Initial Data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
if (userCount.count === 0) {
  const info = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("artist@immusic.com", "Elite Artist");
  const userId = info.lastInsertRowid;
  
  const artistInfo = db.prepare("INSERT INTO artists (name, genre, bio, user_id, tier) VALUES (?, ?, ?, ?, ?)")
    .run("Neon Rebel", "Cyberpunk Pop", "Breaking the sound barrier since 2026.", userId, "Pro");
  const artistId = artistInfo.lastInsertRowid;

  const track1 = db.prepare("INSERT INTO tracks (artist_id, title, release_date, status, isrc) VALUES (?, ?, ?, ?, ?)")
    .run(artistId, "Digital Rebellion", "2026-01-15", "distributed", "QM-IM-26-00001");
  const track2 = db.prepare("INSERT INTO tracks (artist_id, title, release_date, status, isrc) VALUES (?, ?, ?, ?, ?)")
    .run(artistId, "Cyber Pulse", "2026-02-10", "distributed", "QM-IM-26-00002");

  db.prepare("INSERT INTO royalties (track_id, amount, period, platform) VALUES (?, ?, ?, ?)").run(track1.lastInsertRowid, 1250.45, "2026-01", "Spotify");
  db.prepare("INSERT INTO royalties (track_id, amount, period, platform) VALUES (?, ?, ?, ?)").run(track1.lastInsertRowid, 840.20, "2026-01", "Apple Music");
  db.prepare("INSERT INTO royalties (track_id, amount, period, platform) VALUES (?, ?, ?, ?)").run(track2.lastInsertRowid, 2100.00, "2026-02", "Spotify");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required when running behind a proxy (like in AI Studio)
  // to allow express-rate-limit to correctly identify user IPs.
  app.set('trust proxy', 1);

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles this in dev
  }));
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for development
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });
  app.use("/api", limiter);

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/me", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user);
  });

  app.get("/api/artists", (req, res) => {
    const artists = db.prepare("SELECT * FROM artists").all();
    res.json(artists);
  });

  app.post("/api/artists", (req, res) => {
    const { name, genre, bio, user_id } = req.body;
    if (!name || !genre || !user_id) return res.status(400).json({ error: "Missing fields" });
    const info = db.prepare("INSERT INTO artists (name, genre, bio, user_id) VALUES (?, ?, ?, ?)").run(name, genre, bio, user_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/tracks", (req, res) => {
    const tracks = db.prepare("SELECT * FROM tracks ORDER BY id DESC").all();
    res.json(tracks);
  });

  app.post("/api/tracks", (req, res) => {
    const { artist_id, title, release_date } = req.body;
    if (!artist_id || !title || !release_date) return res.status(400).json({ error: "Missing fields" });
    const info = db.prepare("INSERT INTO tracks (artist_id, title, release_date) VALUES (?, ?, ?)").run(artist_id, title, release_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/royalties/summary", (req, res) => {
    const summary = db.prepare("SELECT SUM(amount) as total FROM royalties").get() as any;
    const byPlatform = db.prepare("SELECT platform, SUM(amount) as total FROM royalties GROUP BY platform").all();
    res.json({ total: summary.total || 0, byPlatform });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IM MUSIC Server running on http://localhost:${PORT}`);
  });
}

startServer();
