// Teste do site Ciclo Consumo com Playwright + Microsoft Edge.
// Uso: "python -m http.server 8766" na pasta ciclo12; depois: node teste_site.js
const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'http://localhost:8766/site/';
fs.mkdirSync('prints2', { recursive: true });
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  async function pagina(w, cs, init) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: cs, locale: 'pt-BR' });
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage(); const erros = [];
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('dialog', d => { erros.push('ALERTA ABRIU: ' + d.message()); d.dismiss(); });
    await p.goto(URL, { waitUntil: 'networkidle' });
    return { ctx, p, erros };
  }
  const txt = (p, id) => p.textContent('#' + id).then(t => t.trim());
  async function preencher(p, campos) {
    for (const [id, v] of Object.entries(campos)) {
      if (id === 'c-potencia') await p.selectOption('#c-potencia', v); else await p.fill('#' + id, v);
    }
  }

  // 1. Caso do plano: 15 min, 3 pessoas, 4000 W, kWh 1,00
  {
    const { ctx, p, erros } = await pagina(1280, 'light');
    ok('valores iniciais: 3 pessoas, 15 min, 4000 W, vazão 9, preço VAZIO',
      (await p.inputValue('#c-pessoas')) === '3' && (await p.inputValue('#c-minutos')) === '15' &&
      (await p.inputValue('#c-potencia')) === '4000' && (await p.inputValue('#c-vazao')) === '9' && (await p.inputValue('#c-preco')) === '');
    ok('sem preço: custo pede o preço ("R$ ?")', (await txt(p, 'o-custo')) === 'R$ ?', await txt(p, 'o-custo-texto'));
    await preencher(p, { 'c-preco': '1.00' });
    const r = { litros: await txt(p, 'o-litros'), pct: await txt(p, 'o-pct'), kwh: await txt(p, 'o-kwh'), custo: await txt(p, 'o-custo'), eco: await txt(p, 'o-economia') };
    ok('litros/dia = 405 L', r.litros === '405 L', r.litros);
    ok('% da ONU = 122,7%', r.pct === '122,7%', r.pct);
    ok('kWh/mês = 90 kWh', r.kwh === '90 kWh', r.kwh);
    ok('custo/mês = R$ 90,00', r.custo.replace(/\s/g, ' ') === 'R$ 90,00', r.custo);
    ok('economia: 4.050 L, 30 kWh, R$ 30,00', /4\.050 litros/.test(r.eco) && /30 kWh/.test(r.eco) && /R\$\s30,00/.test(r.eco), r.eco);
    const barras = await p.$$eval('#grafico-agua rect', rs => rs.map(x => x.getAttribute('title') || x.textContent));
    ok('gráfico: 3 barras (Brasil 154, ONU 110, banho 135)', barras.length === 3 && /154 L/.test(barras[0]) && /110 L/.test(barras[1]) && /135 L/.test(barras[2]), barras.join(' | '));
    await p.screenshot({ path: 'prints2/calc-caso-plano-1280.png', fullPage: false, clip: { x: 0, y: (await p.locator('#calculadora').boundingBox()).y, width: 1280, height: 900 } });
    // gás/solar
    await preencher(p, { 'c-potencia': '0' });
    ok('chuveiro a gás: custo "Não se aplica" e 0 kWh', (await txt(p, 'o-custo')) === 'Não se aplica' && (await txt(p, 'o-kwh')) === '0 kWh');
    // 5.500 W
    await preencher(p, { 'c-potencia': '5500' });
    ok('5.500 W: kWh = 3 × 0,25 × 5,5 × 30 = 123,75 → "124 kWh"', (await txt(p, 'o-kwh')) === '124 kWh', await txt(p, 'o-kwh'));
    // banho curto
    await preencher(p, { 'c-potencia': '4000', 'c-minutos': '3' });
    ok('banho de 3 min: economia usa o banho inteiro e avisa', /menos de 5 minutos/.test(await txt(p, 'o-economia')) && /2\.430 litros/.test(await txt(p, 'o-economia')), await txt(p, 'o-economia'));
    ok('sem erros de console', erros.length === 0, erros.join(' | '));
    await ctx.close();
  }

  // 2. Validação da calculadora
  {
    const { ctx, p, erros } = await pagina(390, 'light');
    const casos = [
      ['minutos zero', { 'c-minutos': '0' }, 'e-minutos'],
      ['minutos vazio', { 'c-minutos': '' }, 'e-minutos'],
      ['minutos negativo', { 'c-minutos': '-5' }, 'e-minutos'],
      ['pessoas negativo', { 'c-pessoas': '-2' }, 'e-pessoas'],
      ['pessoas vazio', { 'c-pessoas': '' }, 'e-pessoas'],
      ['pessoas 2,5 (não inteiro)', { 'c-pessoas': '2.5' }, 'e-pessoas'],
      ['vazão negativa', { 'c-vazao': '-1' }, 'e-vazao'],
      ['vazão vazia', { 'c-vazao': '' }, 'e-vazao'],
      ['preço negativo', { 'c-preco': '-1' }, 'e-preco'],
      ['minutos 999 (acima do limite)', { 'c-minutos': '999' }, 'e-minutos'],
    ];
    for (const [nome, campos, erroId] of casos) {
      await p.reload({ waitUntil: 'networkidle' });
      await preencher(p, campos);
      await p.click('#form-calc button[type=submit]');
      const visivel = await p.locator('#' + erroId).isVisible();
      const msg = visivel ? await txt(p, erroId) : '';
      const saidas = await txt(p, 'o-litros');
      const alerta = await p.locator('#calc-erro').isVisible();
      ok('validação: ' + nome + ' → mensagem no campo, resultado "-"', visivel && saidas === '-' && alerta, msg);
    }
    await p.reload({ waitUntil: 'networkidle' });
    await preencher(p, { 'c-minutos': '0' });
    await p.click('#form-calc button[type=submit]');
    ok('ao enviar com erro, o foco vai para o campo errado', await p.evaluate(() => document.activeElement.id) === 'c-minutos');
    await preencher(p, { 'c-minutos': '10' });
    ok('ao corrigir, a mensagem some e o resultado volta', !(await p.locator('#e-minutos').isVisible()) && (await txt(p, 'o-litros')) === '270 L');
    ok('sem erros de console', erros.length === 0, erros.join(' | '));
    await ctx.close();
  }

  // 3. Cadastro "Receber dicas"
  {
    const { ctx, p, erros } = await pagina(390, 'light');
    await p.fill('#r-nome', 'Ana'); await p.fill('#r-email', 'ana@');
    await p.click('#form-cadastro button[type=submit]');
    ok('e-mail inválido "ana@": mensagem de erro', await p.locator('#e-email').isVisible(), await txt(p, 'e-email'));
    await p.fill('#r-email', 'ana sem arroba.com');
    await p.click('#form-cadastro button[type=submit]');
    ok('e-mail inválido sem @: mensagem de erro', await p.locator('#e-email').isVisible());
    await p.fill('#r-nome', ''); await p.fill('#r-email', '');
    await p.click('#form-cadastro button[type=submit]');
    ok('nome e e-mail vazios: as duas mensagens', (await p.locator('#e-nome').isVisible()) && (await p.locator('#e-email').isVisible()));
    await p.fill('#r-nome', '<img src=x onerror=alert(1)>'); await p.fill('#r-email', 'teste@exemplo.com');
    await p.click('#form-cadastro button[type=submit]');
    const msg = await txt(p, 'msg-cadastro');
    const imgs = await p.locator('#msg-cadastro img').count();
    ok('nome com <img onerror>: aparece como texto, nenhuma imagem criada, nenhum alerta', imgs === 0 && /<img src=x/.test(msg) && !erros.some(e => /ALERTA/.test(e)), msg.slice(0, 80));
    const salvo = await p.evaluate(() => localStorage.getItem('ciclo-consumo-cadastros'));
    ok('cadastro válido salvo só no navegador (localStorage)', !!salvo && /teste@exemplo.com/.test(salvo));
    await p.click('#btn-apagar');
    ok('"Apagar meus dados" limpa o navegador', (await p.evaluate(() => localStorage.getItem('ciclo-consumo-cadastros'))) === null);
    ok('sem erros de console', erros.length === 0, erros.join(' | '));
    await ctx.close();
  }

  // 4. Armazenamento bloqueado (modo anônimo / bloqueio)
  {
    const { ctx, p, erros } = await pagina(390, 'light', () => {
      Storage.prototype.setItem = function () { throw new Error('bloqueado'); };
      Storage.prototype.getItem = function () { throw new Error('bloqueado'); };
    });
    await p.fill('#r-nome', 'Bia'); await p.fill('#r-email', 'bia@exemplo.com');
    await p.click('#form-cadastro button[type=submit]');
    ok('armazenamento bloqueado: avisa "não deixou salvar" e não quebra', /não deixou salvar/.test(await txt(p, 'msg-cadastro')));
    ok('armazenamento bloqueado: nenhum erro de JavaScript', !erros.some(e => /pageerror/.test(e)), erros.join(' | '));
    await ctx.close();
  }

  // 5. Layout: 390/1280, claro/escuro
  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
    const { ctx, p, erros } = await pagina(w, cs);
    await p.fill('#c-preco', '1');
    ok(`[${w}-${cs}] sem rolagem horizontal`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ok(`[${w}-${cs}] 10 dicas`, (await p.locator('.dica').count()) === 10);
    ok(`[${w}-${cs}] sem erros de console`, erros.length === 0, erros.join(' | '));
    await p.screenshot({ path: `prints2/site-${w}-${cs}.png`, fullPage: true });
    await ctx.close();
  }

  // 6. Acessibilidade básica, links, travessão
  {
    const { ctx, p } = await pagina(1280, 'light');
    const semLabel = await p.$$eval('input,select', els => els.filter(e => !(e.labels && e.labels.length)).length);
    const semAlt = await p.$$eval('img', im => im.filter(i => !i.hasAttribute('alt')).length);
    ok('todos os campos com label e imagens com alt', semLabel === 0 && semAlt === 0, `semLabel=${semLabel} semAlt=${semAlt}`);
    ok('nenhum travessão no texto visível', !/[—–]/.test(await p.evaluate(() => document.body.innerText)));
    await p.keyboard.press('Tab');
    ok('Tab: primeiro foco = "Pular para o conteúdo"', (await p.evaluate(() => document.activeElement.className)) === 'pular-conteudo');
    const resp = await p.request.get('http://localhost:8766/index.html');
    ok('link "Voltar ao Ciclo 12" aponta para página que existe', resp.status() === 200 && (await p.getAttribute('.navegacao a:last-child', 'href')) === '../index.html');
    await p.click('.navegacao a:last-child'); await p.waitForLoadState('networkidle');
    ok('clicar em "Voltar ao Ciclo 12" abre o hub', /Cinco problemas/.test(await p.textContent('h1')));
    await p.click('a.modulo-pronto[href="site/"]'); await p.waitForLoadState('networkidle');
    ok('no hub, o cartão "Ciclo Consumo" abre o site', /banho da sua casa/.test(await p.textContent('h1')));
    await ctx.close();
  }

  await b.close();
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
