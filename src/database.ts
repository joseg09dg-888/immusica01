import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../music_platform.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'artist',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    genre TEXT,
    bio TEXT,
    tier TEXT DEFAULT 'Basic',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    release_date TEXT,
    scheduled_date TEXT,
    published_at TEXT,
    cover TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'draft',
    isrc TEXT,
    upc TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS royalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    cantidad REAL NOT NULL,
    estado TEXT DEFAULT 'proyectado',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    artist_name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    percentage REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    invitation_token TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS split_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(split_id) REFERENCES splits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS royalty_withholdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    split_id INTEGER,
    cantidad REAL NOT NULL,
    estado TEXT DEFAULT 'retenido',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY(split_id) REFERENCES splits(id) ON DELETE SET NULL
  );

  -- TABLA PARA ESTADÍSTICAS DIARIAS
  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    streams INTEGER DEFAULT 0,
    ingresos REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(track_id, fecha, plataforma)
  );

  -- ========== TABLAS PARA HYPERFOLLOW (LANDING PAGES) ==========
  CREATE TABLE IF NOT EXISTS landing_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    spotify_url TEXT,
    apple_music_url TEXT,
    youtube_url TEXT,
    other_url TEXT,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
    UNIQUE(landing_page_id, email)
  );

  -- ========== TABLA DE PLAYLISTS (PARA BASE DE DATOS COMUNITARIA) ==========
  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    genre TEXT,
    mood_tags TEXT, -- JSON array de moods asociados (ej: ["alegre", "energético"])
    contact_email TEXT,
    description TEXT,
    submitted_by INTEGER, -- ID del usuario que la agregó
    verified BOOLEAN DEFAULT 0, -- si ha sido verificada por el equipo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(submitted_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- ========== TABLA PARA DISTRIBUCIÓN DE VIDEOS ==========
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    track_id INTEGER, -- Opcional: asociar a una canción existente
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL, -- URL del archivo de video (local o cloud)
    thumbnail_url TEXT,      -- URL de la miniatura
    duration_seconds INTEGER,
    resolution TEXT,         -- ej: "1920x1080"
    status TEXT DEFAULT 'draft', -- draft, processing, published, failed
    platform_status TEXT,    -- JSON con estado en cada plataforma (YouTube, Vevo)
    youtube_url TEXT,        -- URL final en YouTube
    vevo_url TEXT,           -- URL final en Vevo
    tags TEXT,               -- JSON array de etiquetas
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE SET NULL
  );
`);

export default db;