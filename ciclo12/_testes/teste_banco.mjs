// Requer: npm i @electric-sql/pglite (numa pasta de testes). Uso: node teste_banco.mjs ../plataforma/banco.sql
// Testa plataforma/banco.sql num PostgreSQL local (PGlite), imitando o login do Supabase.
// Uso: node teste_banco.mjs "<caminho do banco.sql>"
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const sql = readFileSync(process.argv[2], 'utf8');
const db = new PGlite();
const res = [];
const ok = (nome, cond, extra = '') => res.push([cond ? 'PASSOU' : 'FALHOU', nome, extra]);

// ---- imitação do Supabase: schema auth, auth.uid(), papéis anon/authenticated e permissões padrão ----
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique, raw_user_meta_data jsonb default '{}');
  create role anon nologin; create role authenticated nologin;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- no Supabase, tabelas novas em "public" já nascem liberadas para anon/authenticated:
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);
await db.exec(sql);
ok('banco.sql roda inteiro sem erro', true);
await db.exec(sql); // rodar de novo também precisa funcionar
ok('banco.sql roda uma 2ª vez (recomeça do zero) sem erro', true);

async function novoUsuario(email, meta) {
  const r = await db.query('insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id', [email, meta]);
  return r.rows[0].id;
}
async function como(uid, texto, params = [], papel = 'authenticated') {
  try {
    return await db.transaction(async (tx) => {
      await tx.query(`set local role ${papel}`);
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [uid || '']);
      const r = await tx.query(texto, params);
      return { ok: true, rows: r.rows, n: r.affectedRows ?? r.rows.length };
    });
  } catch (e) { return { ok: false, erro: e.message }; }
}
const dataSP = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + n * 86400e3));
const hoje = dataSP(0);
const amanha = dataSP(1);
const ontem = dataSP(-1);
const criar = (uid, extra = {}) => como(uid, 'select public.criar_doacao($1,$2,$3,$4,$5,$6,$7,$8) as id',
  [extra.alimento || 'Pães do dia', extra.categoria || 'padaria', extra.kg ?? 5, extra.validade || amanha, 'Vila Galvão', 'Rua de Teste, 100', 'Hoje, 17h às 18h', null]);

// ---- usuários de teste ----
const doador = await novoUsuario('doador@teste.local', { perfil: 'doador', nome: 'Padaria Teste', organizacao: 'Padaria Teste' });
const doador2 = await novoUsuario('doador2@teste.local', { perfil: 'doador', nome: 'Mercado Teste' });
const receptor = await novoUsuario('receptor@teste.local', { perfil: 'receptor', nome: 'ONG Teste', organizacao: 'ONG Teste' });
const receptor2 = await novoUsuario('receptor2@teste.local', { perfil: 'receptor', nome: 'Projeto Não Aprovado' });
const receptor3 = await novoUsuario('receptor3@teste.local', { perfil: 'receptor', nome: 'Igreja Teste' });
const intruso = await novoUsuario('intruso@teste.local', { perfil: 'admin', nome: 'Quero Ser Admin' });
const admin = await novoUsuario('admin@teste.local', { perfil: 'doador', nome: 'Admin do Grupo' });
await db.query("update public.profiles set perfil = 'admin', aprovado = true where id = $1", [admin]);

const perfil = async (id) => (await db.query('select perfil, aprovado from public.profiles where id = $1', [id])).rows[0];
ok('cadastro cria o perfil sozinho (doador aprovado automaticamente)', (await perfil(doador)).perfil === 'doador' && (await perfil(doador)).aprovado === true);
ok('receptor começa NÃO aprovado', (await perfil(receptor)).aprovado === false);
ok('BURLA: cadastrar-se dizendo perfil "admin" → vira doador', (await perfil(intruso)).perfil === 'doador');

// ---- doador cria doações ----
const c1 = await criar(doador);
const id1 = c1.ok ? c1.rows[0].id : null;
ok('doador cria doação (função criar_doacao)', c1.ok && id1, c1.erro);
const cv = await criar(doador, { validade: ontem });
ok('BURLA: doação com validade no passado → banco recusa', !cv.ok, cv.erro);
const ck = await criar(doador, { kg: 0 });
ok('BURLA: doação com 0 kg → banco recusa (CHECK)', !ck.ok, ck.erro);
const ckn = await criar(doador, { kg: -3 });
ok('BURLA: doação com kg negativo → banco recusa', !ckn.ok);
const ccat = await criar(doador, { categoria: 'drogas' });
ok('BURLA: categoria fora da lista → banco recusa', !ccat.ok);
const crec = await criar(receptor);
ok('BURLA: receptor tentando criar doação → banco recusa', !crec.ok, crec.erro);
const ins = await como(doador, "insert into public.doacoes (doador_id, alimento, categoria, quantidade_kg, validade, bairro, horario_retirada) values ($1,'x','outros',1,$2,'Centro','agora')", [doador, amanha]);
ok('BURLA: inserir direto na tabela (sem a função) → banco recusa', !ins.ok, ins.erro);

