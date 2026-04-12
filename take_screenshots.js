const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);

  // Inject token directly to skip login UI
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW1haWwiOiJkZW1vQGltbXVzaWMuY28iLCJyb2xlIjoiYXJ0aXN0IiwiaWF0IjoxNzc1OTU1ODkwLCJleHAiOjE3NzY1NjA2OTB9.bT6TZf0HJPtuoZcHbfcRBdXV9d3HLYTfyv2WyeCWjsY';
  await page.evaluate((tok) => {
    localStorage.setItem('im_token', tok);
  }, token);
  await page.reload();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'C:\\Users\\jose-\\AppData\\Local\\Temp\\screen_dashboard.png' });
  console.log('dashboard done');

  // Navigate to Royalties
  try {
    const royBtn = await page.$('button:has-text("Regalías")');
    if (royBtn) { await royBtn.click(); await page.waitForTimeout(1500); }
    await page.screenshot({ path: 'C:\\Users\\jose-\\AppData\\Local\\Temp\\screen_royalties.png' });
    console.log('royalties done');
  } catch(e) { console.log('royalties err:', e.message); }

  // Navigate to Catalog
  try {
    const catBtn = await page.$('button:has-text("Catálogo")');
    if (catBtn) { await catBtn.click(); await page.waitForTimeout(1500); }
    await page.screenshot({ path: 'C:\\Users\\jose-\\AppData\\Local\\Temp\\screen_catalog.png' });
    console.log('catalog done');
  } catch(e) { console.log('catalog err:', e.message); }

  // Navigate to AI Chat
  try {
    const aiBtn = await page.$('button:has-text("IA Chat")');
    if (aiBtn) { await aiBtn.click(); await page.waitForTimeout(1500); }
    await page.screenshot({ path: 'C:\\Users\\jose-\\AppData\\Local\\Temp\\screen_aichat.png' });
    console.log('aichat done');
  } catch(e) { console.log('aichat err:', e.message); }

  await browser.close();
  console.log('ALL DONE');
})().catch(e => { console.error(e.message); process.exit(1); });
