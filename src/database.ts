import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const client: PoolClient = await pool.connect();
  try {
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
        scheduled_date TEXT,
        published_at TEXT,
        cover TEXT,
        audio_url TEXT,
        status TEXT DEFAULT 'draft',
        isrc TEXT,
        upc TEXT,
        auto_distribute BOOLEAN DEFAULT FALSE,
        is_legacy BOOLEAN DEFAULT FALSE,
        legacy_purchased_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS royalties (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        cantidad REAL NOT NULL,
        estado TEXT DEFAULT 'proyectado',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS splits (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        artist_name TEXT NOT NULL,
        email TEXT,
        role TEXT,
        percentage REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        invitation_token TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS split_invitations (
        id SERIAL PRIMARY KEY,
        split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS royalty_withholdings (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        split_id INTEGER REFERENCES splits(id) ON DELETE SET NULL,
        cantidad REAL NOT NULL,
        estado TEXT DEFAULT 'retenido',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        released_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS daily_stats (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        streams INTEGER DEFAULT 0,
        ingresos REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(track_id, fecha, plataforma)
      );
      CREATE TABLE IF NOT EXISTS landing_pages (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        spotify_url TEXT,
        apple_music_url TEXT,
        youtube_url TEXT,
        other_url TEXT,
        config TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        landing_page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(landing_page_id, email)
      );
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        genre TEXT,
        mood_tags TEXT,
        contact_email TEXT,
        description TEXT,
        submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration_seconds INTEGER,
        resolution TEXT,
        status TEXT DEFAULT 'draft',
        platform_status TEXT,
        youtube_url TEXT,
        vevo_url TEXT,
        tags TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS track_lyrics (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL UNIQUE REFERENCES tracks(id) ON DELETE CASCADE,
        lyrics_text TEXT,
        synced_lyrics TEXT,
        language TEXT,
        is_synced BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS compositions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        iswc TEXT UNIQUE,
        language TEXT,
        duration_seconds INTEGER,
        lyrics TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS track_compositions (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        percentage_used REAL DEFAULT 100,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(track_id, composition_id)
      );
      CREATE TABLE IF NOT EXISTS composers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        pro_affiliation TEXT,
        pro_number TEXT,
        ipi TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS composition_splits (
        id SERIAL PRIMARY KEY,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        composer_id INTEGER NOT NULL REFERENCES composers(id) ON DELETE CASCADE,
        role TEXT,
        percentage REAL NOT NULL CHECK(percentage > 0 AND percentage <= 100),
        ownership_type TEXT DEFAULT 'writer',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(composition_id, composer_id)
      );
      CREATE TABLE IF NOT EXISTS composition_registrations (
        id SERIAL PRIMARY KEY,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        pro_name TEXT NOT NULL,
        registration_number TEXT,
        registration_date TEXT,
        status TEXT DEFAULT 'pending',
        response_data TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS publishing_royalties (
        id SERIAL PRIMARY KEY,
        composition_id INTEGER NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        tipo TEXT,
        cantidad REAL NOT NULL,
        territorio TEXT,
        uso_categoria TEXT,
        estado TEXT DEFAULT 'proyectado',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS publishing_distributions (
        id SERIAL PRIMARY KEY,
        publishing_royalty_id INTEGER NOT NULL REFERENCES publishing_royalties(id) ON DELETE CASCADE,
        composer_id INTEGER NOT NULL REFERENCES composers(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        percentage_applied REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        paid_at TIMESTAMPTZ,
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS user_artists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'owner',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, artist_id)
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        status TEXT DEFAULT 'active',
        transaction_id TEXT,
        max_artists INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS playlist_submissions (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        message TEXT,
        contact_email TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        responded_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS vault_files (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        category TEXT DEFAULT 'other',
        description TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS riaa_certifications (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        certification_type TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        achieved_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS store_distributions (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        store_name TEXT NOT NULL,
        store_url TEXT,
        status TEXT DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS youtube_content_id (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        registration_id TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        claim_url TEXT,
        registered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS legacy_purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        amount REAL NOT NULL,
        purchase_date TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_agent_config (
        id SERIAL PRIMARY KEY,
        agent_name TEXT DEFAULT 'OpenClaw',
        emergency_stop BOOLEAN DEFAULT FALSE,
        max_tasks_per_hour INTEGER DEFAULT 50,
        working_hours_start TEXT DEFAULT '00:00',
        working_hours_end TEXT DEFAULT '23:59',
        github_repo TEXT,
        github_token_encrypted TEXT,
        telegram_bot_token TEXT,
        whatsapp_api_key TEXT,
        last_heartbeat TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_tasks (
        id SERIAL PRIMARY KEY,
        task_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 1,
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_action_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_inbox (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        sender TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        status TEXT DEFAULT 'unread',
        assigned_task_id INTEGER REFERENCES ai_tasks(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      );
    `);

    await client.query(`
      INSERT INTO ai_agent_config (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ PostgreSQL conectado y tablas listas');
  } catch (error) {
    console.error('❌ Error inicializando DB:', error);
    throw error;
  } finally {
    client.release();
  }
}

const db = {
  prepare: (sql: string) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    return {
      run: (...params: any[]): Promise<{ lastInsertRowid: any; changes: number | null }> =>
        pool.query(pgSql, params).then((r: QueryResult) => ({
          lastInsertRowid: r.rows[0]?.id,
          changes: r.rowCount
        })),
      get: (...params: any[]): Promise<any> =>
        pool.query(pgSql, params).then((r: QueryResult) => r.rows[0]),
      all: (...params: any[]): Promise<any[]> =>
        pool.query(pgSql, params).then((r: QueryResult) => r.rows)
    };
  },
  exec: (sql: string): Promise<QueryResult> => pool.query(sql),
  transaction: (fn: (data: any) => void) => async (data: any): Promise<void> => {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      await fn(data);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

initDB().catch(console.error);

export { pool };
export default db;