// doação vencida (criada direto pelo dono do banco, simulando o tempo passando)
await db.exec('alter table public.doacoes disable trigger doacoes_validade_futura');
const vencida = (await db.query(`insert into public.doacoes (doador_id, alimento, categoria, quantidade_kg, validade, bairro, horario_retirada) values ($1,'Iogurte','laticinios',2,$2,'Centro','manhã') returning id`, [doador, ontem])).rows[0].id;
await db.exec('alter table public.doacoes enable trigger doacoes_validade_futura');

// ---- receptor não aprovado ----
const vNao = await como(receptor, 'select id from public.doacoes');
ok('receptor NÃO aprovado não vê nenhuma doação', vNao.ok && vNao.rows.length === 0, JSON.stringify(vNao.rows));
const rNao = await como(receptor, 'select public.reservar_doacao($1)', [id1]);
ok('BURLA: receptor NÃO aprovado tentando reservar → banco recusa', !rNao.ok, rNao.erro);
const autoAprova = await como(receptor, 'update public.profiles set aprovado = true where id = $1', [receptor]);
ok('BURLA: receptor se aprovando sozinho (update aprovado) → banco recusa', !autoAprova.ok, autoAprova.erro);
const viraAdmin = await como(doador, "update public.profiles set perfil = 'admin' where id = $1", [doador]);
ok('BURLA: usuário comum virando admin (update perfil) → banco recusa', !viraAdmin.ok, viraAdmin.erro);
const aprovaOutro = await como(receptor, 'select public.aprovar_receptor($1, true)', [receptor2]);
ok('BURLA: não-admin chamando aprovar_receptor → banco recusa', !aprovaOutro.ok, aprovaOutro.erro);
const nomeOk = await como(receptor, "update public.profiles set nome = 'ONG Teste Atualizada' where id = $1", [receptor]);
ok('usuário pode mudar o próprio nome', nomeOk.ok && nomeOk.n === 1, nomeOk.erro);
const nomeOutro = await como(receptor, "update public.profiles set nome = 'Hackeado' where id = $1", [doador]);
ok('BURLA: mudar o nome de outra pessoa → nenhuma linha alterada', nomeOutro.ok && nomeOutro.n === 0);

// ---- admin aprova ----
const ap = await como(admin, 'select public.aprovar_receptor($1, true)', [receptor]);
const ap3 = await como(admin, 'select public.aprovar_receptor($1, true)', [receptor3]);
ok('admin aprova receptores', ap.ok && ap3.ok && (await perfil(receptor)).aprovado === true, ap.erro || ap3.erro);

// ---- receptor aprovado ----
const vis = await como(receptor, 'select id, status from public.doacoes order by id');
ok('receptor aprovado vê a doação disponível', vis.ok && vis.rows.some(r => r.id === id1));
ok('receptor aprovado NÃO vê a doação vencida', vis.ok && !vis.rows.some(r => r.id === vencida));
const end0 = await como(receptor, 'select endereco from public.doacao_endereco where doacao_id = $1', [id1]);
ok('endereço NÃO aparece antes da reserva', end0.ok && end0.rows.length === 0);
const editaDoacao = await como(receptor, "update public.doacoes set alimento = 'mudei' where id = $1", [id1]);
ok('BURLA: receptor editando doação → nenhuma linha alterada', editaDoacao.ok && editaDoacao.n === 0);
const mudaStatus = await como(receptor, "update public.doacoes set status = 'reservada' where id = $1", [id1]);
ok('BURLA: mudar a situação direto na tabela (status) → banco recusa', !mudaStatus.ok, mudaStatus.erro);
const insRes = await como(receptor, 'insert into public.reservas (doacao_id, receptor_id) values ($1, $2)', [id1, receptor]);
ok('BURLA: inserir reserva direto na tabela → banco recusa', !insRes.ok, insRes.erro);
const resVenc = await como(receptor, 'select public.reservar_doacao($1)', [vencida]);
ok('BURLA: reservar doação vencida → banco recusa', !resVenc.ok, resVenc.erro);
const doadorReserva = await como(doador, 'select public.reservar_doacao($1)', [id1]);
ok('BURLA: doador reservando a própria doação → banco recusa', !doadorReserva.ok, doadorReserva.erro);

