const Database = require('better-sqlite3');
const db = new Database('music_platform.db');

try {
  // Verificar si las columnas ya existen
  const tableInfo = db.prepare("PRAGMA table_info(tracks)").all();
  const columnNames = tableInfo.map(col => col.name);

  if (!columnNames.includes('scheduled_date')) {
    db.exec("ALTER TABLE tracks ADD COLUMN scheduled_date TEXT;");
    console.log('✅ Columna scheduled_date agregada');
  } else {
    console.log('ℹ️ scheduled_date ya existe');
  }

  if (!columnNames.includes('published_at')) {
    db.exec("ALTER TABLE tracks ADD COLUMN published_at TEXT;");
    console.log('✅ Columna published_at agregada');
  } else {
    console.log('ℹ️ published_at ya existe');
  }

} catch (error) {
  console.error('Error:', error.message);
}