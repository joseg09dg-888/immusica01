require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

async function test() {
  // 1. DB
  try {
    const r = await pool.query('SELECT COUNT(*) FROM users');
    console.log('DB: OK - users:', r.rows[0].count);
  } catch(e) { console.log('DB FAILED:', e.message); }

  // 2. Login
  let token = '';
  try {
    const r = await fetch('http://localhost:3000/api/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email:'jose@immusic.com', password:'Im2026!'})
    });
    const d = await r.json();
    token = d.token || '';
    console.log('LOGIN:', token ? 'OK user_id='+d.user?.id : 'FAILED - ' + JSON.stringify(d));
  } catch(e) { console.log('LOGIN FAILED:', e.message); }

  if (!token) { console.log('STOPPING - no token'); pool.end(); return; }

  const tests = [
    ['GET', '/api/tracks'],
    ['POST', '/api/tracks', {title:'Test Track',genre:'Trap'}],
    ['GET', '/api/royalties/summary'],
    ['GET', '/api/splits'],
    // splits are per-track: /api/tracks/:id/splits — skip standalone POST
    ['GET', '/api/releases'],
    ['GET', '/api/videos'],
    ['GET', '/api/marketplace/beats'],
    ['POST', '/api/marketplace/beats', {titulo:'Test Beat',precio:50000,genero:'Trap',bpm:140,tonalidad:'Am'}],
    ['GET', '/api/community/messages'],
    ['POST', '/api/community/messages', {message:'Hola desde test'}],
    ['POST', '/api/ai/chat', {message:'hola'}],
    ['POST', '/api/legal-agent/consulta', {pregunta:'que es copyright'}],
    ['GET', '/api/playlists'],
    ['GET', '/api/financing/eligibility'],
    ['GET', '/api/stats'],
    ['GET', '/api/feedback'],
    ['POST', '/api/feedback', {type:'bug',title:'Test Bug',description:'Test description',priority:'media'}],
    ['GET', '/api/labels/my'],
    ['GET', '/api/vault/files'],
    ['GET', '/api/royalties/monthly'],
    ['GET', '/api/auth/profile'],
    ['GET', '/api/team'],
    ['GET', '/api/publishing'],
    ['GET', '/api/legal-agent/historial'],
    ['GET', '/api/lyrics'],
    ['GET', '/api/videos/analytics'],
    ['GET', '/api/financing/solicitud'],
  ];

  for (const [method, path, body] of tests) {
    try {
      const r = await fetch('http://localhost:3000' + path, {
        method,
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: body ? JSON.stringify(body) : undefined
      });
      const d = await r.json().catch(()=>({}));
      const ok = r.status < 400;
      const snippet = ok ? (Array.isArray(d)?`[${d.length} items]`:JSON.stringify(d).substring(0,60)) : JSON.stringify(d).substring(0,80);
      console.log((ok?'✅':'❌') + ' ' + method + ' ' + path + ' -> ' + r.status + ' ' + snippet);
    } catch(e) {
      console.log('❌ ' + method + ' ' + path + ' -> EXCEPTION: ' + e.message);
    }
  }
  pool.end();
}

test();
