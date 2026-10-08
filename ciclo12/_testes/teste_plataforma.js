// Teste da plataforma Ciclo Prato (interface) com Playwright + Edge.
// MODO=demo (padrão): testa o plano B. MODO=supabase: usa o config.js real e contas de teste (ver variáveis abaixo).
// Uso: "python -m http.server 8766" na pasta ciclo12; depois: node teste_plataforma.js
const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('prints6', { recursive: true });
const URL = 'http://localhost:8766/plataforma/';
const res = [];
const ok = (nome, cond, extra = '') => { res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]); };
const dataSP = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + n * 86400e3));
const amanha = dataSP(1);
const ontem = dataSP(-1);

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  const p = await ctx.newPage(); const erros = [];
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('dialog', d => { erros.push('ALERTA ABRIU: ' + d.message()); d.dismiss(); });
  // garante o modo demonstração mesmo que o config.js já tenha Supabase
  await p.goto(URL + '?modo=demo', { waitUntil: 'networkidle' });
  const sair = async () => { const s = p.locator('.ola button'); if (await s.count()) { await s.click(); await p.waitForTimeout(200); } };
  const entrarDemo = async (texto) => { await sair(); await p.locator('.contas-demo button', { hasText: texto }).click(); await p.waitForSelector('.ola'); };
  const aba = async (texto) => { await p.locator('.abas .aba', { hasText: texto }).click(); await p.waitForTimeout(250); };

  ok('modo demonstração: faixa "DEMONSTRAÇÃO" fixa e visível', await p.locator('#faixa-demo').isVisible());
  ok('aviso legal na tela', /intermedeia contato.*regras sanitárias.*Protótipo escolar/.test(await p.textContent('.aviso-legal')));
  ok('texto de privacidade e contexto PNUMA na tela', (await p.locator('#privacidade').count()) === 1 && /1,05 bilhão/.test(await p.textContent('.contexto-plat')));

  // receptor não aprovado
  await entrarDemo('não aprovado');
  ok('receptor NÃO aprovado: vê "Aguardando aprovação" e nenhuma doação', /Aguardando aprovação/.test(await p.textContent('#area')) && (await p.locator('.doacao').count()) === 0);

  // doador: validação e criação
  await entrarDemo('doador');
  await aba('Nova doação');
  await p.fill('#d-alimento', 'P'); await p.fill('#d-kg', '0'); await p.fill('#d-validade', ontem);
  await p.click('#area form button[type=submit]');
  ok('nova doação: validação no navegador (alimento curto, 0 kg, validade passada)', (await p.locator('#e-d-alimento').isVisible()) && (await p.locator('#e-d-kg').isVisible()) && (await p.locator('#e-d-validade').isVisible()));
  await p.fill('#d-alimento', '<img src=x onerror=alert(1)> Bolos');
  await p.selectOption('#d-categoria', 'padaria');
  await p.fill('#d-kg', '3,5'.replace(',', '.'));
  await p.fill('#d-validade', amanha);
  await p.fill('#d-bairro', 'Vila Galvão');
  await p.fill('#d-endereco', 'Rua do Teste, 42');
  await p.fill('#d-horario', 'Amanhã, 10h às 11h');
  await p.click('#area form button[type=submit]');
  await p.waitForSelector('#mensagem .aviso-ok');
  ok('doador publica doação válida', /Doação publicada/.test(await p.textContent('#mensagem')));
  const card = p.locator('.doacao', { hasText: 'Bolos' });
  ok('XSS: texto "<img onerror>" aparece como texto, nenhuma imagem, nenhum alerta', (await card.locator('img').count()) === 0 && /<img src=x/.test(await card.textContent()) && !erros.some(e => /ALERTA/.test(e)));
  await p.waitForTimeout(300);
  ok('doador vê o próprio endereço de retirada', /Rua do Teste, 42/.test(await card.textContent()));
  await aba('Painel');
  ok('painel do doador: kg, situação, gráfico por semana e TODO das refeições', (await p.locator('.tile').count()) === 4 && (await p.locator('.grafico-semanas rect').count()) === 6 && /TODO/.test(await p.textContent('.refeicoes')));
  await p.fill('#p-refeicao', '0.5');
  ok('refeições equivalentes: com o valor do grupo, calcula e diz "estimativa do grupo"', /refeições equivalentes \(estimativa do grupo/.test(await p.textContent('.refeicoes-saida')));
  await p.screenshot({ path: 'prints6/plat-painel-doador-390.png', fullPage: true });

  // receptor aprovado: vê, reserva
  await entrarDemo('receptor: ONG');
  const disp = p.locator('.doacao', { hasText: 'Bolos' });
  ok('receptor aprovado vê a nova doação', (await disp.count()) === 1);
  ok('endereço NÃO aparece na lista de disponíveis', !/Rua do Teste/.test(await disp.textContent()));
  await disp.locator('button', { hasText: 'Reservar' }).click();
  await p.waitForSelector('#mensagem .aviso-ok');
  await p.waitForTimeout(400);
  const minha = p.locator('.doacao', { hasText: 'Bolos' });
  ok('reservou: aparece em "Minhas reservas" com o endereço', /Reservada/.test(await minha.textContent()) && /Rua do Teste, 42/.test(await minha.textContent()));

  // doador confirma retirada
  await entrarDemo('doador');
  await aba('Minhas doações');
  const res1 = p.locator('.doacao', { hasText: 'Bolos' });
  await res1.locator('button', { hasText: 'Confirmar retirada' }).click();
  await p.waitForSelector('#mensagem .aviso-ok'); await p.waitForTimeout(300);
  ok('doador confirma retirada → "Retirada"', /Retirada/.test(await p.locator('.doacao', { hasText: 'Bolos' }).textContent()));
  ok('doação retirada não tem botão "Apagar"', (await p.locator('.doacao', { hasText: 'Bolos' }).locator('button', { hasText: 'Apagar' }).count()) === 0);

  // admin: aprova receptor pendente, ranking
  await entrarDemo('admin');
  ok('admin vê lista de receptores com "Aguardando aprovação"', /Aguardando aprovação/.test(await p.textContent('#area')));
  await p.locator('.receptor', { hasText: 'Projeto Exemplo' }).locator('button', { hasText: 'Aprovar' }).click();
  await p.waitForSelector('#mensagem .aviso-ok'); await p.waitForTimeout(300);
  ok('admin aprova o receptor', /Aprovado/.test(await p.locator('.receptor', { hasText: 'Projeto Exemplo' }).textContent()));
  await aba('Painel');
  ok('painel geral: ranking de doadores aparece', (await p.locator('.ranking li').count()) >= 1);
  await p.screenshot({ path: 'prints6/plat-painel-admin-390.png', fullPage: true });
  await entrarDemo('Projeto Exemplo');
  ok('receptor recém-aprovado agora vê doações disponíveis', (await p.locator('.doacao').count()) >= 1);

  // cadastro novo
  await sair();
  await p.locator('.abas .aba', { hasText: 'Criar conta' }).click();
  await p.fill('#c-nome', 'A'); await p.fill('#c-email', 'invalido'); await p.fill('#c-senha', '123');
  await p.click('#area form button[type=submit]');
  ok('cadastro: valida nome, e-mail e senha curta', (await p.locator('#e-c-nome').isVisible()) && (await p.locator('#e-c-email').isVisible()) && (await p.locator('#e-c-senha').isVisible()));
  await p.fill('#c-nome', 'Banco de Alimentos Teste'); await p.fill('#c-email', 'banco.teste@exemplo.com'); await p.fill('#c-senha', 'senhaforte1');
  await p.check('input[name=perfil][value=receptor]');
  await p.click('#area form button[type=submit]');
  await p.waitForSelector('.ola');
  ok('cadastro de receptor: entra e fica "Aguardando aprovação"', /Aguardando aprovação/.test(await p.textContent('#area')));
  const guardado = await p.evaluate(() => JSON.stringify(localStorage));
  const conta = await p.evaluate(() => JSON.parse(localStorage.getItem('ciclo-prato-demo')).usuarios.find(u => u.email === 'banco.teste@exemplo.com'));
  ok('SEGURANÇA: a senha digitada NÃO fica guardada em texto (só hash com sal)', !guardado.includes('senhaforte1') && /^[0-9a-f]{64}$/.test(conta.hash) && !!conta.sal && conta.senha === undefined);
  await sair();
  ok('modo demonstração: aviso "não use uma senha de outros sites" na tela de entrar', /Não use uma senha que você usa em outros sites/.test(await p.textContent('#area')));
  await p.fill('#l-email', 'banco.teste@exemplo.com'); await p.fill('#l-senha', 'senhaerrada');
  await p.click('#area form button[type=submit]'); await p.waitForSelector('#mensagem .aviso-conflito');
  ok('senha errada é recusada', /E-mail ou senha errados/.test(await p.textContent('#mensagem')));
  await p.fill('#l-senha', 'senhaforte1'); await p.click('#area form button[type=submit]'); await p.waitForSelector('.ola');
  ok('senha certa entra (conferida pelo hash)', /Banco de Alimentos Teste/.test(await p.textContent('.ola')));
  ok('sem erros de console', erros.filter(e => !/ALERTA/.test(e)).length === 0, erros.join(' | '));

  // Supabase fora do ar → plano B liga sozinho
  {
    const c2 = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p2 = await c2.newPage();
    await p2.route(/plataforma\/config\.js/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.CICLO_PRATO_CONFIG={supabaseUrl:"https://projeto-inexistente.supabase.co",supabaseChave:"chave-publica-falsa"};' }));
    await p2.route(/supabase\.co/, r => r.abort());
    await p2.goto(URL, { waitUntil: 'load' });
    await p2.waitForSelector('#faixa-demo:not([hidden])', { timeout: 15000 });
    ok('Supabase fora do ar: liga o modo demonstração sozinho e explica', /Não foi possível falar com o Supabase/.test(await p2.textContent('#modo-info')));
    await c2.close();
  }

  // layout
  for (const [w, cs] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
    const c3 = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: cs });
    const p3 = await c3.newPage(); const e3 = [];
    p3.on('console', m => { if (m.type() === 'error') e3.push(m.text()); });
    await p3.goto(URL + '?modo=demo', { waitUntil: 'networkidle' });
    await p3.locator('.contas-demo button', { hasText: 'doador' }).click(); await p3.waitForSelector('.ola');
    await p3.locator('.abas .aba', { hasText: 'Minhas doações' }).click(); await p3.waitForTimeout(400);
    ok(`[${w}-${cs}] sem rolagem horizontal e sem erros`, await p3.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth) && e3.length === 0, e3.join(' | '));
    await p3.screenshot({ path: `prints6/plat-doador-${w}-${cs}.png` });
    await c3.close();
  }
  {
    const c4 = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p4 = await c4.newPage();
    await p4.goto(URL + '?modo=demo', { waitUntil: 'networkidle' });
    const semLabel = await p4.$$eval('input:not([type=radio]), select, textarea', els => els.filter(e => !(e.labels && e.labels.length)).length);
    ok('campos com label (tela de entrar)', semLabel === 0, String(semLabel));
    ok('nenhum travessão no texto visível', !/[—–]/.test(await p4.evaluate(() => document.body.innerText)));
    await p4.goto('http://localhost:8766/', { waitUntil: 'networkidle' });
    await p4.click('a.modulo-pronto[href="plataforma/"]'); await p4.waitForLoadState('networkidle');
    ok('no hub, o cartão "Ciclo Prato" abre a plataforma', /Comida boa não é lixo/.test(await p4.textContent('h1')));
    await c4.close();
  }
  await b.close();
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + r[2] + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})();
