const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Iniciando correcciones automáticas...');

// 1. Añadir spotify_verified al modelo Artist
const artistModelPath = path.join(__dirname, 'src', 'models', 'Artist.ts');
let artistModel = fs.readFileSync(artistModelPath, 'utf8');

// Añadir la propiedad a la interfaz
if (!artistModel.includes('spotify_verified:')) {
  artistModel = artistModel.replace(
    /avatar: string \| null;/,
    'avatar: string | null;\n  spotify_verified: number; // 0 o 1'
  );
}

// Añadir el campo a createArtist
if (!artistModel.includes('spotify_verified')) {
  artistModel = artistModel.replace(
    /INSERT INTO artists \(user_id, name, genre, bio, tier, avatar\)/,
    'INSERT INTO artists (user_id, name, genre, bio, tier, avatar, spotify_verified)'
  );
  artistModel = artistModel.replace(
    /VALUES \(\?, \?, \?, \?, \?, \?\)/,
    'VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  artistModel = artistModel.replace(
    /\);/,
    ',\n    artistData.spotify_verified || 0\n  );'
  );
}
fs.writeFileSync(artistModelPath, artistModel);
console.log('✅ Modelo Artist actualizado');

// 2. Corregir stripeController.ts
const stripePath = path.join(__dirname, 'src', 'controllers', 'stripeController.ts');
let stripeContent = fs.readFileSync(stripePath, 'utf8');

// Eliminar la opción apiVersion
stripeContent = stripeContent.replace(
  /const stripe = new Stripe\(process\.env\.STRIPE_SECRET_KEY!, { apiVersion: '.*' }\);/,
  'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);'
);
// Corregir nombres de campos (si es necesario)
stripeContent = stripeContent.replace(/current_period_start/g, 'current_period_start');
stripeContent = stripeContent.replace(/current_period_end/g, 'current_period_end');
fs.writeFileSync(stripePath, stripeContent);
console.log('✅ StripeController corregido');

// 3. Corregir royaltyController en routes
const royaltyRoutesPath = path.join(__dirname, 'src', 'routes', 'royaltyController.ts');
if (fs.existsSync(royaltyRoutesPath)) {
  let royaltyRoutes = fs.readFileSync(royaltyRoutesPath, 'utf8');
  // Añadir import de db si no existe
  if (!royaltyRoutes.includes("import db from '../database'")) {
    royaltyRoutes = royaltyRoutes.replace(
      /import \* as RoyaltyModel from '\.\.\/models\/Royalty';/,
      "import * as RoyaltyModel from '../models/Royalty';\nimport db from '../database';"
    );
  }
  // Reemplazar getAllTracks
  royaltyRoutes = royaltyRoutes.replace(
    /const tracks = TrackModel\.getAllTracks\(\)\.filter\(\(t: any\) => t\.title === row\.track_title\);/,
    `const track = db.prepare('SELECT id FROM tracks WHERE title = ?').get(row.track_title) as { id: number } | undefined;\n          if (track) trackId = track.id;`
  );
  fs.writeFileSync(royaltyRoutesPath, royaltyRoutes);
  console.log('✅ royaltyController en routes corregido');
}

// 4. Mover/eliminar royaltyController duplicado
const srcRoyaltyPath = path.join(__dirname, 'src', 'royaltyController.ts');
if (fs.existsSync(srcRoyaltyPath)) {
  fs.unlinkSync(srcRoyaltyPath);
  console.log('✅ Archivo duplicado eliminado');
}

// 5. Añadir columna a la base de datos (si no existe)
try {
  const dbPath = path.join(__dirname, 'music_platform.db');
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  db.exec('ALTER TABLE artists ADD COLUMN spotify_verified BOOLEAN DEFAULT 0;');
  console.log('✅ Columna spotify_verified añadida a la base de datos');
} catch (e) {
  console.log('ℹ️ La columna ya existe o no se pudo añadir');
}

console.log('🎉 Todas las correcciones aplicadas. Ahora ejecuta:');
console.log('1. npm run build (para verificar)');
console.log('2. gcloud builds submit --pack image=northamerica-northeast1-docker.pkg.dev/gen-lang-client-0084827656/cloud-run-source-deploy/distribucion:latest');
console.log('3. gcloud run deploy distribucion --image northamerica-northeast1-docker.pkg.dev/gen-lang-client-0084827656/cloud-run-source-deploy/distribucion:latest --region northamerica-northeast1 --allow-unauthenticated');