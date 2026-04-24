const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (['error','warn'].includes(msg.type()) || msg.text().includes('CREATE ERROR')) {
      console.log('BROWSER:', msg.type().toUpperCase(), msg.text().substring(0, 120));
    }
  });
  page.on('response', resp => {
    if (!resp.ok() && resp.url().includes('localhost:3000')) {
      console.log('FAILED REQUEST:', resp.status(), resp.url());
    }
  });

  // Login
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'jose@immusic.com').catch(()=>{});
  await page.fill('input[type="password"]', 'Im2026!').catch(()=>{});
  await page.click('button[type="submit"]').catch(async () => {
    await page.locator('button:has-text("Entrar"), button:has-text("ENTRAR")').first().click().catch(()=>{});
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/ss-01-after-login.png' });
  console.log('Logged in. URL:', page.url());

  // Navigate to Catálogo
  await page.locator('text=Catálogo').first().click().catch(()=>{});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ss-02-catalog.png' });
  console.log('On catalog. Page text sample:', (await page.locator('h1,h2,h3').first().textContent().catch(()=>'')));

  // ── TEST 1: Create Track ─────────────────────────────────────────
  console.log('\n--- TEST 1: + Nuevo Track ---');
  await page.locator('button:has-text("Nuevo track")').first().click().catch(async () => {
    await page.locator('button:has-text("Nuevo Track")').first().click().catch(()=>{});
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-03-form.png' });

  const titleInput = page.locator('input[placeholder*="Título"]').first();
  const formVisible = await titleInput.isVisible().catch(() => false);
  console.log('Form opened:', formVisible);

  if (formVisible) {
    await titleInput.fill('Test Song');
    await page.waitForTimeout(300);
    
    const createBtn = page.locator('button:has-text("CREAR TRACK")').first();
    console.log('CREAR TRACK button visible:', await createBtn.isVisible().catch(()=>false));
    await createBtn.click().catch(async () => {
      await page.locator('button:has-text("Crear")').first().click().catch(()=>{});
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: '/tmp/ss-04-after-create.png' });

    // Check toast
    const toast = await page.locator('[class*="toast"], [role="alert"]').first().textContent().catch(() => null);
    console.log('Toast visible:', toast || '(faded or none)');

    // Check track in list
    const inList = await page.locator('text=Test Song').isVisible().catch(() => false);
    console.log('TEST 1 RESULT:', inList ? '✅ Track "Test Song" visible in list' : '❌ Track NOT visible in list');
  } else {
    console.log('TEST 1 RESULT: ❌ Form did not open');
    await page.screenshot({ path: '/tmp/ss-03-form-fail.png' });
  }

  // ── TEST 2: Bulk Upload ──────────────────────────────────────────
  console.log('\n--- TEST 2: Bulk Upload ---');
  await page.locator('button:has-text("Subida Masiva")').first().click().catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-05-bulk.png' });

  // Create minimal WAV
  const wavBuf = Buffer.alloc(44);
  wavBuf.write('RIFF',0); wavBuf.writeUInt32LE(36,4); wavBuf.write('WAVE',8);
  wavBuf.write('fmt ',12); wavBuf.writeUInt32LE(16,16); wavBuf.writeUInt16LE(1,20);
  wavBuf.writeUInt16LE(1,22); wavBuf.writeUInt32LE(44100,24); wavBuf.writeUInt32LE(88200,28);
  wavBuf.writeUInt16LE(2,32); wavBuf.writeUInt16LE(16,34);
  wavBuf.write('data',36); wavBuf.writeUInt32LE(0,40);
  fs.writeFileSync('/tmp/bulk-test.wav', wavBuf);

  const fileInput = page.locator('input[type="file"][accept*="audio"]').first();
  await fileInput.setInputFiles('/tmp/bulk-test.wav');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-06-bulk-file.png' });
  console.log('File attached. File shown in list:', await page.locator('text=bulk-test.wav').isVisible().catch(()=>false));

  await page.locator('button:has-text("Subir todo")').first().click().catch(()=>{});
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/ss-07-bulk-result.png' });

  const resultBanner = await page.locator('text=archivos subidos').textContent().catch(() => null);
  const errRow = await page.locator('text=✗ Error').isVisible().catch(() => false);
  console.log('Result banner:', resultBanner || '(not found)');
  console.log('✗ Error shown:', errRow);
  console.log('TEST 2 RESULT:', resultBanner ? '✅ ' + resultBanner : '❌ No result banner');

  await browser.close();
  console.log('\nScreenshots saved to /tmp/ss-0*.png');
})();
