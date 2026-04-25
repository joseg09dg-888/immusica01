const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  const log = [];
  p.on('console', m => { if(m.type()==='error') log.push('ERR:'+m.text()); });
  p.on('response', r => { if(r.status()>=400 && r.url().includes('/api/')) log.push('API'+r.status()+':'+r.url().split('/api/')[1]); });

  await p.goto('http://localhost:3000');
  await p.waitForTimeout(2000);

  // Login
  await p.click('text=ENTRAR').catch(()=>{});
  await p.waitForTimeout(500);
  await p.fill('input[type=email]','jose@immusic.com').catch(()=>{});
  await p.fill('input[type=password]','Im2026!').catch(()=>{});
  await p.click('button[type=submit]').catch(()=>{});
  await p.waitForTimeout(3000);

  // Skip tour if visible
  await p.click('button:has-text("Saltar")').catch(()=>{});
  await p.waitForTimeout(500);
  await p.evaluate(()=>localStorage.setItem('im_tour_done','1'));
  await p.waitForTimeout(500);

  console.log('LOGIN done');

  const tests = [
    ['Catálogo', async()=>{
      await p.click('button:has-text("Mis Tracks"),button:has-text("Tracks")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Subir")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Splits")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Publishing")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Masiva"),button:has-text("Bulk")').catch(()=>{});
      await p.waitForTimeout(500);
    }],
    ['Regalías', async()=>{
      await p.click('button:has-text("Resumen"),button:has-text("Summary")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Master")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Publishing")').catch(()=>{});
      await p.waitForTimeout(500);
    }],
    ['Releases', async()=>{
      await p.click('button:has-text("Nuevo"),button:has-text("NUEVO")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.keyboard.press('Escape').catch(()=>{});
    }],
    ['Videos & YouTube', async()=>{
      await p.click('button:has-text("Content ID")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("Artists"),button:has-text("Artistas")').catch(()=>{});
      await p.waitForTimeout(500);
    }],
    ['Marketing Suite', async()=>{
      await p.waitForTimeout(1000);
    }],
    ['Comunidad', async()=>{
      const inp = p.locator('input[placeholder*="mensaje"],input[placeholder*="escribe"],input[placeholder*="Escribe"]').first();
      if (await inp.isVisible().catch(()=>false)) {
        await inp.fill('Hola test audit');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(1500);
      }
    }],
    ['Marketplace Beats', async()=>{
      await p.click('button:has-text("Mi Tienda")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.click('button:has-text("SUBIR BEAT"),button:has-text("+ SUBIR")').catch(()=>{});
      await p.waitForTimeout(500);
      await p.keyboard.press('Escape').catch(()=>{});
    }],
    ['Playlists', async()=>{
      await p.click('button:has-text("Descubrir"),button:has-text("Enviar")').catch(()=>{});
      await p.waitForTimeout(500);
    }],
    ['IA Chat', async()=>{
      const inp = p.locator('input[placeholder*="pregunta"],input[placeholder*="scribe"],input[placeholder*="mensaje"]').first();
      if (await inp.isVisible().catch(()=>false)) {
        await inp.fill('como subo mi musica');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(5000);
      }
    }],
    ['Legal IA', async()=>{
      const ta = p.locator('textarea').first();
      if (await ta.isVisible().catch(()=>false)) {
        await ta.fill('que es el derecho de autor');
        await p.click('button:has-text("CONSULTAR"),button:has-text("Consultar")').catch(()=>{});
        await p.waitForTimeout(5000);
      }
    }],
    ['Financiamiento', async()=>{
      await p.waitForTimeout(1000);
    }],
    ['Store Maximizer', async()=>{
      await p.waitForTimeout(1000);
    }],
    ['Mi Sello', async()=>{
      await p.waitForTimeout(1000);
    }],
    ['Estadísticas', async()=>{
      await p.waitForTimeout(1000);
    }],
    ['Feedback & Bugs', async()=>{
      await p.click('button:has-text("Reportar"),button:has-text("Bug")').catch(()=>{});
      await p.waitForTimeout(500);
    }],
    ['Ajustes', async()=>{
      await p.waitForTimeout(1000);
    }],
  ];

  for(const [name, action] of tests) {
    log.length = 0;
    const found = await p.locator('button').filter({hasText: name}).first().isVisible().catch(()=>false);
    if (!found) {
      console.log('⚠️  '+name+' | sidebar button not found');
      continue;
    }
    await p.click('button:has-text("'+name+'")', {timeout:3000}).catch(()=>{});
    await p.waitForTimeout(1200);
    await action().catch(e => log.push('ACT_ERR:'+e.message));
    await p.screenshot({path:'/tmp/audit-'+name.replace(/[^a-zA-Z]/g,'-')+'.png'});
    const errs = log.filter(e=>!e.includes('favicon') && !e.includes('hot-reload') && !e.includes('hmr'));
    console.log((errs.length===0?'✅':'❌')+' '+name+(errs.length?' | '+errs.slice(0,2).join(' | '):''));
  }

  await b.close();
  console.log('--- AUDIT DONE ---');
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
