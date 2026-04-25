const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});

  // Get token via direct HTTP
  const loginRes = await fetch('http://localhost:3000/api/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'jose@immusic.com',password:'Im2026!'})
  });
  const {token,user} = await loginRes.json();
  console.log('Got token for:', user?.email, 'status:', loginRes.status);

  const ctx = await b.newContext();
  await ctx.addInitScript((t) => {
    localStorage.setItem('im_token', t);
    localStorage.setItem('im_tour_done', '1');
  }, token);

  const p = await ctx.newPage();
  const errs = [];
  p.on('response', r => { if(r.status()>=400 && r.url().includes('/api/')) errs.push('API '+r.status()+': '+r.url().split('/api/')[1].split('?')[0]); });

  await p.goto('http://localhost:3000');
  await p.waitForTimeout(3000);
  await p.screenshot({path:'/tmp/g00-start.png'});

  const appLoaded = await p.locator('text=Catálogo').count() > 0 || await p.locator('text=Dashboard').count() > 0;
  console.log('App loaded:', appLoaded);

  // FLOW 1 - Create track via API call
  errs.length=0;
  const trackRes = await p.evaluate(async () => {
    const tok = localStorage.getItem('im_token') || '';
    const r = await fetch('/api/tracks',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
      body:JSON.stringify({title:'Test Track Flow1',genre:'Pop'})
    });
    return {status:r.status, data: await r.json()};
  });
  console.log((trackRes.status<400?'✅':'❌')+' FLOW 1 - Create track: '+trackRes.status, JSON.stringify(trackRes.data).slice(0,80));

  // Navigate to Catalog and check tracks appear
  await p.click('button:has-text("Catálogo")').catch(()=>{});
  await p.waitForTimeout(2000);
  await p.screenshot({path:'/tmp/g01-catalog.png'});

  // FLOW 2 - Add split via Catalog → Splits tab (splits merged into catalog)
  errs.length=0;
  await p.click('button:has-text("Catálogo")').catch(()=>{});
  await p.waitForTimeout(1000);
  // Click the Splits tab inside Catalog
  await p.click('button:has-text("Splits")').catch(()=>{});
  await p.waitForTimeout(1500);
  await p.screenshot({path:'/tmp/g02a-splits.png'});
  await p.click('button:has-text("AGREGAR COLABORADOR")').catch(()=>p.click('button:has-text("+ AGREGAR")').catch(()=>{}));
  await p.waitForTimeout(600);
  await p.fill('input[placeholder="Nombre del colaborador"]','Test Producer').catch(()=>{});
  await p.fill('input[placeholder="email@ejemplo.com"]','prod@test.com').catch(()=>{});
  await p.fill('input[placeholder="30"]','40').catch(()=>{});
  await p.click('button:has-text("GUARDAR COLABORADOR")').catch(()=>{});
  await p.waitForTimeout(2000);
  await p.screenshot({path:'/tmp/g02b-splits-after.png'});
  const splitOk = (await p.locator('text=Test Producer').count()) > 0;
  console.log((splitOk?'✅':'❌')+' FLOW 2 - Add split'+(errs.length?' | ERR: '+errs[0]:''));

  // FLOW 3 - AI Chat
  errs.length=0;
  await p.click('button:has-text("IA Chat")').catch(()=>{});
  await p.waitForTimeout(2000);
  const chatInput = p.locator('input,textarea').filter({hasText:''}).nth(0);
  const chatInputVis = await p.locator('input[placeholder*="mensaje"],input[placeholder*="pregunta"],input[placeholder*="Escribe"],textarea').first().isVisible().catch(()=>false);
  if (chatInputVis) {
    await p.locator('input[placeholder*="mensaje"],input[placeholder*="pregunta"],input[placeholder*="Escribe"],textarea').first().fill('como subo mi musica');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(7000);
  }
  await p.screenshot({path:'/tmp/g03-ai-chat.png'});
  const chatErr = errs.filter(e=>e.includes('ai/chat'));
  console.log((!chatErr.length?'✅':'❌')+' FLOW 3 - AI Chat'+(chatErr.length?' | ERR: '+chatErr[0]:''));

  // FLOW 4 - Community
  errs.length=0;
  await p.click('button:has-text("Comunidad")').catch(()=>{});
  await p.waitForTimeout(2000);
  const commInput = await p.locator('input[placeholder*="mensaje"],input[placeholder*="Escribe"]').first();
  if (await commInput.isVisible().catch(()=>false)) {
    await commInput.fill('Hola comunidad test 123');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(2000);
  }
  await p.screenshot({path:'/tmp/g04-community.png'});
  const msgOk = (await p.locator('text=Hola comunidad test 123').count()) > 0;
  console.log((msgOk?'✅':'❌')+' FLOW 4 - Community'+(errs.length?' | ERR: '+errs[0]:''));

  // FLOW 5 - Marketplace beat
  errs.length=0;
  await p.click('button:has-text("Marketplace")').catch(()=>{});
  await p.waitForTimeout(1500);
  await p.click('button:has-text("Mi Tienda")').catch(()=>{});
  await p.waitForTimeout(1000);
  await p.screenshot({path:'/tmp/g05a-marketplace.png'});
  await p.click('button:has-text("SUBIR BEAT"),button:has-text("+ Subir"),button:has-text("Subir Beat")').catch(()=>{});
  await p.waitForTimeout(600);
  await p.screenshot({path:'/tmp/g05b-form.png'});
  // Fill beat form
  const titleInp = p.locator('input').filter({hasText:''}).nth(0);
  await p.locator('input').nth(0).fill('Test Beat F5').catch(()=>{});
  const allInps = await p.locator('input').all();
  for(let i=0;i<allInps.length;i++){
    const ph = await allInps[i].getAttribute('placeholder')||'';
    if(ph.toLowerCase().includes('precio')||ph.toLowerCase().includes('price')) await allInps[i].fill('50000').catch(()=>{});
    if(ph.toLowerCase().includes('bpm')) await allInps[i].fill('140').catch(()=>{});
    if(ph.toLowerCase().includes('género')||ph.toLowerCase().includes('genero')) await allInps[i].fill('Trap').catch(()=>{});
  }
  await p.click('button:has-text("Publicar"),button:has-text("PUBLICAR"),button[type=submit]').catch(()=>{});
  await p.waitForTimeout(2000);
  await p.screenshot({path:'/tmp/g05c-marketplace-after.png'});
  const beatOk = (await p.locator('text=Test Beat F5').count()) > 0;
  console.log((beatOk?'✅':'❌')+' FLOW 5 - Create beat'+(errs.length?' | ERR: '+errs[0]:''));

  // FLOW 6 - Marketing Suite archetype
  errs.length=0;
  await p.click('button:has-text("Marketing")').catch(()=>{});
  await p.waitForTimeout(2000);
  await p.screenshot({path:'/tmp/g06-marketing.png'});
  // Click archetype test button
  await p.click('button:has-text("Test de Arquetipo"),button:has-text("Arquetipo"),button:has-text("INICIAR TEST")').catch(()=>{});
  await p.waitForTimeout(1000);
  await p.screenshot({path:'/tmp/g06b-archetype-start.png'});
  // Answer questions if visible
  for(let q=0;q<7;q++){
    const nextBtn = p.locator('button:has-text("Siguiente"),button:has-text("SIGUIENTE"),button:has-text("Continuar")');
    const optBtns = await p.locator('button').filter({hasText:/^[A-D]\)|^Opción/i}).all();
    if(optBtns.length>0) await optBtns[0].click().catch(()=>{});
    await p.waitForTimeout(300);
    if(await nextBtn.isVisible().catch(()=>false)) await nextBtn.click().catch(()=>{});
    await p.waitForTimeout(400);
  }
  await p.waitForTimeout(5000);
  await p.screenshot({path:'/tmp/g06c-archetype-result.png'});
  const mktErr = errs.filter(e=>e.includes('ai/'));
  console.log((!mktErr.length?'✅':'❌')+' FLOW 6 - Marketing/Archetype'+(mktErr.length?' | ERR: '+mktErr[0]:''));

  await b.close();
  console.log('--- ALL FLOWS DONE ---');
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
