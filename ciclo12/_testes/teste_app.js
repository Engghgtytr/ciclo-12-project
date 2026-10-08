// Teste do app Ciclo Ponto (PWA) com Playwright + Microsoft Edge.
// Uso: "python -m http.server 8766" na pasta ciclo12; numa pasta com playwright e foto-teste.png: node teste_app.js
const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('prints5', { recursive: true });
const BASE = 'http://localhost:8766/';
const URL = BASE + 'app/';
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  async function contexto(opts = {}) {
    const ctx = await b.newContext({
      viewport: { width: opts.w || 390, height: 844 }, colorScheme: opts.cs || 'light', locale: 'pt-BR', acceptDownloads: true,
      ...(opts.geo ? { geolocation: opts.geo } : {}), ...(opts.perms ? { permissions: opts.perms } : {})
    });
    if (opts.init) await ctx.addInitScript(opts.init);
    const p = await ctx.newPage(); const erros = [];
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    if (opts.semRuas !== false) await p.route(/tile\.openstreetmap\.org/, r => r.abort());
    return { ctx, p, erros };
  }
  const realErros = e => e.filter(x => !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|tile/i.test(x));
  async function salvarItem(p, dados) {
    await p.click('.nav-inferior a[data-aba=doar]');
    if (dados.foto) { await p.setInputFiles('#foto', dados.foto); await p.waitForSelector('#previa-caixa img'); }
    await p.fill('#i-nome', dados.nome);
    await p.selectOption('#i-categoria', dados.categoria);
    await p.selectOption('#i-tipo', dados.tipo);
    await p.check(`input[name=acao][value=${dados.acao}]`);
    await p.click('#form-item button[type=submit]');
    await p.waitForSelector('#resultado-item .sugestao, #resultado-item .aviso', { timeout: 5000 });
    return (await p.textContent('#resultado-item')).replace(/\s+/g, ' ');
  }

  // 1. Manifesto e ícones
  {
    const { ctx, p } = await contexto();
    await p.goto(URL, { waitUntil: 'networkidle' });
    const href = await p.getAttribute('link[rel=manifest]', 'href');
    const r = await p.request.get(new globalThis.URL(href, URL).href);
    const m = await r.json();
    const start = new globalThis.URL(m.start_url, new globalThis.URL(href, URL)).href;
    ok('manifesto: nome, short_name, display standalone, theme_color', !!m.name && !!m.short_name && m.display === 'standalone' && !!m.theme_color);
    ok('manifesto: start_url relativo aponta para /app/', start === URL, start);
    const tamanhos = [];
    for (const ic of m.icons) {
      const ri = await p.request.get(new globalThis.URL(ic.src, new globalThis.URL(href, URL)).href);
      const buf = await ri.body();
      tamanhos.push(`${ic.sizes}=${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}(${ri.status()})`);
    }
    ok('ícones 192 e 512 existem e têm o tamanho certo (PNG)', tamanhos.every(t => { const [d, real] = t.split('='); return real.startsWith(d) && real.endsWith('(200)'); }) && m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'), tamanhos.join(' '));
    ok('ícone "maskable" para Android', m.icons.some(i => i.purpose === 'maskable'));
    await ctx.close();
  }

  // 2. Layout, abas, modos claro/escuro
  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'light']]) {
    const { ctx, p, erros } = await contexto({ w, cs });
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.querySelector('.leaflet-marker-icon') || /não carregou/.test(document.getElementById('mapa-app').textContent), null, { timeout: 15000 });
    ok(`[${w}-${cs}] navegação inferior com 4 abas`, (await p.locator('.nav-inferior a').count()) === 4);
    ok(`[${w}-${cs}] Pontos: 33 Ecopontos na lista`, (await p.locator('#lista-pontos .ponto-item').count()) === 33);
    ok(`[${w}-${cs}] 2 cartões de contexto com fonte`, (await p.locator('.contexto-cartao .fonte a').count()) === 2);
    for (const aba of ['doar', 'itens', 'avisos', 'pontos']) {
      await p.click(`.nav-inferior a[data-aba=${aba}]`);
      if (!(await p.locator('#' + aba).isVisible())) ok(`[${w}-${cs}] aba ${aba} abre`, false);
      if (!(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))) ok(`[${w}-${cs}] sem rolagem horizontal na aba ${aba}`, false);
    }
    ok(`[${w}-${cs}] as 4 abas abrem, sem rolagem horizontal`, true);
    ok(`[${w}-${cs}] sem erros de console`, realErros(erros).length === 0, realErros(erros).join(' | '));
    await p.click('.nav-inferior a[data-aba=pontos]');
    await p.screenshot({ path: `prints5/app-pontos-${w}-${cs}.png` });
    await ctx.close();
  }

  // 3. GPS falso perto do Pimentas / permissão negada / doação
  {
    const { ctx, p } = await contexto({ geo: { latitude: -23.43701, longitude: -46.40845 }, perms: ['geolocation'] });
    await p.goto(URL, { waitUntil: 'networkidle' });
    const antes = await p.locator('#lista-pontos .nome').first().textContent();
    await p.click('#btn-perto'); await p.waitForTimeout(1200);
    const depois = await p.locator('#lista-pontos .nome').first().textContent();
    const km = await p.locator('#lista-pontos .km').first().textContent();
    ok('"Perto de mim" com GPS falso no Pimentas: a ordem muda (1º Pimentas)', antes === 'Timóteo Penteado' && depois === 'Pimentas', `${antes} -> ${depois}`);
    ok('distância aparece como "a X km"', /^a (≈ )?\d+,\d km$/.test(km), km);
    await p.selectOption('#filtro-tipo', 'doacao');
    ok('"Locais de doação": 3 modelos com etiqueta EXEMPLO', (await p.locator('#lista-pontos .etiqueta-exemplo').count()) === 3);
    await ctx.close();
  }
  {
    const { ctx, p } = await contexto();
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.click('#btn-perto'); await p.waitForTimeout(1500);
    const t = await p.textContent('#msg-perto');
    ok('localização negada: mensagem clara e lista continua (33)', /não permitiu|Não foi possível/.test(t) && (await p.locator('#lista-pontos .ponto-item').count()) === 33, t);
    await ctx.close();
  }

  // 4. Doar/descartar: foto (simulando a câmera), checklist, sugestão; Meus itens: persistência
  {
    const { ctx, p, erros } = await contexto();
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.click('.nav-inferior a[data-aba=doar]');
    ok('campo de foto usa a câmera traseira (capture=environment, accept=image/*)', (await p.getAttribute('#foto', 'capture')) === 'environment' && (await p.getAttribute('#foto', 'accept')) === 'image/*');
    ok('checklist de segurança para eletrônico ("Apaguei meus dados")', /Apaguei meus dados/.test(await p.textContent('#checklist')));
    await p.selectOption('#i-categoria', 'roupa');
    ok('checklist muda para roupa ("Lavei a peça")', /Lavei a peça/.test(await p.textContent('#checklist')));
    await p.click('#form-item button[type=submit]');
    ok('salvar sem nome: mensagem de erro', await p.locator('#e-nome').isVisible());
    await p.setInputFiles('#foto', 'foto-teste.png');
    await p.waitForSelector('#previa-caixa img');
    const dim = [await p.getAttribute('#previa-caixa img', 'data-largura'), await p.getAttribute('#previa-caixa img', 'data-altura')];
    ok('foto de 2000×1500 aparece na prévia e é reduzida para 800×600', dim[0] === '800' && dim[1] === '600', dim.join('x'));
    await p.setInputFiles('#foto', []);
    const r1 = await salvarItem(p, { nome: 'Geladeira velha', categoria: 'eletronico', tipo: 'eletrodomestico', acao: 'descartar', foto: 'foto-teste.png' });
    ok('eletrodoméstico + descartar: sugere o Ecoponto confirmado mais perto (Timóteo Penteado)', /Timóteo Penteado/.test(r1) && /Confirmado na fonte/.test(r1), r1.slice(0, 120));
    const r2 = await salvarItem(p, { nome: 'Jaqueta jeans', categoria: 'roupa', tipo: 'roupa', acao: 'doar' });
    ok('roupa + doar: "Confirme antes de ir" (sem ponto confirmado)', /Confirme antes de ir/.test(r2) && !/Timóteo/.test(r2), r2.slice(0, 120));
    const r3 = await salvarItem(p, { nome: 'Pilhas do controle', categoria: 'eletronico', tipo: 'pilha', acao: 'descartar' });
    ok('pilha + descartar: avisa que os Ecopontos NÃO recebem', /NÃO recebem pilhas/.test(r3) && !/Timóteo/.test(r3));
    const r4 = await salvarItem(p, { nome: 'Celular antigo', categoria: 'eletronico', tipo: 'pequeno', acao: 'descartar' });
    ok('celular + descartar: não indica Ecoponto como certo', /não confirma/.test(r4) && !/Timóteo/.test(r4));
    await p.click('.nav-inferior a[data-aba=itens]'); await p.waitForTimeout(500);
    ok('Meus itens: 4 itens, 1 com foto', (await p.locator('.item-salvo').count()) === 4 && (await p.locator('.item-salvo img.miniatura').count()) === 1);
    await p.reload({ waitUntil: 'networkidle' }); await p.click('.nav-inferior a[data-aba=itens]'); await p.waitForTimeout(500);
    ok('depois de recarregar a página, os 4 itens continuam (IndexedDB)', (await p.locator('.item-salvo').count()) === 4 && (await p.locator('.item-salvo img.miniatura').count()) === 1);
    ok('modo de armazenamento: IndexedDB', !/reserva/.test(await p.textContent('#modo-armazenamento')));
    const primeiro = p.locator('.item-salvo').filter({ hasText: 'Celular antigo' });
    await primeiro.locator('select').selectOption('entregue'); await p.waitForTimeout(300);
    await p.reload({ waitUntil: 'networkidle' }); await p.click('.nav-inferior a[data-aba=itens]'); await p.waitForTimeout(500);
    ok('mudar situação para "Entregue" fica salvo', (await p.locator('.item-salvo').filter({ hasText: 'Celular antigo' }).locator('select').inputValue()) === 'entregue');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btn-exportar')]);
    const caminho = await dl.path(); const json = JSON.parse(fs.readFileSync(caminho, 'utf8'));
    ok('"Exportar meus dados" baixa um JSON com os 4 itens (foto em texto)', json.itens.length === 4 && json.itens.some(i => /^data:image\/jpeg/.test(i.foto || '')), dl.suggestedFilename());
    const ap = p.locator('.item-salvo').filter({ hasText: 'Pilhas do controle' }).locator('button');
    await ap.click(); await ap.click(); await p.waitForTimeout(400);
    ok('apagar um item (com confirmação em 2 cliques)', (await p.locator('.item-salvo').count()) === 3);
    await p.screenshot({ path: 'prints5/app-meus-itens-390.png', fullPage: true });
    await p.click('#btn-limpar'); await p.click('#btn-limpar'); await p.waitForTimeout(400);
    ok('"Apagar todos" (2 cliques) deixa a lista vazia com convite', (await p.locator('.item-salvo').count()) === 0 && (await p.locator('#lista-itens .vazio').count()) === 1);
    ok('sem erros de console', realErros(erros).length === 0, realErros(erros).join(' | '));
    await ctx.close();
  }

  // 5. Reserva: IndexedDB indisponível → localStorage
  {
    const { ctx, p, erros } = await contexto({ init: () => { Object.defineProperty(window, 'indexedDB', { get() { throw new Error('sem IndexedDB'); } }); } });
    await p.goto(URL, { waitUntil: 'networkidle' });
    await salvarItem(p, { nome: 'Sofá', categoria: 'objeto', tipo: 'movel', acao: 'descartar', foto: 'foto-teste.png' });
    await p.reload({ waitUntil: 'networkidle' }); await p.click('.nav-inferior a[data-aba=itens]'); await p.waitForTimeout(500);
    ok('sem IndexedDB: salva no localStorage, com foto, e continua depois de recarregar', (await p.locator('.item-salvo').count()) === 1 && (await p.locator('.item-salvo img.miniatura').count()) === 1 && /reserva/.test(await p.textContent('#modo-armazenamento')));
    ok('sem IndexedDB: nenhum erro de JavaScript', !erros.some(e => /pageerror/.test(e)), erros.join(' | '));
    await ctx.close();
  }
  // 6. Sem armazenamento nenhum: avisa e não quebra
  {
    const { ctx, p, erros } = await contexto({ init: () => {
      Object.defineProperty(window, 'indexedDB', { get() { throw new Error('x'); } });
      Storage.prototype.setItem = function () { const e = new Error('cheio'); e.name = 'QuotaExceededError'; throw e; };
    } });
    await p.goto(URL, { waitUntil: 'networkidle' });
    const r = await salvarItem(p, { nome: 'Teste', categoria: 'objeto', tipo: 'outro', acao: 'doar' });
    ok('armazenamento cheio: mensagem "Sem espaço" e nada quebra', /Sem espaço/.test(r) && !erros.some(e => /pageerror/.test(e)), r.slice(0, 80));
    await ctx.close();
  }

  // 7. Lembretes (relógio do navegador adiantado)
  {
    const { ctx, p, erros } = await contexto({ perms: ['notifications'] });
    await p.clock.install({ time: new Date() });
    await p.goto(URL + '#avisos', { waitUntil: 'networkidle' });
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload({ waitUntil: 'networkidle' });
    ok('com permissão: "Lembretes ativados" e botão "Ativar" escondido', /Lembretes ativados/.test(await p.textContent('#suporte-avisos')) && !(await p.locator('#btn-ativar').isVisible()));
    const passado = await p.evaluate(() => { const d = new Date(Date.now() - 3600e3); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); });
    await p.fill('#l-quando', passado); await p.click('#form-lembrete button[type=submit]');
    ok('horário no passado: mensagem de erro', /futuro/.test(await p.textContent('#e-quando')));
    const futuro = await p.evaluate(() => { const d = new Date(Date.now() + 2 * 60e3); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); });
    await p.fill('#l-texto', 'Levar a geladeira ao Ecoponto');
    await p.fill('#l-quando', futuro); await p.click('#form-lembrete button[type=submit]');
    ok('lembrete agendado aparece na lista', /Agendado para/.test(await p.textContent('#lista-lembretes')));
    await p.clock.fastForward('03:00');
    await p.waitForTimeout(500);
    ok('na hora: aviso "Lembrete" aparece dentro do app', /Levar a geladeira ao Ecoponto/.test(await p.textContent('#conteudo .aviso-ok').catch(() => '')));
    ok('na hora: lembrete marcado como "Mostrado"', /Mostrado em/.test(await p.textContent('#lista-lembretes')));
    const n = await p.evaluate(() => navigator.serviceWorker.ready.then(r => r.getNotifications()).then(l => l.map(x => x.title + ': ' + x.body)).catch(e => 'erro: ' + e.message));
    ok('na hora: notificação do sistema criada pelo service worker', Array.isArray(n) && n.some(x => /Levar a geladeira/.test(x)), JSON.stringify(n));
    ok('sem erros de console', realErros(erros).length === 0, realErros(erros).join(' | '));
    await p.screenshot({ path: 'prints5/app-avisos-390.png', fullPage: true });
    await ctx.close();
  }
  {
    const { ctx, p } = await contexto();
    await p.goto(URL + '#avisos', { waitUntil: 'networkidle' });
    ok('sem permissão ainda: "Lembretes desativados" e botão "Ativar lembretes" visível', /desativados/.test(await p.textContent('#suporte-avisos')) && (await p.locator('#btn-ativar').isVisible()));
    await ctx.close();
  }
  {
    const { ctx, p } = await contexto({ perms: [] });  // Playwright: lista vazia = notificações bloqueadas
    await p.goto(URL + '#avisos', { waitUntil: 'networkidle' });
    ok('notificações bloqueadas: explica como reativar e esconde o botão', /bloqueadas/.test(await p.textContent('#suporte-avisos')) && !(await p.locator('#btn-ativar').isVisible()));
    await ctx.close();
  }
  {
    const { ctx, p } = await contexto({ init: () => { delete window.Notification; } });
    await p.goto(URL + '#avisos', { waitUntil: 'networkidle' });
    ok('navegador sem notificações: avisa e esconde o botão', /Sem notificações/.test(await p.textContent('#suporte-avisos')) && !(await p.locator('#btn-ativar').isVisible()));
    await ctx.close();
  }

  // 8. Offline depois do primeiro carregamento
  {
    const { ctx, p, erros } = await contexto();
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload({ waitUntil: 'networkidle' });
    const controlado = await p.evaluate(() => !!navigator.serviceWorker.controller);
    await p.waitForTimeout(1500);
    await ctx.setOffline(true);
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(1000);
    ok('service worker controla a página', controlado);
    ok('offline: o app abre pela cópia guardada e mostra os 33 Ecopontos', (await p.locator('#lista-pontos .ponto-item').count()) === 33);
    ok('offline: faixa "Sem internet" aparece', await p.locator('#faixa-offline').isVisible());
    await p.click('.nav-inferior a[data-aba=doar]');
    ok('offline: a aba Doar funciona', await p.locator('#form-item').isVisible());
    await p.screenshot({ path: 'prints5/app-offline-390.png' });
    await ctx.close();
  }

  // 9. Links e acessibilidade
  {
    const { ctx, p } = await contexto();
    await p.goto(URL, { waitUntil: 'networkidle' });
    ok('links para o Ciclo Bot e o hub', (await p.getAttribute('.navegacao a[href="../chatbot/"]', 'href')) === '../chatbot/' && (await p.locator('.navegacao a[href="../index.html"]').count()) === 1);
    const semLabel = await p.$$eval('input:not([type=radio]):not([type=checkbox]), select', els => els.filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).length);
    ok('todos os campos têm rótulo', semLabel === 0, String(semLabel));
    ok('nenhum travessão no texto visível', !/[—–]/.test(await p.evaluate(() => document.body.innerText)));
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.click('a.modulo-pronto[href="app/"]'); await p.waitForLoadState('networkidle');
    ok('no hub, o cartão "Ciclo Ponto" abre o app', /Onde levar/.test(await p.textContent('h1')));
    await ctx.close();
  }

  await b.close();
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
