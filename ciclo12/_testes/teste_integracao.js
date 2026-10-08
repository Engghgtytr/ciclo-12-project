// Teste de integração do Ciclo 12 (todas as páginas) com Playwright + Edge.
// Uso: "python -m http.server 8766" na pasta ciclo12; depois: node teste_integracao.js
const { chromium } = require('playwright');
const BASE = 'http://localhost:8766/';
const PAGINAS = [
  ['Hub', 'index.html', 'Ciclo 12'],
  ['Sobre', 'sobre.html', 'Ciclo 12'],
  ['Site', 'site/', 'Ciclo Consumo'],
  ['Chatbot', 'chatbot/', 'Ciclo Bot'],
  ['App', 'app/', 'Ciclo Ponto'],
  ['Plataforma', 'plataforma/?modo=demo', 'Ciclo Prato'],
];
const res = [];
const ok = (nome, cond, extra = '') => res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]);

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const internos = new Set(), externos = new Set();

  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
    for (const [nome, caminho, marca] of PAGINAS) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: cs, reducedMotion: 'reduce', locale: 'pt-BR' });
      const p = await ctx.newPage(); const erros = [];
      p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
      p.on('pageerror', e => erros.push('pageerror: ' + e.message));
      await p.route(/tile\.openstreetmap\.org/, r => r.abort()); // mapas de ruas: fora do teste
      const r = await p.goto(BASE + caminho, { waitUntil: 'networkidle' });
      const tag = `[${nome} ${w}-${cs}]`;
      const info = await p.evaluate(() => ({
        rolagem: document.documentElement.scrollWidth > window.innerWidth,
        semAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length,
        semLabel: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).length,
        css: [...document.querySelectorAll('link[rel=stylesheet]')].some(l => /shared\/estilo\.css$/.test(l.href)),
        favicon: [...document.querySelectorAll('link[rel=icon]')].some(l => /shared\/favicon\.svg$/.test(l.href)),
        logo: !!document.querySelector('.marca img[src$="logo.svg"]'),
        marca: (document.querySelector('.marca span') || {}).textContent || '',
        rodape: document.querySelectorAll('.rodape-modulos a').length,
        titulo: document.title,
        travessao: /[—–]/.test(document.body.innerText),
        links: [...document.querySelectorAll('a[href]')].map(a => a.href)
      }));
      if (w === 390 && cs === 'light') {
        info.links.forEach(h => {
          const u = new URL(h);
          if (u.origin === new URL(BASE).origin) { u.hash = ''; internos.add(u.href); } else if (/^https?:/.test(u.protocol)) { externos.add(u.href); }
        });
      }
      const problemas = [];
      if (r.status() !== 200) problemas.push('HTTP ' + r.status());
      if (info.rolagem) problemas.push('rolagem horizontal');
      if (info.semAlt) problemas.push(info.semAlt + ' imagem(ns) sem alt');
      if (info.semLabel) problemas.push(info.semLabel + ' campo(s) sem rótulo');
      if (!info.css) problemas.push('sem shared/estilo.css');
      if (!info.favicon) problemas.push('sem favicon');
      if (!info.logo) problemas.push('sem logo');
      if (info.marca.trim() !== marca) problemas.push('marca "' + info.marca + '"');
      if (info.rodape !== 6) problemas.push('rodapé com ' + info.rodape + ' links');
      if (info.travessao) problemas.push('travessão no texto');
      const errosReais = erros.filter(e => !/ERR_FAILED|tile/i.test(e));
      if (errosReais.length) problemas.push('console: ' + errosReais.join(' | ').slice(0, 150));
      ok(`${tag} rótulos, alt, estilo, logo, favicon, nome, rodapé, console, sem rolagem`, problemas.length === 0, problemas.join('; '));
      await ctx.close();
    }
  }

  // Ações principais (rápido; os testes de cada módulo são mais completos)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.click('.navegacao a[data-aba=mapa]');
    await p.waitForFunction(() => document.querySelectorAll('.leaflet-marker-icon').length > 20, null, { timeout: 15000 }).catch(() => {});
    ok('Hub: mapa abre com marcadores', (await p.locator('.leaflet-marker-icon').count()) >= 25);
    for (const [href, h1] of [['app/', 'Onde levar'], ['plataforma/', 'Comida boa'], ['chatbot/', 'Onde eu descarto'], ['site/', 'banho da sua casa']]) {
      await p.goto(BASE, { waitUntil: 'networkidle' });
      await p.click(`a.modulo-pronto[href="${href}"]`); await p.waitForLoadState('networkidle');
      ok(`Hub → ${href} abre o módulo`, (await p.textContent('h1')).includes(h1));
    }
    await p.goto(BASE + 'chatbot/', { waitUntil: 'networkidle' });
    await p.fill('#pergunta', 'onde jogo pilha'); await p.press('#pergunta', 'Enter'); await p.waitForTimeout(700);
    ok('Chatbot responde', /NÃO recebem pilhas/.test(await p.textContent('#conversa')));
    await p.goto(BASE + 'site/', { waitUntil: 'networkidle' }); await p.fill('#c-preco', '1');
    ok('Site calcula (R$ 90,00 no exemplo padrão)', /90,00/.test(await p.textContent('#o-custo')));
    await p.goto(BASE + 'app/#doar', { waitUntil: 'networkidle' });
    ok('App abre na aba Doar pelo endereço', await p.locator('#form-item').isVisible());
    await p.goto(BASE + 'plataforma/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    ok('Plataforma conecta ao Supabase real', /Conectado ao banco de dados/.test(await p.textContent('#modo-info')));
    await ctx.close();
  }

  // Links internos
  const ctxL = await b.newContext();
  const quebradosInt = [];
  for (const u of internos) { const r = await ctxL.request.get(u); if (r.status() !== 200) quebradosInt.push(r.status() + ' ' + u); }
  ok(`links internos (${internos.size}) sem quebra`, quebradosInt.length === 0, quebradosInt.join(' | '));
  // Links externos (abre como navegador; alguns sites bloqueiam robôs)
  const quebradosExt = [];
  const pExt = await ctxL.newPage();
  for (const u of externos) {
    let st = '?';
    try { const r = await pExt.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }); st = r ? r.status() : 'sem resposta'; } catch (e) {
      st = /download/i.test(e.message) ? 'download (PDF)' : 'erro: ' + e.message.split('\n')[0].slice(0, 60);
    }
    if (!(typeof st === 'number' && st < 400) && st !== 'download (PDF)') quebradosExt.push(st + ' ' + u);
  }
  ok(`links externos (${externos.size}) abrem`, quebradosExt.length === 0, quebradosExt.join(' | '));
  await ctxL.close();
  await b.close();

  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
