/**
 * IM Music — Script de migración SQLite → PostgreSQL (Neon.tech)
 * 
 * Ejecutar UNA SOLA VEZ con:
 * node migrate-to-postgres.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_7miSWDQtMPr8@ep-lucky-sea-amrbrnqd-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Iniciando migración a PostgreSQL...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('📋 Creando tablas...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'artist',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS artists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        genre TEXT,
        bio TEXT,
        tier TEXT DEFAULT 'Basic',
        avatar TEXT,
        spotify_verified BOOLEAN DEFAULT FALSE,
        spotify_id TEXT,
        spotify_token TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        release_date TEXT,
        cover TEXT,
        audio_url TEXT,
        status TEXT DEFAULT 'draft',
        isrc TEXT,
        upc TEXT,
        auto_distribute BOOLEAN DEFAULT FALSE,
        leave_a_legacy BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vault_files (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS riaa_certifications (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        threshold BIGINT NOT NULL,
        achieved_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_distributions (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        distributed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS youtube_content_id (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        registration_id TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        budget REAL,
        platform TEXT,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS royalties (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        tipo TEXT,
        cantidad REAL NOT NULL,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        concepto TEXT,
        estado TEXT DEFAULT 'proyectado',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        streams INTEGER DEFAULT 0,
        ingresos REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(track_id, fecha, plataforma)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        reference TEXT UNIQUE,
        amount REAL,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS splits (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        artist_name TEXT NOT NULL,
        email TEXT NOT NULL,
        percentage REAL NOT NULL,
        role TEXT,
        status TEXT DEFAULT 'pending',
        invitation_token TEXT UNIQUE,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS split_invitations (
        id SERIAL PRIMARY KEY,
        split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS royalty_withholdings (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        split_id INTEGER REFERENCES splits(id) ON DELETE SET NULL,
        cantidad REAL NOT NULL,
        estado TEXT DEFAULT 'withheld',
        released_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS artist_branding (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lyrics (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        lyrics TEXT NOT NULL,
        type TEXT DEFAULT 'plain',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scheduled_releases (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        release_date TEXT NOT NULL,
        platforms TEXT,
        status TEXT DEFAULT 'scheduled',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        platform TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS compositions (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        iswc TEXT,
        pro TEXT,
        share REAL DEFAULT 100,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pitches (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        playlist_id INTEGER NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_artists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'owner',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS composition_registrations (
        id SERIAL PRIMARY KEY,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        pro TEXT NOT NULL,
        registration_number TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS publishing_royalties (
        id SERIAL PRIMARY KEY,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        source TEXT,
        period TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS marketplace_beats (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        genre TEXT,
        bpm INTEGER,
        price REAL NOT NULL,
        audio_url TEXT NOT NULL,
        cover_url TEXT,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS beat_ratings (
        id SERIAL PRIMARY KEY,
        beat_id INTEGER NOT NULL REFERENCES marketplace_beats(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS legal_queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        response TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_moderated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_strikes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT,
        genre TEXT,
        moods TEXT,
        contact_email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS legacy_purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        amount REAL NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS upload_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS upload_items (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES upload_jobs(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Tablas creadas');

    // Crear usuarios semilla
    console.log('👤 Creando usuarios iniciales...');
    const adminHash = bcrypt.hashSync('admin123', 10);
    const artistHash = bcrypt.hashSync('password123', 10);

    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@immusica.com', adminHash, 'Admin IM Music', 'admin']);

    const artistResult = await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['artist@immusic.com', artistHash, 'Elite Artist', 'artist']);

    if (artistResult.rows[0]) {
      await client.query(`
        INSERT INTO artists (user_id, name, genre, bio, tier)
        VALUES ($1, $2, $3, $4, $5)
      `, [artistResult.rows[0].id, 'Neon Rebel', 'Cyberpunk Pop', 'Breaking the sound barrier since 2026.', 'Pro']);
    }

    await client.query('COMMIT');
    console.log('');
    console.log('🎉 Migración completada exitosamente');
    console.log('');
    console.log('Usuarios creados:');
    console.log('  Admin:  admin@immusica.com / admin123');
    console.log('  Artista: artist@immusic.com / password123');
    console.log('');
    console.log('Próximo paso: actualizar DATABASE_URL en el .env');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();