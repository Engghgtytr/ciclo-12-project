// Teste do hub com Playwright + Microsoft Edge. Uso: rode "python -m http.server 8766" na pasta ciclo12,
// depois, numa pasta com o pacote playwright instalado (npm i playwright): node teste_hub.js
const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'http://localhost:8766/';
fs.mkdirSync('prints1', { recursive: true });
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  async function pagina(opts) {
    const ctx = await b.newContext({
      viewport: { width: opts.w, height: 900 }, colorScheme: opts.cs, locale: 'pt-BR',
      ...(opts.geo ? { geolocation: opts.geo, permissions: ['geolocation'] } : {})
    });
    const p = await ctx.newPage(); const erros = [];
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    if (opts.bloquearRuas) await p.route(/tile\.openstreetmap\.org/, r => r.abort());
    if (opts.bloquearLeaflet) await p.route(/cdnjs\.cloudflare\.com/, r => r.abort());
    return { ctx, p, erros };
  }
  const semRolagem = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
    const tag = `${w}-${cs}`;
    const { ctx, p, erros } = await pagina({ w, cs, bloquearRuas: true });
    await p.goto(URL, { waitUntil: 'networkidle' });
    ok(`[${tag}] início: 3 ecopontos perto da escola`, await p.locator('#perto-lista li').count() === 3);
    ok(`[${tag}] início sem rolagem horizontal`, await semRolagem(p));
    await p.screenshot({ path: `prints1/inicio-${tag}.png`, fullPage: true });
    await p.click('.navegacao a[data-aba=problemas]');
    ok(`[${tag}] problemas: 5 artigos e 5 gráficos SVG`, (await p.locator('#problemas article').count()) === 5 && (await p.locator('#problemas svg').count()) === 5);
    ok(`[${tag}] problemas sem rolagem horizontal`, await semRolagem(p));
    await p.screenshot({ path: `prints1/problemas-${tag}.png`, fullPage: true });
    await p.click('.navegacao a[data-aba=mapa]');
    await p.waitForFunction(() => document.querySelector('.leaflet-marker-icon') || /não carregou/.test(document.getElementById('mapa-area').textContent), null, { timeout: 15000 }); await p.waitForTimeout(300);
    const n = await p.locator('#lista-pontos > li').count();
    const marc = await p.locator('.leaflet-marker-icon .pino').count();
    const escola = await p.locator('.leaflet-marker-icon .pino-escola-marcador').count();
    ok(`[${tag}] mapa: 33 PEVs na lista`, n === 33, `lista=${n}`);
    ok(`[${tag}] mapa: 24 PEVs no mapa + 1 escola`, marc === 24 && escola === 1, `pevs=${marc} escola=${escola}`);
    ok(`[${tag}] aviso "ruas não carregaram" com tiles bloqueados`, await p.locator('#mapa-aviso').isVisible().catch(() => false));
    ok(`[${tag}] 2 PEVs de Vila Galvão destacados`, await p.locator('.item-ponto.vizinho').count() === 2);
    ok(`[${tag}] mapa sem rolagem horizontal`, await semRolagem(p));
    await p.screenshot({ path: `prints1/mapa-${tag}.png`, fullPage: true });
    const errosReais = erros.filter(e => !/ERR_FAILED|tile/i.test(e));
    ok(`[${tag}] sem erros de console (fora os tiles bloqueados de propósito)`, errosReais.length === 0, errosReais.join(' | ').slice(0, 300));
    await ctx.close();
  }

  // ordem por distância, filtro, popup (1280 claro, tiles liberados)
  {
    const { ctx, p, erros } = await pagina({ w: 1280, cs: 'light' });
    await p.goto(URL + '#mapa', { waitUntil: 'networkidle' }); await p.waitForFunction(() => document.querySelector('.leaflet-marker-icon') || /não carregou/.test(document.getElementById('mapa-area').textContent), null, { timeout: 15000 }); await p.waitForTimeout(2000);
    const kms = await p.$$eval('#lista-pontos .km', els => els.map(e => e.textContent));
    const nums = kms.filter(t => /km/.test(t)).map(t => parseFloat(t.replace('≈', '').replace(',', '.')));
    ok('ordenado do mais perto ao mais longe (a partir da escola)', nums.every((v, i) => i === 0 || v >= nums[i - 1]), kms.slice(0, 4).join(' / '));
    const primeiros = await p.$$eval('#lista-pontos .nome', els => els.slice(0, 3).map(e => e.textContent));
    ok('mais perto da escola = Timóteo Penteado', primeiros[0] === 'Timóteo Penteado', primeiros.join(', '));
    ok('os 9 sem posição ficam no fim da lista', kms.slice(-9).every(t => t === 'sem posição'));
    ok('ruas do mapa carregaram com internet', (await p.locator('.leaflet-tile-loaded').count()) > 0 && !(await p.locator('#mapa-aviso').count()));
    await p.selectOption('#filtro-material', 'pilha');
    ok('filtro "Pilhas e baterias": 0 ecopontos + aviso "Não leve"', (await p.locator('#lista-pontos .item-ponto').count()) === 0 && /Não leve/.test(await p.textContent('#resposta-filtro')));
    await p.selectOption('#filtro-material', 'celular');
    ok('filtro "Celular": 33 ecopontos + aviso "A confirmar"', (await p.locator('#lista-pontos .item-ponto').count()) === 33 && /A confirmar/.test(await p.textContent('#resposta-filtro')));
    await p.selectOption('#filtro-material', 'roupa');
    ok('filtro "Roupa": mostra 2 modelos EXEMPLO de doação', (await p.locator('#lista-doacao .item-ponto').count()) === 2 && (await p.locator('#lista-doacao .aviso-exemplo').count()) === 1);
    await p.selectOption('#filtro-material', 'vidro');
    ok('filtro "Vidro": 33 ecopontos + aviso "Recebe"', (await p.locator('#lista-pontos .item-ponto').count()) === 33 && /Recebe/.test(await p.textContent('#resposta-filtro')));
    await p.selectOption('#filtro-material', '');
    await p.locator('#lista-pontos .item-ponto').first().locator('button').click(); await p.waitForTimeout(800);
    const pop = await p.textContent('.leaflet-popup-content').catch(() => '');
    ok('"Ver no mapa" abre popup com horário e "Confirmar"', /Horário/.test(pop) && /Confirmar: Celular, Roupa/.test(pop), pop.slice(0, 120));
    await p.screenshot({ path: 'prints1/mapa-popup-1280.png' });
    ok('sem erros de console (com internet)', erros.length === 0, erros.join(' | ').slice(0, 300));
    await ctx.close();
  }

  // geolocalização falsa perto do PEV Pimentas: a ordem muda
  {
    const { ctx, p } = await pagina({ w: 390, cs: 'light', geo: { latitude: -23.43701, longitude: -46.40845 }, bloquearRuas: true });
    await p.goto(URL + '#mapa', { waitUntil: 'networkidle' }); await p.waitForFunction(() => document.querySelector('.leaflet-marker-icon') || /não carregou/.test(document.getElementById('mapa-area').textContent), null, { timeout: 15000 });
    await p.click('#btn-perto'); await p.waitForTimeout(1200);
    const prim = await p.$$eval('#lista-pontos .nome', els => els.slice(0, 2).map(e => e.textContent));
    ok('"perto de mim" com GPS falso no Pimentas: 1º = Pimentas', prim[0] === 'Pimentas', prim.join(', '));
    ok('referência muda para "você"', /até você/.test(await p.textContent('#lista-referencia')));
    ok('marcador "você está aqui" aparece', (await p.locator('.pino-voce').count()) === 1);
    await ctx.close();
  }
  // permissão de localização negada
  {
    const { ctx, p } = await pagina({ w: 390, cs: 'light', bloquearRuas: true });
    await ctx.clearPermissions();
    await p.goto(URL + '#mapa', { waitUntil: 'networkidle' });
    await p.click('#btn-perto'); await p.waitForTimeout(1500);
    const t = await p.textContent('#lista-referencia');
    ok('localização negada: mensagem clara e lista continua', /não permitiu|Não foi possível/.test(t) && (await p.locator('#lista-pontos .item-ponto').count()) === 33, t);
    await ctx.close();
  }
  // Leaflet bloqueado (CDN fora do ar)
  {
    const { ctx, p, erros } = await pagina({ w: 390, cs: 'light', bloquearLeaflet: true });
    await p.goto(URL + '#mapa', { waitUntil: 'load' }); await p.waitForFunction(() => document.querySelector('.leaflet-marker-icon') || /não carregou/.test(document.getElementById('mapa-area').textContent), null, { timeout: 15000 });
    ok('sem Leaflet: aviso no lugar do mapa e lista com 33', /não carregou/.test(await p.textContent('#mapa-area')) && (await p.locator('#lista-pontos .item-ponto').count()) === 33);
    ok('sem Leaflet: nenhum erro de JavaScript', erros.filter(e => /pageerror/.test(e)).length === 0, erros.join(' | ').slice(0, 200));
    await ctx.close();
  }
  // teclado, alt, labels, travessão
  {
    const { ctx, p } = await pagina({ w: 1280, cs: 'light', bloquearRuas: true });
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.keyboard.press('Tab'); const a = await p.evaluate(() => document.activeElement.className);
    ok('Tab: primeiro foco = "Pular para o conteúdo"', a === 'pular-conteudo', a);
    const semAlt = await p.$$eval('img', im => im.filter(i => !i.hasAttribute('alt')).length);
    const semLabel = await p.$$eval('select,input', els => els.filter(e => !(e.labels && e.labels.length)).length);
    ok('imagens com alt e campos com label', semAlt === 0 && semLabel === 0, `semAlt=${semAlt} semLabel=${semLabel}`);
    let travessao = false;
    for (const aba of ['inicio', 'problemas', 'mapa']) {
      await p.click(`.navegacao a[data-aba=${aba}]`); await p.waitForTimeout(500);
      if (/[—–]/.test(await p.evaluate(() => document.body.innerText))) travessao = aba;
    }
    ok('nenhum travessão no texto visível (3 abas)', !travessao, String(travessao));
    await ctx.close();
  }
  await b.close();
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
