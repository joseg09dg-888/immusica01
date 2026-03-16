const Database = require('better-sqlite3');
const db = new Database('music_platform.db');

try {
  const insert = db.prepare(`
    INSERT INTO users (email, password, name, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = insert.run(
    'aioperatorimmusic@gmail.com',
    '$2b$10$JPfzzusyQyN0LkijHsO/EO4h1D2np/GVKdJDpMu9ChqTXFYSKsK7W',
    'iaoperatorbenito',
    'ai_operator'
  );
  console.log('✅ Usuario IA creado correctamente. ID:', result.lastInsertRowid);
} catch (error) {
  console.error('❌ Error al crear usuario:', error.message);
}