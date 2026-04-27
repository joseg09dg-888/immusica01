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
import { createProxyMiddleware } from "http-proxy-middleware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

// ─── JWT Secret validation ───────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET must be set and at least 32 characters");
  process.exit(1);
}

// ─── Sanitize input helper ───────────────────────────────────────────────────
function sanitize(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim().replace(/[<>'"]/g, "").slice(0, 1000);
}

function sanitizeEmail(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim().toLowerCase().slice(0, 254);
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET!) as any;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ─── Request logger ──────────────────────────────────────────────────────────
function logger(req: any, _res: any, next: any) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  // DB migrations — run on startup
  await pool.query(`ALTER TABLE splits ALTER COLUMN track_id DROP NOT NULL;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artist_name TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS bpm INTEGER;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS key_signature TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS label TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS copyright_year INTEGER;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_type TEXT DEFAULT 'single';`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS previously_released BOOLEAN DEFAULT false;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS featured_artists TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS isrc TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS upc TEXT;`).catch(() => {});
  await pool.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS cover TEXT;`).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketplace_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      title TEXT NOT NULL,
      genre TEXT,
      bpm INTEGER,
      price INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_name TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(() => {});

  app.set("trust proxy", 1);

  // ─── Security headers (Helmet) ────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Vite dev needs this off
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" },
  }));

  // ─── CORS ────────────────────────────────────────────────────────────────
  const ALLOWED_ORIGINS = [
    "http://localhost:3001",
    "http://localhost:5173",
    process.env.APP_URL,
  ].filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // ─── Rate limiting ────────────────────────────────────────────────────────
  // Global limit
  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: "Demasiadas solicitudes. Intenta en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  }));

  // Strict auth limit
  app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Demasiados intentos de autenticación. Intenta en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skipSuccessfulRequests: true,
  }));

  app.use(express.json({ limit: "2mb" }));
  app.use(logger);

  // ─── Health ───────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), version: "2.0.0" });
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const email = sanitizeEmail(req.body.email);
      const password = sanitize(req.body.password);
      const name = sanitize(req.body.name);

      if (!email || !password || !name)
        return res.status(400).json({ error: "Email, contraseña y nombre son obligatorios" });
      if (password.length < 8)
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: "Email inválido" });

      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rows.length > 0)
        return res.status(409).json({ error: "El email ya está registrado" });

      const hashed = await bcrypt.hash(password, 12);
      const inserted = await pool.query(
        "INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,'artist') RETURNING id, email, name, role",
        [email, hashed, name]
      );
      const user = inserted.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET!, { expiresIn: "7d" });
      res.status(201).json({ token, user });
    } catch (e: any) {
      console.error("register error:", e.message);
      res.status(500).json({ error: "Error al registrar. Intenta más tarde." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = sanitizeEmail(req.body.email);
      const password = sanitize(req.body.password);

      if (!email || !password)
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });

      const result = await pool.query(
        "SELECT id, email, name, role, password FROM users WHERE email=$1",
        [email]
      );
      const user = result.rows[0];
      // Always compare to avoid timing attacks
      const dummyHash = "$2b$12$invalidhashtopreventtimingattacks000000000000000000000000";
      const valid = user ? await bcrypt.compare(password, user.password) : await bcrypt.compare(password, dummyHash);

      if (!user || !valid) return res.status(401).json({ error: "Credenciales inválidas" });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET!, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (e: any) {
      console.error("login error:", e.message);
      res.status(500).json({ error: "Error al iniciar sesión. Intenta más tarde." });
    }
  });

  // ─── Tracks (protected) ───────────────────────────────────────────────────
  app.get("/api/tracks", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM tracks WHERE artist_id=$1 ORDER BY id DESC LIMIT 50",
        [req.user.id]
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/tracks", requireAuth, async (req: any, res) => {
    const title = sanitize(req.body.title);
    const genre = sanitize(req.body.genre);
    const release_date = sanitize(req.body.release_date);
    const audio_url = req.body.audio_url || null;
    const cover_url = req.body.cover_url || null;
    const artist_name = sanitize(req.body.artist_name || '');
    const label = sanitize(req.body.label || '');
    const copyright_year = parseInt(req.body.copyright_year) || new Date().getFullYear();
    const language = sanitize(req.body.language || 'es');
    const release_type = sanitize(req.body.release_type || req.body.type || 'single');
    const previously_released = req.body.previously_released === true || req.body.previously_released === 'true';
    const featured_artists = sanitize(req.body.featured_artists || '');
    const isrc = sanitize(req.body.isrc || '');
    const upc = sanitize(req.body.upc || '');
    const bpm = parseInt(req.body.bpm) || null;
    const key_signature = sanitize(req.body.key || req.body.key_signature || '');

    if (!title) return res.status(400).json({ error: "El título es obligatorio" });

    try {
      const r = await pool.query(
        `INSERT INTO tracks (artist_id, title, genre, release_date, status, audio_url, cover, artist_name, label, copyright_year, language, release_type, previously_released, featured_artists, isrc, upc, bpm, key_signature)
         VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
        [req.user.id, title, genre || null, release_date || new Date().toISOString().split("T")[0],
         audio_url, cover_url, artist_name || null, label || null, copyright_year, language,
         release_type, previously_released, featured_artists || null, isrc || null, upc || null, bpm, key_signature || null]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) {
      console.error("track create error:", e.message);
      res.status(500).json({ error: "Error al crear el track" });
    }
  });

  app.delete("/api/tracks/:id", requireAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    try {
      await pool.query("DELETE FROM tracks WHERE id=$1 AND artist_id=$2", [id, req.user.id]);
      res.json({ success: true, message: "Track eliminado" });
    } catch (e: any) {
      res.status(500).json({ error: "Error al eliminar el track" });
    }
  });

  // ─── Royalties (protected) ────────────────────────────────────────────────
  app.get("/api/royalties/summary", requireAuth, async (_req, res) => {
    try {
      const total = await pool.query(
        "SELECT COALESCE(SUM(amount),0) as total_revenue FROM royalties"
      );
      const byPlatform = await pool.query(
        "SELECT platform, SUM(amount) as revenue FROM royalties GROUP BY platform ORDER BY revenue DESC"
      );
      const streams = await pool.query(
        "SELECT COALESCE(SUM(streams),0) as total FROM daily_stats"
      );
      const byPlatformObj: Record<string, number> = {};
      byPlatform.rows.forEach((r: any) => { byPlatformObj[r.platform] = Number(r.revenue); });
      res.json({
        totalRevenue: Number(total.rows[0]?.total_revenue) || 0,
        totalStreams: Number(streams.rows[0]?.total) || 0,
        byPlatform: byPlatformObj,
      });
    } catch (e: any) {
      console.error("royalties/summary error:", e.message);
      res.json({ totalRevenue: 0, totalStreams: 0, byPlatform: {} });
    }
  });

  app.get("/api/royalties/monthly", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query(
        "SELECT TO_CHAR(created_at,'YYYY-MM') as month, SUM(amount) as revenue FROM royalties GROUP BY month ORDER BY month DESC LIMIT 12"
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // ─── Splits (protected) ───────────────────────────────────────────────────
  app.get("/api/splits", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query(
        "SELECT *, artist_name AS collaborator_name FROM splits WHERE track_id IN (SELECT id FROM tracks WHERE artist_id=$1) OR track_id IS NULL ORDER BY created_at DESC",
        [req.user.id]
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/splits", requireAuth, async (req: any, res) => {
    const track_id = parseInt(req.body.track_id);
    const collaborator_name = sanitize(req.body.collaborator_name);
    const collaborator_email = sanitizeEmail(req.body.collaborator_email);
    const percentage = parseFloat(req.body.percentage);

    if (!collaborator_name || !collaborator_email)
      return res.status(400).json({ error: "Nombre y email del colaborador son obligatorios" });
    if (isNaN(percentage) || percentage <= 0 || percentage > 100)
      return res.status(400).json({ error: "El porcentaje debe estar entre 0.01 y 100" });

    try {
      const r = await pool.query(
        "INSERT INTO splits (track_id, artist_name, email, percentage) VALUES ($1,$2,$3,$4) RETURNING *",
        [track_id || null, collaborator_name, collaborator_email, percentage]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: "Error al crear el split" });
    }
  });

  // ─── Other protected routes ───────────────────────────────────────────────
  app.get("/api/playlists", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query("SELECT * FROM playlists ORDER BY created_at DESC LIMIT 50");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/vault/files", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM vault_files WHERE user_id=$1 ORDER BY uploaded_at DESC",
        [req.user.id]
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/marketing/mi-branding", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query("SELECT * FROM user_branding WHERE user_id=$1 LIMIT 1", [req.user.id]);
      res.json(r.rows[0] || { archetype: null });
    } catch { res.json({ archetype: null }); }
  });

  app.post("/api/marketing/test", requireAuth, async (req, res) => {
    const genre = sanitize(req.body.genre);
    const mood = sanitize(req.body.mood);
    const archetypes: Record<string, any> = {
      reggaeton: { archetype: "El Rebelde", personality: "Energético, auténtico, provocador", colors: ["#FF4500", "#1A1A1A", "#FFD700"] },
      pop: { archetype: "El Héroe", personality: "Inspirador, accesible, emotivo", colors: ["#5E17EB", "#F2EDE5", "#FF69B4"] },
      trap: { archetype: "El Forajido", personality: "Misterioso, audaz, transgresor", colors: ["#000000", "#C0C0C0", "#8B0000"] },
      "r&b": { archetype: "El Amante", personality: "Sensual, emotivo, sofisticado", colors: ["#8B0057", "#1A1A1A", "#C0A080"] },
      indie: { archetype: "El Explorador", personality: "Curioso, auténtico, alternativo", colors: ["#2D5016", "#F5E6D3", "#4A90D9"] },
    };
    const key = genre?.toLowerCase() || "pop";
    const result = { ...(archetypes[key] || archetypes.pop) };
    if (mood) result.mood = mood;
    res.json(result);
  });

  app.get("/api/financing/eligibility", requireAuth, async (req: any, res) => {
    try {
      const count = await pool.query(
        "SELECT COUNT(*) as months FROM royalties WHERE created_at > NOW() - INTERVAL '3 months' AND artist_id=$1",
        [req.user.id]
      );
      const months = parseInt(count.rows[0]?.months || 0);
      res.json({
        eligible: months >= 3,
        reason: months >= 3
          ? "Calificas para financiamiento basado en regalías"
          : "Se requiere mínimo 3 meses de historial de regalías",
      });
    } catch {
      res.json({ eligible: false, reason: "Error al verificar elegibilidad" });
    }
  });

  app.get("/api/chat/recent", requireAuth, async (_req: any, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM community_messages ORDER BY created_at ASC LIMIT 100"
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/chat/send", requireAuth, async (req: any, res) => {
    const message = sanitize(req.body.message);
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });
    res.json({ success: true, message: "Mensaje recibido" });
  });

  app.get("/api/marketplace/beats", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query("SELECT * FROM marketplace_items ORDER BY created_at DESC LIMIT 50");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.post("/api/ai/chat", requireAuth, async (req: any, res) => {
    const message = sanitize(req.body.message);
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    // If Gemini API key is configured, use it; otherwise return placeholder
    if (process.env.GEMINI_API_KEY) {
      // TODO: integrate Gemini API
      res.json({ response: `IA: Tu consulta "${message.slice(0, 50)}..." está siendo procesada.` });
    } else {
      res.json({ response: `Recibí tu mensaje. El chat IA estará disponible pronto.` });
    }
  });

  app.post("/api/legal-agent/consulta", requireAuth, async (req: any, res) => {
    const consulta = sanitize(req.body.consulta);
    if (!consulta) return res.status(400).json({ error: "Consulta vacía" });
    res.json({ respuesta: `Consulta registrada. El agente legal IA está en configuración.` });
  });

  // ─── Community / Chat ─────────────────────────────────────────────────────
  app.get("/api/community/messages", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query("SELECT * FROM community_messages ORDER BY created_at ASC LIMIT 100");
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/community/messages", requireAuth, async (req: any, res) => {
    const content = sanitize(req.body.content || req.body.message || '');
    if (!content) return res.status(400).json({ error: "Mensaje vacío" });
    try {
      const r = await pool.query(
        "INSERT INTO community_messages (user_id, user_name, content) VALUES ($1,$2,$3) RETURNING *",
        [req.user.id, req.user.name || req.user.email, content]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Alias: frontend CommunityPage POSTs to /api/chat (not /api/chat/send)
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    const content = sanitize(req.body.message || req.body.content || '');
    if (!content) return res.status(400).json({ error: "Mensaje vacío" });
    try {
      await pool.query(
        "INSERT INTO community_messages (user_id, user_name, content) VALUES ($1,$2,$3)",
        [req.user.id, req.user.name || req.user.email, content]
      );
    } catch { /* table may not exist yet */ }
    try {
      await pool.query(
        "INSERT INTO chat_messages (user_id, content) VALUES ($1,$2)",
        [req.user.id, content]
      );
    } catch { /* ignore */ }
    res.json({ success: true });
  });

  // ─── Marketplace ─────────────────────────────────────────────────────────
  app.post("/api/marketplace/beats", requireAuth, async (req: any, res) => {
    const title = sanitize(req.body.title || '');
    if (!title) return res.status(400).json({ error: "El título es obligatorio" });
    const genre = sanitize(req.body.genre || 'Sin género');
    const bpm = parseInt(req.body.bpm) || null;
    const price = parseInt(req.body.price || req.body.precio || 0);
    const description = sanitize(req.body.description || req.body.descripcion || '');
    try {
      const r = await pool.query(
        "INSERT INTO marketplace_items (user_id, title, genre, bpm, price, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
        [req.user.id, title, genre, bpm, price, description]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/marketplace/my-beats", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM marketplace_items WHERE user_id=$1 ORDER BY created_at DESC",
        [req.user.id]
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/marketplace/hot", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query("SELECT * FROM marketplace_items ORDER BY created_at DESC LIMIT 20");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/api/marketplace/top-rated", requireAuth, async (_req, res) => {
    try {
      const r = await pool.query("SELECT * FROM marketplace_items ORDER BY price DESC LIMIT 20");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // ─── Releases ────────────────────────────────────────────────────────────
  app.get("/api/releases", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS releases (id SERIAL PRIMARY KEY, user_id INTEGER, title TEXT NOT NULL, release_date TEXT, platforms TEXT, status TEXT DEFAULT 'draft', type TEXT DEFAULT 'single', track_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM releases WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/releases", requireAuth, async (req: any, res) => {
    try {
      const { title, release_date, platforms, status, type, track_id } = req.body;
      const r = await pool.query(
        "INSERT INTO releases (user_id, title, release_date, platforms, status, type, track_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [req.user.id, sanitize(title)||'Sin título', release_date||null, platforms||'', status||'draft', type||'single', track_id||null]
      );
      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Videos ──────────────────────────────────────────────────────────────
  app.get("/api/videos", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS videos (id SERIAL PRIMARY KEY, user_id INTEGER, title TEXT NOT NULL, description TEXT, url TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM videos WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/videos", requireAuth, async (req: any, res) => {
    try {
      const { title, description, url } = req.body;
      const r = await pool.query(
        "INSERT INTO videos (user_id, title, description, url) VALUES ($1,$2,$3,$4) RETURNING *",
        [req.user.id, sanitize(title)||'Sin título', sanitize(description)||'', url||null]
      );
      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/videos/analytics", requireAuth, async (_req, res) => {
    res.json({ views: 0, subscribers: 0, watch_time: 0 });
  });

  // ─── Publishing ──────────────────────────────────────────────────────────
  app.get("/api/publishing", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS publishing (id SERIAL PRIMARY KEY, user_id INTEGER, title TEXT NOT NULL, composers TEXT, splits TEXT, iswc TEXT, track_id INTEGER, lyrics TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM publishing WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/publishing", requireAuth, async (req: any, res) => {
    try {
      const { title, composers, splits, iswc, track_id, lyrics } = req.body;
      const r = await pool.query(
        "INSERT INTO publishing (user_id, title, composers, splits, iswc, track_id, lyrics) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [req.user.id, sanitize(title)||'Sin título', composers||'', splits||'', iswc||'', track_id||null, lyrics||'']
      );
      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Stats ───────────────────────────────────────────────────────────────
  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      const tracks = await pool.query("SELECT COUNT(*) as count FROM tracks WHERE artist_id=$1", [req.user.id]);
      const revenue = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM royalties");
      const streams = await pool.query("SELECT COALESCE(SUM(streams),0) as total FROM daily_stats");
      res.json({
        tracks: parseInt(tracks.rows[0]?.count || 0),
        revenue: Number(revenue.rows[0]?.total || 0),
        streams: Number(streams.rows[0]?.total || 0),
        listeners: 0,
        countries: 0,
        playlist_adds: 0,
      });
    } catch { res.json({ tracks: 0, revenue: 0, streams: 0, listeners: 0, countries: 0, playlist_adds: 0 }); }
  });

  // ─── Feedback ────────────────────────────────────────────────────────────
  app.get("/api/feedback", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS feedback (id SERIAL PRIMARY KEY, user_id INTEGER, type TEXT DEFAULT 'bug', title TEXT, description TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM feedback WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/feedback", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS feedback (id SERIAL PRIMARY KEY, user_id INTEGER, type TEXT DEFAULT 'bug', title TEXT, description TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const type = sanitize(req.body.type || 'bug');
      const title = sanitize(req.body.title || '');
      const description = sanitize(req.body.description || req.body.message || '');
      const r = await pool.query(
        "INSERT INTO feedback (user_id, type, title, description) VALUES ($1,$2,$3,$4) RETURNING *",
        [req.user.id, type, title, description]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Labels ──────────────────────────────────────────────────────────────
  app.get("/api/labels/my", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS labels (id SERIAL PRIMARY KEY, owner_id INTEGER, name TEXT NOT NULL, description TEXT, logo_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM labels WHERE owner_id=$1 ORDER BY created_at DESC", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/labels", requireAuth, async (req: any, res) => {
    try {
      const name = sanitize(req.body.name || '');
      const description = sanitize(req.body.description || '');
      if (!name) return res.status(400).json({ error: "El nombre es obligatorio" });
      const r = await pool.query(
        "INSERT INTO labels (owner_id, name, description) VALUES ($1,$2,$3) RETURNING *",
        [req.user.id, name, description]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Team ────────────────────────────────────────────────────────────────
  app.get("/api/team", requireAuth, async (req: any, res) => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS team_members (id SERIAL PRIMARY KEY, owner_id INTEGER, name TEXT NOT NULL, email TEXT, role TEXT DEFAULT 'member', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
      const r = await pool.query("SELECT * FROM team_members WHERE owner_id=$1 ORDER BY created_at DESC", [req.user.id]);
      res.json(r.rows);
    } catch { res.json([]); }
  });
  app.post("/api/team", requireAuth, async (req: any, res) => {
    try {
      const name = sanitize(req.body.name || '');
      const email = sanitizeEmail(req.body.email || '');
      const role = sanitize(req.body.role || 'member');
      if (!name || !email) return res.status(400).json({ error: "Nombre y email son obligatorios" });
      const r = await pool.query(
        "INSERT INTO team_members (owner_id, name, email, role) VALUES ($1,$2,$3,$4) RETURNING *",
        [req.user.id, name, email, role]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Auth profile ────────────────────────────────────────────────────────
  app.get("/api/auth/profile", requireAuth, async (req: any, res) => {
    try {
      const r = await pool.query("SELECT id, email, name, role FROM users WHERE id=$1", [req.user.id]);
      if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/auth/profile", requireAuth, async (req: any, res) => {
    try {
      const name = sanitize(req.body.name || '');
      await pool.query("UPDATE users SET name=$1 WHERE id=$2", [name, req.user.id]);
      const r = await pool.query("SELECT id, email, name, role FROM users WHERE id=$1", [req.user.id]);
      res.json(r.rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Cover art upload to Cloudinary ─────────────────────────────────────
  app.post("/api/upload/cover", requireAuth, upload.single("cover") as any, async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se recibió imagen" });
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "immusic/covers", transformation: [{ width: 3000, height: 3000, crop: "fill" }] },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file!.buffer);
      });
      res.json({ url: result.secure_url, public_id: result.public_id, width: result.width, height: result.height });
    } catch (e: any) {
      console.error("Cover upload error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Audio upload to Cloudinary ──────────────────────────────────────────
  app.post("/api/upload/audio", requireAuth, upload.single("audio") as any, async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "video", folder: "immusic/audio", use_filename: true },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file!.buffer);
      });
      res.json({
        url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration,
        format: result.format,
      });
    } catch (e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── 404 handler for unmatched API routes ────────────────────────────────
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  // ─── Vite middleware ──────────────────────────────────────────────────────
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

  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    on: {
      error: (_err: Error, _req: express.Request, res: express.Response) => {
        res.status(500).json({ error: 'Backend not available' });
      }
    }
  }));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ IM MUSIC running on http://localhost:${PORT}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch(e => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
