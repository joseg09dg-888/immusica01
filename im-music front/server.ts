import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Pool } from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a PostgreSQL en lugar de SQLite
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Too many requests" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });
  app.use("/api", limiter);
  app.use(express.json());

  // API Routes — conectadas al backend real
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/me", async (req, res) => {
    try {
      const result = await pool.query("SELECT id, email, name, role FROM users LIMIT 1");
      res.json(result.rows[0] || {});
    } catch (e) {
      res.json({ id: 1, name: "Elite Artist", email: "artist@immusic.com", role: "artist" });
    }
  });

  app.get("/api/artists", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM artists ORDER BY id DESC");
      res.json(result.rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.post("/api/artists", async (req, res) => {
    const { name, genre, bio, user_id } = req.body;
    if (!name || !user_id) return res.status(400).json({ error: "Missing fields" });
    try {
      const result = await pool.query(
        "INSERT INTO artists (name, genre, bio, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
        [name, genre, bio, user_id]
      );
      res.json({ id: result.rows[0].id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tracks", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM tracks ORDER BY id DESC");
      res.json(result.rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.post("/api/tracks", async (req, res) => {
    const { artist_id, title, release_date } = req.body;
    if (!artist_id || !title || !release_date) return res.status(400).json({ error: "Missing fields" });
    try {
      const result = await pool.query(
        "INSERT INTO tracks (artist_id, title, release_date) VALUES ($1, $2, $3) RETURNING id",
        [artist_id, title, release_date]
      );
      res.json({ id: result.rows[0].id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/royalties/summary", async (req, res) => {
    try {
      const total = await pool.query("SELECT SUM(cantidad) as total FROM royalties");
      const byPlatform = await pool.query(
        "SELECT plataforma as platform, SUM(cantidad) as total FROM royalties GROUP BY plataforma"
      );
      res.json({ total: total.rows[0]?.total || 0, byPlatform: byPlatform.rows });
    } catch (e) {
      res.json({ total: 0, byPlatform: [] });
    }
  });

  // Vite middleware
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
    console.log(`✅ IM MUSIC Frontend corriendo en http://localhost:${PORT}`);
  });
}

startServer();