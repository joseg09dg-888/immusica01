import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || "secret-dev-key";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.set("trust proxy", 1);
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

  // ─── Auth ────────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name)
        return res.status(400).json({ error: "Email, contraseña y nombre son obligatorios" });
      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rows.length > 0)
        return res.status(409).json({ error: "El email ya está registrado" });
      const hashed = await bcrypt.hash(password, 10);
      const inserted = await pool.query(
        "INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,'artist') RETURNING id, email, name, role",
        [email, hashed, name]
      );
      const user = inserted.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ token, user });
    } catch (e: any) {
      console.error("register error:", e.message);
      res.status(500).json({ error: "Error al registrar" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
      const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (e: any) {
      console.error("login error:", e.message);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  // ─── Other API routes ─────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/tracks", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM tracks ORDER BY id DESC LIMIT 50");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/tracks", async (req, res) => {
    const { artist_id, title, genre, release_date } = req.body;
    try {
      const r = await pool.query(
        "INSERT INTO tracks (artist_id, title, genre, release_date, status) VALUES ($1,$2,$3,$4,'draft') RETURNING *",
        [artist_id || 1, title, genre || null, release_date || new Date().toISOString().split("T")[0]]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/tracks/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM tracks WHERE id=$1", [req.params.id]);
      res.json({ message: "Track eliminado" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/royalties/summary", async (req, res) => {
    try {
      const total = await pool.query("SELECT COALESCE(SUM(cantidad),0) as total, COALESCE(SUM(cantidad),0) as totalRevenue FROM royalties");
      const byPlatform = await pool.query("SELECT plataforma, SUM(cantidad) as revenue FROM royalties GROUP BY plataforma");
      const streams = await pool.query("SELECT COALESCE(SUM(streams),0) as total FROM daily_stats");
      const byPlatformObj: Record<string, number> = {};
      byPlatform.rows.forEach((r: any) => { byPlatformObj[r.plataforma] = Number(r.revenue); });
      res.json({
        totalRevenue: Number(total.rows[0]?.totalRevenue) || 0,
        totalStreams: Number(streams.rows[0]?.total) || 0,
        byPlatform: byPlatformObj
      });
    } catch { res.json({ totalRevenue: 0, totalStreams: 0, byPlatform: {} }); }
  });

  app.get("/api/royalties/monthly", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(cantidad) as revenue FROM royalties GROUP BY month ORDER BY month DESC LIMIT 12"
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/splits", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM splits ORDER BY created_at DESC");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/splits", async (req, res) => {
    const { track_id, collaborator_name, collaborator_email, percentage } = req.body;
    try {
      const r = await pool.query(
        "INSERT INTO splits (track_id, artist_name, email, percentage) VALUES ($1,$2,$3,$4) RETURNING *",
        [track_id || 1, collaborator_name, collaborator_email, percentage]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/playlists", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM playlists ORDER BY created_at DESC LIMIT 50");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/vault/files", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM vault_files ORDER BY uploaded_at DESC");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/marketing/mi-branding", async (req, res) => {
    res.json({ archetype: null });
  });

  app.post("/api/marketing/test", async (req, res) => {
    const { genre, mood } = req.body;
    const archetypes: Record<string, any> = {
      reggaeton: { archetype: "El Rebelde", personality: "Energético, auténtico, provocador", colors: ["#FF4500", "#1A1A1A", "#FFD700"] },
      pop: { archetype: "El Héroe", personality: "Inspirador, accesible, emotivo", colors: ["#5E17EB", "#F2EDE5", "#FF69B4"] },
      trap: { archetype: "El Forajido", personality: "Misterioso, audaz, transgresor", colors: ["#000000", "#C0C0C0", "#8B0000"] },
    };
    const key = genre?.toLowerCase() || "pop";
    const result = archetypes[key] || archetypes.pop;
    if (mood) result.mood = mood;
    res.json(result);
  });

  app.get("/api/financing/eligibility", async (req, res) => {
    res.json({ eligible: false, reason: "Se requiere mínimo 3 meses de historial de regalías" });
  });

  app.get("/api/chat/recent", async (req, res) => {
    res.json([]);
  });

  app.post("/api/chat/send", async (req, res) => {
    res.json({ message: "Mensaje enviado" });
  });

  app.get("/api/marketplace/beats", async (req, res) => {
    res.json([]);
  });

  app.post("/api/ai/chat", async (req, res) => {
    const { message } = req.body;
    res.json({ response: `Recibí tu mensaje: "${message}". El chat IA está listo cuando configures la API key de Gemini.` });
  });

  app.post("/api/legal-agent/consulta", async (req, res) => {
    const { consulta } = req.body;
    res.json({ respuesta: `Consulta recibida: "${consulta}". El agente legal IA está listo cuando configures la integración.` });
  });

  // ─── Vite middleware ──────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.join(__dirname, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ IM MUSIC Frontend corriendo en http://localhost:${PORT}`);
  });
}

startServer();
