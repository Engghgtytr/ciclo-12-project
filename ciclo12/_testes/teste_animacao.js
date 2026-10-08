// Teste da animação de entrada e ao rolar (hub e site), Playwright + Edge.
// Uso: "python -m http.server 8766" na pasta ciclo12; depois: node teste_animacao.js
const { chromium } = require('playwright');
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };
const op = (p, sel) => p.$eval(sel, e => Number(getComputedStyle(e).opacity));

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  async function abrir(url, opts = {}) {
    const ctx = await b.newContext({ viewport: { width: opts.w || 390, height: 844 }, reducedMotion: opts.reduzir ? 'reduce' : 'no-preference', javaScriptEnabled: opts.semJs ? false : true });
    const p = await ctx.newPage(); const erros = [];
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    await p.route(/tile\.openstreetmap\.org/, r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' });
    return { ctx, p, erros };
  }

  for (const [nome, url, fundo] of [['site', 'http://localhost:8766/site/', '.dica:last-child'], ['hub', 'http://localhost:8766/', '.modulos > li:last-child']]) {
    // animação normal
    {
      const { ctx, p, erros } = await abrir(url);
      ok(`[${nome}] <html> recebe "anim-js"`, await p.evaluate(() => document.documentElement.classList.contains('anim-js')));
      const anim = await p.$eval('.anim-entrada > *', e => getComputedStyle(e).animationName);
      ok(`[${nome}] título de entrada usa a animação "ciclo-entrar"`, anim === 'ciclo-entrar', anim);
      ok(`[${nome}] logo usa a animação "ciclo-girar"`, (await p.$eval('.marca img', e => getComputedStyle(e).animationName)) === 'ciclo-girar');
      await p.waitForTimeout(1500);
      ok(`[${nome}] depois de 1,5 s o título está visível (opacidade 1)`, (await op(p, '.anim-entrada h1')) === 1);
      ok(`[${nome}] item do fim da página começa escondido (opacidade 0)`, (await op(p, fundo)) === 0);
      await p.locator(fundo).scrollIntoViewIfNeeded();
      await p.waitForTimeout(1200);
      ok(`[${nome}] ao rolar até ele, aparece (classe "visivel", opacidade 1)`, (await p.$eval(fundo, e => e.classList.contains('visivel'))) && (await op(p, fundo)) === 1);
      ok(`[${nome}] sem erros de console`, erros.filter(e => !/ERR_FAILED/.test(e)).length === 0, erros.join(' | '));
      await ctx.close();
    }
    // reduzir movimento
    {
      const { ctx, p } = await abrir(url, { reduzir: true });
      ok(`[${nome}] "reduzir movimento": sem "anim-js" e item do fim já visível`, !(await p.evaluate(() => document.documentElement.classList.contains('anim-js'))) && (await op(p, fundo)) === 1);
      await ctx.close();
    }
    // sem JavaScript
    {
      const { ctx, p } = await abrir(url, { semJs: true });
      ok(`[${nome}] sem JavaScript: conteúdo visível`, (await op(p, fundo)) === 1 && (await op(p, '.anim-entrada h1')) === 1);
      await ctx.close();
    }
  }
  // hub: aba Problemas revela os artigos ao rolar
  {
    const { ctx, p } = await abrir('http://localhost:8766/', { w: 1280 });
    await p.click('.navegacao a[data-aba=problemas]');
    await p.locator('#p-roupas').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
    ok('[hub] aba Problemas: último artigo aparece ao rolar', (await op(p, '#p-roupas')) === 1);
    await p.click('.navegacao a[data-aba=mapa]'); await p.waitForTimeout(1200);
    ok('[hub] mapa não é animado (sem classe "revelar")', (await p.$$('#mapa .revelar')).length === 0);
    await ctx.close();
  }
  await b.close();
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
