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
    UNIQUE(beat_id, usuario_id) -- Un usuario solo puede valorar una vez el mismo beat
  );
`);

export default db;