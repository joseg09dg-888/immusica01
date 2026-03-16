const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('music_platform.db');
const email = 'aioperatorimmusic@gmail.com';
const password = 'openclaw123IM';

// Generar nuevo hash
const hash = bcrypt.hashSync(password, 10);
console.log('Hash generado:', hash);

// Verificar si el usuario existe
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
if (user) {
  // Actualizar contraseña
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
  console.log('✅ Contraseña actualizada para', email);
} else {
  // Crear usuario si no existe
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
    email,
    hash,
    'iaoperatorbenito',
    'ai_operator'
  );
  console.log('✅ Usuario creado para', email);
}