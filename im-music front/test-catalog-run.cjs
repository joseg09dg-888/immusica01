const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', resp => {
    if (resp.url().includes('/api/auth/login')) {
      resp.json().then(d => console.log('LOGIN API:', resp.status(), JSON.stringify(d).substring(0,100))).catch(()=>{});
    }
    if (!resp.ok() && resp.url().includes('localhost:3000') && resp.url().includes('/api/')) {
      console.log('FAILED API:', resp.status(), resp.url().replace('http://localhost:3000',''));
    }
  });

  // ── Step 1: Land on marketing page, click ENTRAR ──────────────
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.locator('button:has-text("Aceptar")').click({ force: true, timeout: 3000 }).catch(()=>{});
  await page.waitForTimeout(400);

  // Click the navbar Entrar button (small one in top right)
  await page.locator('button:has-text("Entrar")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("ENTRAR")').first().click({ timeout: 5000 }).catch(()=>{});
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ss-01-login-form.png' });
  console.log('Login form visible:', await page.locator('input[placeholder="Email"]').isVisible().catch(()=>false));

  // ── Step 2: Fill credentials ───────────────────────────────────
  await page.locator('input[placeholder="Email"]').fill('jose@immusic.com');
  await page.locator('input[placeholder="Contraseña"]').fill('Im2026!');
  await page.locator('button:has-text("ENTRAR")').last().click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/ss-02-dashboard.png' });

  const onDash = await page.locator('text=Catálogo').isVisible().catch(()=>false);
  console.log('Dashboard (sidebar visible):', onDash);
  if (!onDash) {
    console.log('Still on login/landing. Body:', (await page.locator('body').innerText().catch(()=>'')).substring(0,150));
    await browser.close(); return;
  }

  // ── Step 3: Navigate to Catálogo ──────────────────────────────
  await page.locator('text=Catálogo').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ss-03-catalog.png' });
  console.log('Catalog heading:', await page.locator('h2').first().textContent().catch(()=>''));

  // ── TEST 1: Create Track ───────────────────────────────────────
  console.log('\n--- TEST 1: Create Track ---');
  const allBtns = await page.locator('button').allTextContents();
  console.log('Buttons on page:', allBtns.filter(t=>t.trim()).slice(0,12));

  await page.locator('button').filter({ hasText: /nuevo track/i }).first().click({ timeout: 5000 }).catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-04-form.png' });

  const titleInput = page.locator('input[placeholder*="Título"]').first();
  const formOpen = await titleInput.isVisible().catch(()=>false);
  console.log('Form opened:', formOpen);

  if (formOpen) {
    await titleInput.fill('Test Song');
    await page.locator('input[placeholder*="Género"]').first().fill('Pop').catch(()=>{});
    await page.locator('button').filter({ hasText: /CREAR TRACK/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/ss-05-after-create.png' });

    const toast = await page.locator('[class*="toast"],[role="alert"]').first().textContent().catch(()=>null);
    console.log('Toast:', toast || '(faded)');
    const inList = await page.locator('text=Test Song').first().isVisible().catch(()=>false);
    console.log('TEST 1 RESULT:', inList ? '✅ "Test Song" visible in list' : '❌ NOT in list');
  } else {
    console.log('TEST 1 RESULT: ❌ Form did not open');
  }

  // ── TEST 2: Bulk Upload ────────────────────────────────────────
  console.log('\n--- TEST 2: Bulk Upload ---');
  await page.locator('button').filter({ hasText: /Subida Masiva/i }).first().click().catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-06-bulk.png' });

  const wav = Buffer.alloc(44);
  wav.write('RIFF',0); wav.writeUInt32LE(36,4); wav.write('WAVE',8);
  wav.write('fmt ',12); wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20);
  wav.writeUInt16LE(1,22); wav.writeUInt32LE(44100,24); wav.writeUInt32LE(88200,28);
  wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34);
  wav.write('data',36); wav.writeUInt32LE(0,40);
  fs.writeFileSync('/tmp/bulk-test.wav', wav);

  await page.locator('input[type="file"]').first().setInputFiles('/tmp/bulk-test.wav');
  await page.waitForTimeout(800);
  console.log('File shown:', await page.locator('text=bulk-test.wav').isVisible().catch(()=>false));

  await page.locator('button').filter({ hasText: /Subir todo/i }).first().click().catch(()=>{});
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/ss-07-bulk-result.png' });

  const resultText = await page.locator('text=archivos subidos').textContent().catch(()=>null);
  const errShown = await page.locator('text=✗ Error').isVisible().catch(()=>false);
  console.log('TEST 2 RESULT:', resultText ? '✅ ' + resultText.trim() : '❌ No result');
  console.log('✗ Error shown:', errShown);

  await browser.close();
  console.log('\nDone.');
})().catch(e => console.error('FATAL:', e.message));