// ---- reserva ----
const res1 = await como(receptor, 'select public.reservar_doacao($1)', [id1]);
ok('receptor aprovado reserva a doação', res1.ok, res1.erro);
ok('situação vira "reservada"', (await db.query('select status from public.doacoes where id = $1', [id1])).rows[0].status === 'reservada');
const end1 = await como(receptor, 'select endereco from public.doacao_endereco where doacao_id = $1', [id1]);
ok('depois de reservar, o receptor vê o endereço', end1.ok && end1.rows.length === 1, JSON.stringify(end1.rows));
const end3 = await como(receptor3, 'select endereco from public.doacao_endereco where doacao_id = $1', [id1]);
ok('outro receptor NÃO vê o endereço', end3.ok && end3.rows.length === 0);
const vis3 = await como(receptor3, 'select id from public.doacoes where id = $1', [id1]);
ok('outro receptor não vê mais a doação reservada', vis3.ok && vis3.rows.length === 0);
const res3 = await como(receptor3, 'select public.reservar_doacao($1)', [id1]);
ok('BURLA: segundo receptor reservando a mesma doação → banco recusa', !res3.ok, res3.erro);
const resR = await como(receptor3, 'select * from public.reservas');
ok('outro receptor não vê reservas alheias', resR.ok && resR.rows.length === 0);
const resD = await como(doador, 'select * from public.reservas');
ok('doador vê a reserva da doação dele', resD.ok && resD.rows.length === 1);

// ---- retirada ----
const retR = await como(receptor, 'select public.confirmar_retirada($1)', [id1]);
ok('BURLA: receptor confirmando a retirada → banco recusa', !retR.ok, retR.erro);
const retD2 = await como(doador2, 'select public.confirmar_retirada($1)', [id1]);
ok('BURLA: outro doador confirmando a retirada → banco recusa', !retD2.ok, retD2.erro);
const ret = await como(doador, 'select public.confirmar_retirada($1)', [id1]);
ok('doador confirma a retirada → situação "retirada"', ret.ok && (await db.query('select status from public.doacoes where id = $1', [id1])).rows[0].status === 'retirada', ret.erro);
const apagaRet = await como(doador, 'delete from public.doacoes where id = $1', [id1]);
ok('BURLA: apagar doação já retirada → nenhuma linha apagada', apagaRet.ok && apagaRet.n === 0);

// ---- isolamento entre doadores ----
const v2 = await como(doador2, 'select id from public.doacoes');
ok('outro doador não vê doações alheias', v2.ok && v2.rows.length === 0);
const c2 = await criar(doador);
const apagaOutro = await como(doador2, 'delete from public.doacoes where id = $1', [c2.rows[0].id]);
ok('BURLA: doador apagando doação de outro → nenhuma linha apagada', apagaOutro.ok && apagaOutro.n === 0);
const edita = await como(doador, "update public.doacoes set alimento = 'Pão francês' where id = $1", [c2.rows[0].id]);
ok('doador edita a própria doação enquanto disponível', edita.ok && edita.n === 1);
const apagaProp = await como(doador, 'delete from public.doacoes where id = $1', [c2.rows[0].id]);
ok('doador apaga a própria doação enquanto disponível', apagaProp.ok && apagaProp.n === 1);

// ---- leitura de perfis ----
const pr = await como(receptor, 'select id from public.profiles');
ok('usuário comum só lê o próprio perfil', pr.ok && pr.rows.length === 1 && pr.rows[0].id === receptor);
const pa = await como(admin, 'select id from public.profiles');
ok('admin lê todos os perfis', pa.ok && pa.rows.length === 7);
const da = await como(admin, 'select id from public.doacoes');
ok('admin vê todas as doações', da.ok && da.rows.length >= 2);

// ---- visitante sem login ----
const an = await como(null, 'select * from public.doacoes', [], 'anon');
ok('visitante sem login (anon) não lê doações', !an.ok || an.rows.length === 0, an.erro);
const anr = await como(null, 'select public.criar_doacao($1,$2,$3,$4,$5,$6,$7,$8)', ['x', 'outros', 1, amanha, 'Centro', 'Rua X, 1', 'agora', null], 'anon');
ok('visitante sem login não cria doação', !anr.ok, anr.erro);

for (const r of res) console.log(r[0].padEnd(7), r[1], r[2] ? '  [' + String(r[2]).slice(0, 110) + ']' : '');
console.log('\nTotal:', res.filter(r => r[0] === 'PASSOU').length, 'passaram,', res.filter(r => r[0] === 'FALHOU').length, 'falharam');
