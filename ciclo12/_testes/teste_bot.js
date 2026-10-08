// Teste do Ciclo Bot com Playwright + Microsoft Edge.
// Uso: "python -m http.server 8766" na pasta ciclo12; numa pasta com playwright: node teste_bot.js
const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('prints4', { recursive: true });
const URL = 'http://localhost:8766/chatbot/';
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };

// pergunta, o que o bot deve entender, e um trecho que a resposta precisa ter (e um que NÃO pode ter)
const PERGUNTAS = [
  ['bateia de selular', 'item:bateria', 'NÃO recebem baterias', 'Ecoponto mais perto'],
  ['ola', 'intencao:saudacao', 'Eu sou o Ciclo Bot'],
  ['pilhaa', 'item:pilha', 'NÃO recebem pilhas', 'Ecoponto mais perto'],
  ['camizeta', 'item:roupa', 'doação'],
  ['onde jogo óleo de cozinha?', 'item:oleo', 'Ecoponto mais perto da escola'],
  ['garrafa PET', 'item:pet', 'vermelha (plástico)'],
  ['Onde descarto meu celular velho?', 'item:celular', 'Lei 12.305/2010'],
  ['caixa de leite', 'item:longa-vida', 'Confirme com a Prefeitura'],
  ['caixa de pizza', 'item:pizza', 'parte limpa'],
  ['lâmpada fluorescente', 'item:lampada', 'NÃO recebem lâmpadas'],
  ['remédio vencido', 'item:remedio', 'farmácia'],
  ['sofá', 'item:movel', 'Confirmado na fonte'],
  ['pneu', 'item:pneu', 'dengue'],
  ['isopor', 'item:isopor', 'Não indico um Ecoponto'],
  ['fralda', 'item:fralda', 'lixo de banheiro'],
  ['tijolo', 'item:entulho', 'Ecoponto mais perto'],
  ['qual a cor da lixeira?', 'intencao:cores', 'CONAMA'],
  ['obrigado!', 'intencao:agradecimento', 'De nada'],
  ['o que é a ODS 12?', 'intencao:ods', '12.5'],
  ['onde fica o ecoponto mais perto?', 'intencao:perto', 'Timóteo Penteado'],
  ['xablau flurp zzz', 'nada', 'Não entendi'],
  ['<script>alert(1)</script>', 'nada', 'Não entendi'],
  ['<img src=x onerror=alert(1)>', 'nada', 'Não entendi'],
  ['geladera quebrada', 'item:eletrodomestico', 'Ecoponto'],
  ['papelão', 'item:papelao', 'azul (papel e papelão)'],
  ['resto de comida', 'item:resto-comida', 'NÃO recebem restos de comida'],
  ['lata de tinta', 'item:tinta', 'perigosos'],
  ['televisão', 'item:tv', 'Não indico um Ecoponto'],
];

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  async function pagina(w, cs, geo) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: cs, locale: 'pt-BR', ...(geo ? { geolocation: geo, permissions: ['geolocation'] } : {}) });
    const p = await ctx.newPage(); const erros = [];
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('dialog', d => { erros.push('ALERTA ABRIU: ' + d.message()); d.dismiss(); });
    await p.goto(URL, { waitUntil: 'networkidle' });
    return { ctx, p, erros };
  }
  async function perguntar(p, texto) {
    const antes = await p.locator('.msg-bot:not(.digitando)').count();
    await p.fill('#pergunta', texto);
    await p.press('#pergunta', 'Enter');
    await p.waitForFunction(n => document.querySelectorAll('.msg-bot:not(.digitando)').length > n, antes, { timeout: 5000 });
    return (await p.locator('.msg-bot:not(.digitando) .balao').last().textContent()).replace(/\s+/g, ' ');
  }

  // 1. As perguntas
  const tabela = [];
  {
    const { ctx, p, erros } = await pagina(1280, 'light');
    for (const [q, esperado, deveTer, naoPodeTer] of PERGUNTAS) {
      const r = await p.evaluate(t => window.CICLO_BOT_ENTENDER(t), q);
      const entendeu = r.tipo === 'item' ? 'item:' + r.item.id : r.tipo === 'intencao' ? 'intencao:' + r.id : r.tipo;
      const resp = await perguntar(p, q);
      const acertou = entendeu === esperado && resp.includes(deveTer) && (!naoPodeTer || !resp.includes(naoPodeTer));
      tabela.push([q, entendeu, resp.slice(0, 95), acertou ? 'SIM' : 'NÃO']);
      ok(`pergunta "${q}"`, acertou, `esperado ${esperado}, entendeu ${entendeu}`);
    }
    const imgsRuins = await p.$$eval('#conversa img', ims => ims.filter(i => !i.classList.contains('msg-avatar')).length);
    const scripts = await p.$$eval('#conversa script', s => s.length);
    ok('injeção: nenhuma <img> nem <script> criada na conversa, nenhum alerta', imgsRuins === 0 && scripts === 0 && !erros.some(e => /ALERTA/.test(e)));
    ok('o texto do usuário aparece como texto puro', (await p.locator('.msg-usuario .balao', { hasText: '<script>alert(1)</script>' }).count()) === 1);
    ok('sem erros de console', erros.length === 0, erros.join(' | '));
    await p.screenshot({ path: 'prints4/bot-conversa-1280.png' });
    await ctx.close();
  }

  // 2. UX: digitando, Enter, menu, respostas rápidas, você quis dizer, limpar
  {
    const { ctx, p, erros } = await pagina(390, 'light');
    ok('boas-vindas aparece ao abrir', /Eu sou o Ciclo Bot/.test(await p.textContent('#conversa')));
    await p.fill('#pergunta', 'pilha'); await p.press('#pergunta', 'Enter');
    await p.waitForTimeout(120);
    ok('"digitando..." aparece antes da resposta', (await p.locator('.digitando').count()) === 1);
    await p.waitForTimeout(600);
    ok('"digitando..." some e a resposta chega (~400 ms)', (await p.locator('.digitando').count()) === 0 && /Pilha/.test(await p.locator('.msg-bot .balao').last().textContent()));
    ok('Enter envia e limpa a caixa', (await p.inputValue('#pergunta')) === '');
    const sc = await p.$eval('#conversa', c => Math.abs(c.scrollHeight - c.clientHeight - c.scrollTop) < 4);
    ok('rola sozinho até a última mensagem', sc);
    await p.click('#menu-rapido button[data-menu=eletronicos]'); await p.waitForTimeout(600);
    ok('menu "Eletrônicos" mostra botões dos itens', (await p.locator('.msg-bot .respostas-rapidas').last().locator('button').count()) >= 6);
    await p.locator('.msg-bot .respostas-rapidas').last().getByRole('button', { name: 'Celular', exact: true }).click(); await p.waitForTimeout(600);
    ok('clicar num botão de resposta rápida responde o item', /Celular é lixo eletrônico/.test(await p.locator('.msg-bot .balao').last().textContent()));
    await p.click('#menu-rapido button[data-menu=cores]'); await p.waitForTimeout(600);
    ok('menu "Lixeira por cor": 10 cores', (await p.locator('.msg-bot').last().locator('.lista-cores li').count()) === 10);
    for (const m of ['roupas', 'cozinha', 'alimentos', 'ods', 'perto']) {
      await p.click(`#menu-rapido button[data-menu=${m}]`); await p.waitForTimeout(600);
    }
    ok('os 7 botões do menu respondem', (await p.locator('.msg-bot').count()) >= 10);
    const r = await perguntar(p, 'garafa');
    ok('"garafa" (incompleto) → pergunta "Você quis dizer...?" ou entende garrafa', /Você quis dizer|Garrafa|Vidro/.test(r), r.slice(0, 80));
    await p.click('#btn-limpar'); await p.waitForTimeout(200);
    ok('"Limpar conversa" deixa só a boas-vindas', (await p.locator('#conversa .msg').count()) === 1);
    ok('sem rolagem horizontal (390 px)', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ok('sem erros de console', erros.length === 0, erros.join(' | '));
    await ctx.close();
  }

  // 3. Localização falsa perto do PEV Pimentas
  {
    const { ctx, p } = await pagina(390, 'light', { latitude: -23.43701, longitude: -46.40845 });
    await perguntar(p, 'ecoponto mais perto');
    await p.locator('.msg-bot .respostas-rapidas').last().locator('button', { hasText: 'Usar minha localização' }).click();
    await p.waitForTimeout(1500);
    const t = await p.textContent('#conversa');
    ok('"Usar minha localização" (GPS falso no Pimentas): 1º = Pimentas, "de você"', /Ecopontos mais perto de você/.test(t) && /1º: Pimentas/.test(t.replace(/\s+/g, ' ')));
    const r = await perguntar(p, 'vidro');
    ok('depois, as respostas usam a sua posição', /Ecoponto mais perto de você/.test(r));
    await ctx.close();
  }
  // 4. Localização negada
  {
    const { ctx, p } = await pagina(390, 'light');
    await ctx.clearPermissions();
    await perguntar(p, 'ponto mais perto');
    await p.locator('.msg-bot .respostas-rapidas').last().locator('button', { hasText: 'Usar minha localização' }).click();
    await p.waitForTimeout(1500);
    ok('localização negada: mensagem clara e continua usando a escola', /não permitiu|Não consegui/.test(await p.textContent('#conversa')));
    await ctx.close();
  }

  // 5. Layout, modo escuro, acessibilidade, offline
  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'dark']]) {
    const { ctx, p, erros } = await pagina(w, cs);
    await perguntar(p, 'óleo de cozinha');
    ok(`[${w}-${cs}] sem rolagem horizontal`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ok(`[${w}-${cs}] sem erros de console`, erros.length === 0, erros.join(' | '));
    await p.screenshot({ path: `prints4/bot-${w}-${cs}.png` });
    await ctx.close();
  }
  {
    const { ctx, p } = await pagina(1280, 'light');
    const semLabel = await p.$$eval('input', els => els.filter(e => !(e.labels && e.labels.length)).length);
    ok('caixa de pergunta tem label', semLabel === 0);
    ok('nenhum travessão no texto visível', !/[—–]/.test(await p.evaluate(() => document.body.innerText)));
    await p.keyboard.press('Tab');
    ok('Tab: primeiro foco = link "Pular para a caixa de pergunta"', (await p.evaluate(() => document.activeElement.className)) === 'pular-conteudo');
    await ctx.setOffline(true);
    const r = await perguntar(p, 'pneu');
    ok('sem internet (depois de aberto) continua respondendo', /Pneu pode ir para o Ecoponto/.test(r));
    await ctx.close();
  }
  // 6. Hub liga ao bot
  {
    const { ctx, p } = await pagina(1280, 'light');
    await p.goto('http://localhost:8766/', { waitUntil: 'networkidle' });
    await p.click('a.modulo-pronto[href="chatbot/"]'); await p.waitForLoadState('networkidle');
    ok('no hub, o cartão "Ciclo Bot" abre o chatbot', /Onde eu descarto isso/.test(await p.textContent('h1')));
    await ctx.close();
  }
  await b.close();

  console.log('\nTABELA: pergunta | entendeu | início da resposta | acertou?');
  for (const t of tabela) console.log('| ' + t.join(' | ') + ' |');
  console.log('');
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
