import db from '../config/database';

export const runJobs = () => {
  console.log('Running scheduled jobs...');
  
  // 1. Release Publisher
  const now = new Date().toISOString();
  const pendingReleases = db.prepare("SELECT * FROM scheduled_releases WHERE status = 'scheduled' AND release_date <= ?").all(now) as any[];
  
  for (const release of pendingReleases) {
    console.log(`Publishing track ${release.track_id}...`);
    db.prepare("UPDATE tracks SET status = 'published' WHERE id = ?").run(release.track_id);
    db.prepare("UPDATE scheduled_releases SET status = 'published' WHERE id = ?").run(release.id);
    
    // Simulate distribution to platforms
    const platforms = JSON.parse(release.platforms || '[]');
    for (const platform of platforms) {
      db.prepare("INSERT INTO store_distributions (track_id, platform, status, distributed_at) VALUES (?, ?, 'completed', ?)").run(release.track_id, platform, now);
    }
  }

  // 2. Store Maximizer (Auto-Distribute)
  const autoDistTracks = db.prepare("SELECT * FROM tracks WHERE auto_distribute = 1 AND status = 'published'").all() as any[];
  const allPlatforms = ['Spotify', 'Apple Music', 'Tidal', 'Deezer', 'Amazon Music', 'YouTube Music'];
  
  for (const track of autoDistTracks) {
    const existingDist = (db.prepare("SELECT platform FROM store_distributions WHERE track_id = ?").all(track.id) as any[]).map(d => d.platform);
    const missingPlatforms = allPlatforms.filter(p => !existingDist.includes(p));
    
    for (const platform of missingPlatforms) {
      console.log(`Auto-distributing track ${track.id} to ${platform}...`);
      db.prepare("INSERT INTO store_distributions (track_id, platform, status, distributed_at) VALUES (?, ?, 'completed', ?)").run(track.id, platform, now);
    }
  }
};

// Run every minute for simulation
setInterval(runJobs, 60000);
