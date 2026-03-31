"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPath = process.env.DATABASE_URL || path_1.default.join(__dirname, '../../music_platform.db');
const db = new better_sqlite3_1.default(dbPath);
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
    cover TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'draft',
    isrc TEXT,
    upc TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    budget REAL,
    platform TEXT,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  -- Tabla de royalties original (la conservamos)
  CREATE TABLE IF NOT EXISTS royalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    tipo TEXT,
    cantidad REAL NOT NULL,
    track_id INTEGER,
    concepto TEXT,
    estado TEXT DEFAULT 'proyectado',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS artist_branding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL UNIQUE,
    arquetipo TEXT,
    respuestas_test TEXT,
    manifiesto TEXT,
    colores TEXT,
    olores TEXT,
    sabores TEXT,
    texturas TEXT,
    lenguaje_tribu TEXT,
    simbolo TEXT,
    mercados_prioritarios TEXT,
    perfil_oyente TEXT,
    plan_contenidos TEXT,
    fecha_generacion_plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  -- Tabla para consultas legales
  CREATE TABLE IF NOT EXISTS legal_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  -- Tablas del marketplace
  CREATE TABLE IF NOT EXISTS beats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productor_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    genero TEXT NOT NULL,
    bpm INTEGER,
    tonalidad TEXT,
    precio INTEGER NOT NULL, -- en centavos
    archivo_url TEXT,
    archivo_completo_url TEXT,
    portada_url TEXT,
    descripcion TEXT,
    estado TEXT DEFAULT 'disponible',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(productor_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beat_id INTEGER NOT NULL,
    comprador_id INTEGER NOT NULL,
    monto INTEGER NOT NULL, -- en centavos
    comision_plataforma INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    FOREIGN KEY(comprador_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beat_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    puntuacion INTEGER NOT NULL CHECK(puntuacion BETWEEN 1 AND 5),
    comentario TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    FOREIGN KEY(usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(beat_id, usuario_id)
  );

  -- Tablas para financiación
  CREATE TABLE IF NOT EXISTS financing_eligibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL UNIQUE,
    ingresos_anuales INTEGER,
    numero_canciones_publicadas INTEGER,
    es_propietario_masters BOOLEAN,
    tiene_disputas_legales BOOLEAN,
    puntuacion_total INTEGER,
    es_elegible BOOLEAN,
    fecha_ultima_evaluacion TEXT,
    nombre_completo TEXT,
    email TEXT,
    telefono TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  -- Tablas para subida masiva de catálogos
  CREATE TABLE IF NOT EXISTS upload_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS upload_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    mime_type TEXT,
    file_size INTEGER,
    extracted_data TEXT,
    suggested_track_id INTEGER,
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY(job_id) REFERENCES upload_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY(suggested_track_id) REFERENCES tracks(id) ON DELETE SET NULL
  );

  -- ========== NUEVAS TABLAS PARA SPLITS MEJORADOS (COMO DISTROKID) ==========
  -- Reemplazamos la tabla splits anterior por una más completa
  DROP TABLE IF EXISTS splits;
  CREATE TABLE splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    artist_name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    percentage REAL NOT NULL,
    status TEXT DEFAULT 'pending',        -- 'pending', 'accepted', 'rejected'
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
    status TEXT DEFAULT 'pending',        -- 'pending', 'accepted', 'expired'
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(split_id) REFERENCES splits(id) ON DELETE CASCADE
  );

  -- Tabla para retención de regalías (ganancias no reclamadas)
  CREATE TABLE IF NOT EXISTS royalty_withholdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    split_id INTEGER,                      -- NULL si es del propietario original
    cantidad REAL NOT NULL,
    estado TEXT DEFAULT 'retenido',        -- 'retenido', 'liberado'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME,
    FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY(split_id) REFERENCES splits(id) ON DELETE SET NULL
  );

  -- Tablas para Mood Discovery (tuyas, las conservamos)
  CREATE TABLE IF NOT EXISTS spotify_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS mood_playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    mood_description TEXT NOT NULL,
    playlist_url TEXT NOT NULL,
    playlist_id TEXT NOT NULL,
    tracks_count INTEGER DEFAULT 0,
    valence REAL,
    energy REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS artist_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL UNIQUE,
    avg_valence REAL,
    avg_energy REAL,
    avg_danceability REAL,
    avg_tempo REAL,
    embedding TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );
`);
exports.default = db;
