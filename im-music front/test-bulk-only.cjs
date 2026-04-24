const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('request', req => {
    if (req.url().includes('/upload')) {
      console.log('REQ:', req.method(), req.url().replace('http://localhost:3000',''), '| auth:', req.headers()['authorization'] ? 'YES' : 'NO');
    }
  });
  page.on('response', async resp => {
    if (resp.url().includes('/upload')) {
      const body = await resp.text().catch(()=>'');
      console.log('RES:', resp.status(), resp.url().replace('http://localhost:3000',''), '|', body.substring(0,150));
    }
  });

  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');

  // Dismiss cookie + click Entrar all with force
  await page.locator('button:has-text("Aceptar")').click({ force: true, timeout: 3000 }).catch(()=>{});
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Entrar")').first().click({ force: true });
  await page.waitForTimeout(800);

  await page.locator('input[placeholder="Email"]').fill('jose@immusic.com');
  await page.locator('input[placeholder="Contraseña"]').fill('Im2026!');
  await page.locator('button:has-text("ENTRAR")').last().click({ force: true });
  await page.waitForTimeout(3500);

  const tok = await page.evaluate(() => localStorage.getItem('im_token'));
  console.log('Token stored:', tok ? tok.substring(0,40)+'...' : 'NULL');

  await page.locator('text=Catálogo').first().click({ force: true });
  await page.waitForTimeout(1000);
  await page.locator('button').filter({ hasText: /Subida Masiva/i }).first().click({ force: true });
  await page.waitForTimeout(600);

  const wav = Buffer.alloc(44);
  wav.write('RIFF',0); wav.writeUInt32LE(36,4); wav.write('WAVE',8);
  wav.write('fmt ',12); wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20);
  wav.writeUInt16LE(1,22); wav.writeUInt32LE(44100,24); wav.writeUInt32LE(88200,28);
  wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34);
  wav.write('data',36); wav.writeUInt32LE(0,40);
  fs.writeFileSync('/tmp/bulk-test.wav', wav);

  await page.locator('input[type="file"]').first().setInputFiles('/tmp/bulk-test.wav');
  await page.waitForTimeout(600);
  await page.locator('button').filter({ hasText: /Subir todo/i }).first().click({ force: true });
  await page.waitForTimeout(5000);

  console.log('\nResult:', await page.locator('text=archivos subidos').textContent().catch(()=>'(none)'));
  await browser.close();
})().catch(e => console.error('FATAL:', e.message));
