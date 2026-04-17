require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

(async () => {
  // Check tables exist
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('chat_messages','chat_bans','user_infractions')");
  console.log('Tables:', tables.rows.map(r=>r.table_name));

  if (tables.rows.find(r=>r.table_name==='chat_messages')) {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='chat_messages'");
    console.log('chat_messages columns:', cols.rows.map(r=>r.column_name).join(', '));
  }
  
  try {
    const r = await pool.query("INSERT INTO chat_messages (user_id, user_name, message, link) VALUES ($1,$2,$3,$4) RETURNING *", [1, 'TestUser', 'Test message', null]);
    console.log('Direct insert OK:', JSON.stringify(r.rows[0]));
    await pool.query("DELETE FROM chat_messages WHERE user_id=1 AND message='Test message'");
  } catch(e) {
    console.log('Direct insert FAILED:', e.message);
  }
  
  await pool.end();
})();
