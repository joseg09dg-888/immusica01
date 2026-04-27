/**
 * IM Music Auto-QA — runs full endpoint audit, security checks, and writes report.
 * Usage: node scripts/auto-qa.cjs
 */
const fs = require('fs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const BASE = 'http://localhost:3001';
const LOG_DIR = 'logs';
const REPORT_FILE = LOG_DIR + '/qa-report.md';
const ERRORS_FILE = LOG_DIR + '/errors.md';
const HISTORY_FILE = LOG_DIR + '/qa-history.log';

async function runFullAudit() {
  const timestamp = new Date().toISOString();
  console.log('\n=== IM MUSIC QA AUDIT:', timestamp, '===\n');

  fs.mkdirSync(LOG_DIR, { recursive: true });

  // ── Get test token ────────────────────────────────────────────────────────
  let token = '';
  try {
    const u = await pool.query('SELECT * FROM users WHERE email=$1', ['jose@immusic.com']);
    if (!u.rows.length) throw new Error('Test user not found');
    token = jwt.sign(
      { id: u.rows[0].id, email: u.rows[0].email, role: u.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  } catch (e) {
    console.error('CRITICAL: Cannot get test token —', e.message);
    pool.end();
    process.exit(1);
  }

  const authH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const openH = { 'Content-Type': 'application/json' };

  // ── Endpoint tests ────────────────────────────────────────────────────────
  const endpoints = [
    ['GET',  '/api/health',                    null,                                          false],
    ['POST', '/api/auth/login',               { email: 'jose@immusic.com', password: 'Im2026!' }, false],
    ['GET',  '/api/tracks',                    null,                                          true],
    ['GET',  '/api/royalties/summary',         null,                                          true],
    ['GET',  '/api/royalties/monthly',         null,                                          true],
    ['GET',  '/api/splits',                    null,                                          true],
    ['GET',  '/api/releases',                  null,                                          true],
    ['GET',  '/api/videos',                    null,                                          true],
    ['GET',  '/api/marketplace/beats',         null,                                          true],
    ['GET',  '/api/marketplace/hot',           null,                                          true],
    ['GET',  '/api/marketplace/top-rated',     null,                                          true],
    ['GET',  '/api/marketplace/my-beats',      null,                                          true],
    ['GET',  '/api/community/messages',        null,                                          true],
    ['GET',  '/api/playlists',                 null,                                          true],
    ['GET',  '/api/financing/eligibility',     null,                                          true],
    ['GET',  '/api/stats',                     null,                                          true],
    ['GET',  '/api/feedback',                  null,                                          true],
    ['GET',  '/api/labels/my',                 null,                                          true],
    ['GET',  '/api/team',                      null,                                          true],
    ['GET',  '/api/auth/profile',              null,                                          true],
    ['GET',  '/api/publishing',                null,                                          true],
    ['GET',  '/api/vault/files',               null,                                          true],
    ['GET',  '/api/lyrics/1',                  null,                                          true],
    ['POST', '/api/ai/chat',                  { message: 'qa-test' },                         true],
    ['POST', '/api/ai/extract-metadata',      { filename: 'qa.wav', size: 1000 },             true],
    ['POST', '/api/ai/market-intel',          { genre: 'pop' },                               true],
    ['POST', '/api/ai/archetype',             { genre: 'trap' },                              true],
    ['POST', '/api/legal-agent/consulta',     { consulta: 'test' },                           true],
    ['POST', '/api/marketing/test',           { genre: 'pop', mood: 'happy' },                true],
    ['POST', '/api/marketing/content-plan/purchase', {},                                      true],
    ['POST', '/api/community/messages',       { content: '__qa-test__' },                     true],
    ['POST', '/api/feedback',                 { type: 'bug', title: '__QA Test__', description: 'automated' }, true],
    ['POST', '/api/splits',                   { name: '__QA Collab__', email: 'qa@test.com', percentage: 10 }, true],
    ['POST', '/api/releases',                 { title: '__QA Release__', platforms: ['Spotify'] }, true],
  ];

  const report = [];
  const errors = [];
  let passed = 0, failed = 0;

  for (const [method, path, body, needsAuth] of endpoints) {
    try {
      const r = await fetch(BASE + path, {
        method,
        headers: needsAuth ? authH : openH,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (r.status < 400) {
        passed++;
        console.log('✅ ' + method + ' ' + path);
        report.push('✅ ' + method + ' ' + path);
      } else {
        failed++;
        const msg = '❌ ' + method + ' ' + path + ' → ' + r.status + ' ' + JSON.stringify(data).slice(0, 100);
        console.log(msg);
        report.push(msg);
        errors.push(msg);
      }
    } catch (e) {
      failed++;
      const msg = '💥 ' + method + ' ' + path + ' → EXCEPTION: ' + e.message;
      console.log(msg);
      report.push(msg);
      errors.push(msg);
    }
  }

  // ── Cleanup test data ─────────────────────────────────────────────────────
  await pool.query("DELETE FROM community_messages WHERE content='__qa-test__'").catch(() => {});
  await pool.query("DELETE FROM feedback WHERE title='__QA Test__'").catch(() => {});
  await pool.query("DELETE FROM splits WHERE email='qa@test.com'").catch(() => {});
  await pool.query("DELETE FROM releases WHERE title='__QA Release__'").catch(() => {});

  // ── Security checks ───────────────────────────────────────────────────────
  const secChecks = [];
  console.log('\n--- Security checks ---');

  // 1. Unauthenticated access
  const noAuth = await fetch(BASE + '/api/tracks').catch(() => ({ status: 0 }));
  const secOk1 = noAuth.status === 401;
  const s1 = (secOk1 ? '✅' : '🚨') + ' Unauthenticated /api/tracks → ' + noAuth.status + (secOk1 ? '' : ' (SECURITY HOLE)');
  console.log(s1); secChecks.push(s1);
  if (!secOk1) errors.push('SECURITY: /api/tracks accessible without auth');

  // 2. SQL injection on login
  const inj = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: openH,
    body: JSON.stringify({ email: "' OR '1'='1", password: "' OR '1'='1" }),
  }).catch(() => ({ status: 500, json: async () => ({}) }));
  const injData = await inj.json().catch(() => ({}));
  const secOk2 = !(inj.status === 200 && injData.token);
  const s2 = (secOk2 ? '✅' : '🚨 CRITICAL') + ' SQL injection on login → ' + inj.status;
  console.log(s2); secChecks.push(s2);
  if (!secOk2) errors.push('CRITICAL SECURITY: SQL injection works on login');

  // 3. Rate limiting
  let rateLimited = false;
  for (let i = 0; i < 22; i++) {
    const r = await fetch(BASE + '/api/auth/login', {
      method: 'POST', headers: openH,
      body: JSON.stringify({ email: 'qa-rate@test.com', password: 'wrong' }),
    }).catch(() => ({ status: 0 }));
    if (r.status === 429) { rateLimited = true; break; }
  }
  const s3 = (rateLimited ? '✅' : '⚠️') + ' Rate limiting on /api/auth/login: ' + (rateLimited ? 'active' : 'NOT triggered after 22 reqs');
  console.log(s3); secChecks.push(s3);

  // ── Write report ──────────────────────────────────────────────────────────
  const reportMd = [
    '# QA Report — ' + timestamp,
    '',
    '## Endpoints: ' + passed + ' passed / ' + failed + ' failed',
    '',
    ...report,
    '',
    '## Security',
    ...secChecks,
    '',
    '## Summary',
    '- Endpoints: **' + passed + '/' + (passed + failed) + ' OK**',
    '- Errors: **' + errors.length + '**',
    '- Status: ' + (errors.length === 0 ? '✅ ALL GOOD' : '❌ NEEDS ATTENTION'),
  ].join('\n');

  fs.writeFileSync(REPORT_FILE, reportMd);
  fs.appendFileSync(HISTORY_FILE, '[' + timestamp + '] ' + passed + '/' + (passed + failed) + ' passed, ' + errors.length + ' errors\n');

  if (errors.length > 0) {
    fs.writeFileSync(ERRORS_FILE, ['# Errors — ' + timestamp, '', ...errors.map((e, i) => (i + 1) + '. ' + e)].join('\n'));
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach(e => console.log(e));
  } else {
    if (fs.existsSync(ERRORS_FILE)) fs.unlinkSync(ERRORS_FILE);
  }

  console.log('\n=== RESULTS: ' + passed + '/' + (passed + failed) + ' passed | ' + errors.length + ' errors ===');
  console.log('Report: ' + REPORT_FILE);

  pool.end();
  return { passed, failed, errors };
}

runFullAudit().catch(e => { console.error('FATAL:', e.message); pool.end(); process.exit(1); });
