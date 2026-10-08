// Testa o banco REAL do Supabase com a chave PÚBLICA (como um usuário comum faria).
// Fase 1: node teste_supabase.js 1  → cria as contas de teste e testa o que não precisa de admin
// Fase 2: node teste_supabase.js 2  → depois que a conta do admin for promovida por SQL
// As senhas ficam em CONTAS_TESTE_NAO_PUBLICAR.json FORA do repositório.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');
const URL = 'https://xehcgloexizdvojuxjwe.supabase.co';
const CHAVE = 'sb_publishable_9CkMr6LJwn6_YZ1sy3qzaA_apP5iaSb';
const ARQ = 'C:/Users/Engghgtytr/Documents/Ciclo 12 project/CONTAS_TESTE_NAO_PUBLICAR.json';
const fase = process.argv[2] || '1';
const res = [];
const ok = (nome, cond, extra = '') => res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]);
const cliente = () => createClient(URL, CHAVE, { auth: { persistSession: false, autoRefreshToken: false } });
const dataSP = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + n * 86400e3));
const dia = dataSP;
const senha = () => 'Ciclo12-' + crypto.randomBytes(6).toString('base64url');

(async () => {
  let contas = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, 'utf8')) : null;
  async function entrar(c) {
    const sb = cliente();
    const r = await sb.auth.signInWithPassword({ email: c.email, password: c.senha });
    if (r.error) throw new Error(c.email + ': ' + r.error.message);
    return sb;
  }

  if (fase === '1') {
    if (!contas) {
      contas = {
        aviso: 'Contas de TESTE do Ciclo Prato. NÃO publique este arquivo (ele fica fora da pasta ciclo12 de propósito).',
        doador: { email: 'doador.ciclo12@example.com', senha: senha(), nome: 'Padaria Teste', organizacao: 'Padaria Teste (conta de teste)', perfil: 'doador' },
        receptor: { email: 'receptor.ciclo12@example.com', senha: senha(), nome: 'ONG Teste', organizacao: 'ONG Teste (conta de teste)', perfil: 'receptor' },
        receptor2: { email: 'receptor2.ciclo12@example.com', senha: senha(), nome: 'Projeto Teste', organizacao: 'Projeto Teste (conta de teste)', perfil: 'receptor' },
        admin: { email: 'admin.ciclo12@example.com', senha: senha(), nome: 'Admin do grupo', organizacao: '', perfil: 'doador' },
        intruso: { email: 'intruso.ciclo12@example.com', senha: senha(), nome: 'Quero Ser Admin', organizacao: '', perfil: 'admin' }
      };
      fs.writeFileSync(ARQ, JSON.stringify(contas, null, 2));
    }
    for (const k of ['doador', 'receptor', 'receptor2', 'admin', 'intruso']) {
      const c = contas[k];
      const sb = cliente();
      const r = await sb.auth.signUp({ email: c.email, password: c.senha, options: { data: { nome: c.nome, organizacao: c.organizacao, perfil: c.perfil } } });
      const jaExiste = r.error && /already|registered/i.test(r.error.message);
      ok(`cadastro da conta de teste "${k}"`, !r.error || jaExiste, r.error ? r.error.message : (r.data.session ? 'entrou direto (confirmação desligada)' : 'SEM sessão: confirmação de e-mail ligada?'));
    }
    const sd = await entrar(contas.doador), sr = await entrar(contas.receptor), si = await entrar(contas.intruso);
    const pIntruso = await si.from('profiles').select('perfil').single();
    ok('BURLA: cadastro dizendo perfil "admin" → vira doador', pIntruso.data && pIntruso.data.perfil === 'doador', JSON.stringify(pIntruso.data || pIntruso.error));
    const pr = await sr.from('profiles').select('perfil, aprovado').single();
    ok('receptor começa NÃO aprovado', pr.data && pr.data.perfil === 'receptor' && pr.data.aprovado === false, JSON.stringify(pr.data));
    const anon = await cliente().from('doacoes').select('id');
    ok('visitante sem login não lê doações', !!anon.error || anon.data.length === 0, anon.error ? anon.error.message : String(anon.data.length));
    const nova = (sb, extra = {}) => sb.rpc('criar_doacao', { p_alimento: extra.alimento || 'Pães do dia (teste)', p_categoria: 'padaria', p_quantidade_kg: extra.kg ?? 4, p_validade: extra.validade || dia(2), p_bairro: 'Vila Galvão', p_endereco: 'Rua de Teste, 100', p_horario: 'Amanhã, 10h às 11h', p_observacoes: 'Doação de TESTE' });
    const c1 = await nova(sd);
    ok('doador cria doação', !c1.error && c1.data, c1.error && c1.error.message);
    contas.idDoacao = c1.data; fs.writeFileSync(ARQ, JSON.stringify(contas, null, 2));
    const cv = await nova(sd, { validade: dia(-1) });
    ok('BURLA: validade no passado → banco recusa', !!cv.error, cv.error && cv.error.message);
    const ck = await nova(sd, { kg: 0 });
    ok('BURLA: 0 kg → banco recusa', !!ck.error, ck.error && ck.error.message);
    const crc = await nova(sr);
    ok('BURLA: receptor criando doação → banco recusa', !!crc.error, crc.error && crc.error.message);
    const ins = await sd.from('doacoes').insert({ alimento: 'x', categoria: 'outros', quantidade_kg: 1, validade: dia(1), bairro: 'Centro', horario_retirada: 'agora' });
    ok('BURLA: inserir direto na tabela → banco recusa', !!ins.error, ins.error && ins.error.message);
    const vNao = await sr.from('doacoes').select('id');
    ok('receptor NÃO aprovado não vê doações', !vNao.error && vNao.data.length === 0, JSON.stringify(vNao.data || vNao.error));
    const rNao = await sr.rpc('reservar_doacao', { p_doacao: c1.data });
    ok('BURLA: receptor NÃO aprovado reservando → banco recusa', !!rNao.error, rNao.error && rNao.error.message);
    const auto = await sr.from('profiles').update({ aprovado: true }).eq('perfil', 'receptor');
    ok('BURLA: receptor se aprovando sozinho → banco recusa', !!auto.error, auto.error && auto.error.message);
    const vira = await sd.from('profiles').update({ perfil: 'admin' }).eq('perfil', 'doador');
    ok('BURLA: doador virando admin → banco recusa', !!vira.error, vira.error && vira.error.message);
    const ap = await sr.rpc('aprovar_receptor', { p_usuario: (await sr.auth.getUser()).data.user.id, p_aprovado: true });
    ok('BURLA: não-admin chamando aprovar_receptor → banco recusa', !!ap.error, ap.error && ap.error.message);
    const outros = await sd.from('profiles').select('id');
    ok('usuário comum só lê o próprio perfil', !outros.error && outros.data.length === 1);
  }

  if (fase === '2') {
    const sa = await entrar(contas.admin), sd = await entrar(contas.doador), sr = await entrar(contas.receptor), sr2 = await entrar(contas.receptor2);
    const pa = await sa.from('profiles').select('perfil').eq('id', (await sa.auth.getUser()).data.user.id).single();
    ok('conta do admin está como "admin"', pa.data && pa.data.perfil === 'admin', JSON.stringify(pa.data || pa.error));
    const todos = await sa.from('profiles').select('id, perfil, aprovado, nome');
    ok('admin lê todos os perfis', !todos.error && todos.data.length >= 5, String(todos.data && todos.data.length));
    const idR = (await sr.auth.getUser()).data.user.id;
    const ap = await sa.rpc('aprovar_receptor', { p_usuario: idR, p_aprovado: true });
    ok('admin aprova o receptor', !ap.error, ap.error && ap.error.message);
    const id = contas.idDoacao;
    const vis = await sr.from('doacoes').select('id, status').eq('id', id);
    ok('receptor aprovado vê a doação disponível', !vis.error && vis.data.length === 1, JSON.stringify(vis.data || vis.error));
    const e0 = await sr.from('doacao_endereco').select('endereco').eq('doacao_id', id);
    ok('endereço NÃO aparece antes da reserva', !e0.error && e0.data.length === 0);
    const ed = await sr.from('doacoes').update({ alimento: 'mudei' }).eq('id', id).select('id');
    ok('BURLA: receptor editando doação → nenhuma linha alterada', !!ed.error || ed.data.length === 0, ed.error ? ed.error.message : '0 linhas');
    const st = await sr.from('doacoes').update({ status: 'reservada' }).eq('id', id);
    ok('BURLA: mudar a situação direto (status) → banco recusa', !!st.error, st.error && st.error.message);
    const dr = await sd.rpc('reservar_doacao', { p_doacao: id });
    ok('BURLA: doador reservando a própria → banco recusa', !!dr.error, dr.error && dr.error.message);
    const r1 = await sr.rpc('reservar_doacao', { p_doacao: id });
    ok('receptor reserva a doação', !r1.error, r1.error && r1.error.message);
    const e1 = await sr.from('doacao_endereco').select('endereco').eq('doacao_id', id);
    ok('depois de reservar, o receptor vê o endereço', !e1.error && e1.data.length === 1, JSON.stringify(e1.data));
    const e2 = await sr2.from('doacao_endereco').select('endereco').eq('doacao_id', id);
    ok('receptor NÃO aprovado/outro não vê o endereço', !e2.error && e2.data.length === 0);
    const cr = await sr.rpc('confirmar_retirada', { p_doacao: id });
    ok('BURLA: receptor confirmando retirada → banco recusa', !!cr.error, cr.error && cr.error.message);
    const cd = await sd.rpc('confirmar_retirada', { p_doacao: id });
    ok('doador confirma a retirada', !cd.error, cd.error && cd.error.message);
    const fim = await sd.from('doacoes').select('status').eq('id', id).single();
    ok('situação final "retirada"', fim.data && fim.data.status === 'retirada');
    // doação vencida não pode ser criada nem reservada: criação já testada; reserva de vencida só com dado antigo (testado no PGlite)
    // deixa uma doação disponível para a demonstração
    const demo = await sd.rpc('criar_doacao', { p_alimento: 'Pães do dia', p_categoria: 'padaria', p_quantidade_kg: 4, p_validade: dia(1), p_bairro: 'Vila Galvão', p_endereco: 'Endereço de teste, 100', p_horario: 'Amanhã, 17h às 18h', p_observacoes: 'Doação de teste para a demonstração' });
    ok('deixa 1 doação disponível pronta para a demonstração', !demo.error, demo.error && demo.error.message);
    const ad = await sa.from('doacoes').select('id');
    ok('admin vê todas as doações', !ad.error && ad.data.length >= 2, String(ad.data && ad.data.length));
  }
  for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + String(r[2]).slice(0, 110) + ']' : '');
  console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
