"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
exports.pool = pool;
async function initDB() {
    const client = await pool.connect();
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
        fecha TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        tipo TEXT,
        cantidad REAL NOT NULL,
        track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        concepto TEXT,
        estado TEXT DEFAULT 'proyectado',
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
      CREATE TABLE IF NOT EXISTS legal_queries (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        pregunta TEXT NOT NULL,
        respuesta TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS beats (
        id SERIAL PRIMARY KEY,
        productor_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        genero TEXT NOT NULL,
        bpm INTEGER,
        tonalidad TEXT,
        precio INTEGER NOT NULL,
        archivo_url TEXT,
        archivo_completo_url TEXT,
        portada_url TEXT,
        descripcion TEXT,
        estado TEXT DEFAULT 'disponible',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        beat_id INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
        comprador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        monto INTEGER NOT NULL,
        comision_plataforma INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        beat_id INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        puntuacion INTEGER NOT NULL CHECK(puntuacion BETWEEN 1 AND 5),
        comentario TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(beat_id, usuario_id)
      );
      CREATE TABLE IF NOT EXISTS financing_eligibility (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS upload_jobs (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS upload_items (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES upload_jobs(id) ON DELETE CASCADE,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        mime_type TEXT,
        file_size INTEGER,
        extracted_data TEXT,
        suggested_track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'pending',
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ
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
      CREATE TABLE IF NOT EXISTS spotify_tokens (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS mood_playlists (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        mood_description TEXT NOT NULL,
        playlist_url TEXT NOT NULL,
        playlist_id TEXT NOT NULL,
        tracks_count INTEGER DEFAULT 0,
        valence REAL,
        energy REAL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS artist_fingerprints (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
        avg_valence REAL,
        avg_energy REAL,
        avg_danceability REAL,
        avg_tempo REAL,
        embedding TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
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
    }
    catch (error) {
        console.error('❌ Error inicializando DB:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
const db = {
    prepare: (sql) => {
        let i = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++i}`);
        return {
            run: (...params) => pool.query(pgSql, params).then((r) => ({
                lastInsertRowid: r.rows[0]?.id,
                changes: r.rowCount
            })),
            get: (...params) => pool.query(pgSql, params).then((r) => r.rows[0]),
            all: (...params) => pool.query(pgSql, params).then((r) => r.rows)
        };
    },
    exec: (sql) => pool.query(sql),
    transaction: (fn) => async (data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await fn(data);
            await client.query('COMMIT');
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
};
initDB().catch(console.error);
exports.default = db;
