-- =========================================================
-- Ciclo Prato — banco de dados (Supabase / PostgreSQL)
-- Cole TUDO no Supabase: menu "SQL Editor" > "New query" > colar > "Run".
-- Pode rodar de novo sem problema: o começo apaga e recria tudo (CUIDADO: apaga os dados).
--
-- Ideia geral (em português simples):
--   * profiles  = quem é cada pessoa (doador, receptor ou admin) e se foi aprovada.
--   * doacoes   = o que foi doado (alimento, kg, validade, bairro, horário). Todo mundo
--                 que pode ver a doação vê o BAIRRO, nunca o endereço.
--   * doacao_endereco = o endereço completo de retirada, separado, para só o doador,
--                 o receptor que reservou e o admin conseguirem ler.
--   * reservas  = qual receptor reservou qual doação.
--   * Row Level Security (RLS) = regras que o PRÓPRIO BANCO aplica em cada linha.
--     Mesmo que alguém mexa no JavaScript do site, o banco recusa o que não pode.
--   * Mudanças de situação (reservar, confirmar retirada, aprovar receptor) só
--     acontecem por funções do banco que conferem as regras antes de mudar.
-- =========================================================

-- ---------- 0. Recomeçar do zero ----------
drop trigger if exists ao_criar_usuario on auth.users;
drop function if exists public.criar_perfil_novo_usuario() cascade;
drop function if exists public.criar_doacao(text, text, numeric, date, text, text, text, text) cascade;
drop function if exists public.reservar_doacao(bigint) cascade;
drop function if exists public.confirmar_retirada(bigint) cascade;
drop function if exists public.aprovar_receptor(uuid, boolean) cascade;
drop function if exists public.validade_futura() cascade;
drop function if exists public.hoje_sp() cascade;
drop function if exists public.e_admin() cascade;
drop function if exists public.e_receptor_aprovado() cascade;
drop function if exists public.e_doador() cascade;
drop function if exists public.sou_doador_da(bigint) cascade;
drop function if exists public.sou_doador_da_disponivel(bigint) cascade;
drop function if exists public.reservei(bigint) cascade;
drop table if exists public.reservas cascade;
drop table if exists public.doacao_endereco cascade;
drop table if exists public.doacoes cascade;
drop table if exists public.profiles cascade;

-- ---------- 1. Tabelas e regras de formato (CHECK) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  perfil text not null default 'doador' check (perfil in ('doador', 'receptor', 'admin')),
  nome text not null check (char_length(nome) between 2 and 60),
  organizacao text check (organizacao is null or char_length(organizacao) <= 80),
  aprovado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.doacoes (
  id bigint generated always as identity primary key,
  doador_id uuid not null references public.profiles (id) on delete cascade,
  alimento text not null check (char_length(alimento) between 2 and 80),
  categoria text not null check (categoria in ('hortifruti', 'padaria', 'refeicao', 'nao_perecivel', 'laticinios', 'outros')),
  quantidade_kg numeric(7, 2) not null check (quantidade_kg > 0 and quantidade_kg <= 1000),
  validade date not null,
  bairro text not null check (char_length(bairro) between 2 and 60),
  horario_retirada text not null check (char_length(horario_retirada) between 2 and 80),
  observacoes text check (observacoes is null or char_length(observacoes) <= 300),
  status text not null default 'disponivel' check (status in ('disponivel', 'reservada', 'retirada')),
  criado_em timestamptz not null default now(),
  reservada_em timestamptz,
  retirada_em timestamptz
);
create index doacoes_doador_idx on public.doacoes (doador_id);
create index doacoes_status_idx on public.doacoes (status, validade);

create table public.doacao_endereco (
  doacao_id bigint primary key references public.doacoes (id) on delete cascade,
  endereco text not null check (char_length(endereco) between 5 and 160)
);

create table public.reservas (
  id bigint generated always as identity primary key,
  doacao_id bigint not null unique references public.doacoes (id) on delete cascade, -- 1 reserva por doação
  receptor_id uuid not null references public.profiles (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index reservas_receptor_idx on public.reservas (receptor_id);

-- "Hoje" no horário de Guarulhos (o servidor do Supabase usa UTC: depois das 21h já seria amanhã)
create function public.hoje_sp() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Validade no passado nunca entra numa doação nova (nem alterada)
create function public.validade_futura() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.validade < public.hoje_sp() then
    raise exception 'A validade precisa ser hoje ou depois.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger doacoes_validade_futura
  before insert or update of validade on public.doacoes
  for each row execute function public.validade_futura();

-- ---------- 2. Funções de apoio (quem é quem) ----------
-- "security definer" = roda com permissão do dono do banco, só para LER o próprio perfil.
create function public.e_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'admin');
$$;
create function public.e_doador() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'doador');
$$;
create function public.e_receptor_aprovado() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'receptor' and aprovado);
$$;

-- Checagens entre tabelas (evitam "recursão infinita" entre as regras de doacoes e reservas)
create function public.sou_doador_da(p_doacao bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.doacoes where id = p_doacao and doador_id = auth.uid());
$$;
create function public.sou_doador_da_disponivel(p_doacao bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.doacoes where id = p_doacao and doador_id = auth.uid() and status = 'disponivel');
$$;
create function public.reservei(p_doacao bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.reservas where doacao_id = p_doacao and receptor_id = auth.uid());
$$;

-- ---------- 3. Perfil criado sozinho no cadastro ----------
-- Quem se cadastra escolhe "doador" ou "receptor". NINGUÉM vira admin pelo cadastro:
-- se alguém mandar perfil = 'admin', vira 'doador'. Receptor começa NÃO aprovado.
create function public.criar_perfil_novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_perfil text := case when new.raw_user_meta_data ->> 'perfil' = 'receptor' then 'receptor' else 'doador' end;
  v_nome text := coalesce(nullif(btrim(left(new.raw_user_meta_data ->> 'nome', 60)), ''), 'Sem nome');
  v_org text := nullif(btrim(left(new.raw_user_meta_data ->> 'organizacao', 80)), '');
begin
  if char_length(v_nome) < 2 then v_nome := 'Sem nome'; end if;
  insert into public.profiles (id, perfil, nome, organizacao, aprovado)
  values (new.id, v_perfil, v_nome, v_org, v_perfil = 'doador');
  return new;
end;
$$;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ---------- 4. Ações (só por estas funções, que conferem as regras) ----------
-- Criar doação: só doador. Grava a doação e o endereço juntos.
create function public.criar_doacao(
  p_alimento text, p_categoria text, p_quantidade_kg numeric, p_validade date,
  p_bairro text, p_endereco text, p_horario text, p_observacoes text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  if not public.e_doador() then
    raise exception 'Só doadores podem criar doações.' using errcode = '42501';
  end if;
  insert into public.doacoes (doador_id, alimento, categoria, quantidade_kg, validade, bairro, horario_retirada, observacoes)
  values (auth.uid(), btrim(p_alimento), p_categoria, p_quantidade_kg, p_validade, btrim(p_bairro), btrim(p_horario), nullif(btrim(p_observacoes), ''))
  returning id into v_id;
  insert into public.doacao_endereco (doacao_id, endereco) values (v_id, btrim(p_endereco));
  return v_id;
end;
$$;

-- Reservar: só receptor APROVADO, só doação disponível e dentro da validade.
create function public.reservar_doacao(p_doacao bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.doacoes%rowtype;
begin
  if not public.e_receptor_aprovado() then
    raise exception 'Só receptores aprovados podem reservar.' using errcode = '42501';
  end if;
  select * into v from public.doacoes where id = p_doacao for update; -- trava a linha: dois receptores não reservam a mesma
  if not found then raise exception 'Doação não encontrada.' using errcode = 'P0002'; end if;
  if v.status <> 'disponivel' then raise exception 'Esta doação não está mais disponível.' using errcode = '42501'; end if;
  if v.validade < public.hoje_sp() then raise exception 'Esta doação passou da validade.' using errcode = '42501'; end if;
  insert into public.reservas (doacao_id, receptor_id) values (p_doacao, auth.uid());
  update public.doacoes set status = 'reservada', reservada_em = now() where id = p_doacao;
end;
$$;

-- Confirmar retirada: só o DOADOR daquela doação, só se estiver reservada.
create function public.confirmar_retirada(p_doacao bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.doacoes%rowtype;
begin
  select * into v from public.doacoes where id = p_doacao for update;
  if not found or v.doador_id <> auth.uid() then
    raise exception 'Só o doador desta doação pode confirmar a retirada.' using errcode = '42501';
  end if;
  if v.status <> 'reservada' then raise exception 'A doação precisa estar reservada.' using errcode = '42501'; end if;
  update public.doacoes set status = 'retirada', retirada_em = now() where id = p_doacao;
end;
$$;

-- Aprovar (ou desaprovar) receptor: só admin.
create function public.aprovar_receptor(p_usuario uuid, p_aprovado boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.e_admin() then
    raise exception 'Só o admin pode aprovar receptores.' using errcode = '42501';
  end if;
  update public.profiles set aprovado = p_aprovado where id = p_usuario and perfil = 'receptor';
  if not found then raise exception 'Receptor não encontrado.' using errcode = 'P0002'; end if;
end;
$$;

-- ---------- 5. Permissões básicas (o que cada tipo de usuário pode tentar) ----------
-- Visitante sem login (anon): nada. Usuário logado (authenticated): só o que está abaixo.
revoke all on public.profiles, public.doacoes, public.doacao_endereco, public.reservas from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nome, organizacao) on public.profiles to authenticated;  -- perfil e aprovado NÃO
grant select, delete on public.doacoes to authenticated;
grant update (alimento, categoria, quantidade_kg, validade, bairro, horario_retirada, observacoes) on public.doacoes to authenticated; -- status NÃO
grant select on public.doacao_endereco to authenticated;
grant update (endereco) on public.doacao_endereco to authenticated;
grant select on public.reservas to authenticated;

revoke all on function public.criar_doacao(text, text, numeric, date, text, text, text, text) from public, anon;
revoke all on function public.reservar_doacao(bigint) from public, anon;
revoke all on function public.confirmar_retirada(bigint) from public, anon;
revoke all on function public.aprovar_receptor(uuid, boolean) from public, anon;
revoke all on function public.e_admin() from public, anon;
revoke all on function public.hoje_sp() from public, anon;
revoke all on function public.e_doador() from public, anon;
revoke all on function public.e_receptor_aprovado() from public, anon;
revoke all on function public.sou_doador_da(bigint) from public, anon;
revoke all on function public.sou_doador_da_disponivel(bigint) from public, anon;
revoke all on function public.reservei(bigint) from public, anon;
grant execute on function public.criar_doacao(text, text, numeric, date, text, text, text, text) to authenticated;
grant execute on function public.reservar_doacao(bigint) to authenticated;
grant execute on function public.confirmar_retirada(bigint) to authenticated;
grant execute on function public.aprovar_receptor(uuid, boolean) to authenticated;
grant execute on function public.e_admin() to authenticated;
grant execute on function public.hoje_sp() to authenticated;
grant execute on function public.e_doador() to authenticated;
grant execute on function public.e_receptor_aprovado() to authenticated;
grant execute on function public.sou_doador_da(bigint) to authenticated;
grant execute on function public.sou_doador_da_disponivel(bigint) to authenticated;
grant execute on function public.reservei(bigint) to authenticated;

-- ---------- 6. Row Level Security (o banco confere cada linha) ----------
alter table public.profiles enable row level security;
alter table public.doacoes enable row level security;
alter table public.doacao_endereco enable row level security;
alter table public.reservas enable row level security;

-- PROFILES
-- Impede: alguém ler nome/organização de outras pessoas (só o próprio perfil; admin vê todos).
create policy "perfil: ver o proprio ou admin ve todos" on public.profiles
  for select to authenticated using (id = auth.uid() or public.e_admin());
-- Impede: editar o perfil de outra pessoa. (Mudar "perfil" e "aprovado" já é bloqueado na seção 5.)
create policy "perfil: editar so o proprio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- DOACOES
-- Impede: doador ver doações de outros doadores.
create policy "doacao: doador ve as proprias" on public.doacoes
  for select to authenticated using (doador_id = auth.uid());
-- Impede: receptor ver doações reservadas por outros ou vencidas; receptor não aprovado não vê nada.
create policy "doacao: receptor aprovado ve disponiveis e nao vencidas" on public.doacoes
  for select to authenticated using (public.e_receptor_aprovado() and status = 'disponivel' and validade >= public.hoje_sp());
-- Receptor continua vendo o que ELE reservou (para buscar).
create policy "doacao: receptor ve o que reservou" on public.doacoes
  for select to authenticated using (public.reservei(id));
create policy "doacao: admin ve todas" on public.doacoes
  for select to authenticated using (public.e_admin());
-- Impede: editar doação de outra pessoa, ou editar depois de reservada.
create policy "doacao: doador edita a propria enquanto disponivel" on public.doacoes
  for update to authenticated using (doador_id = auth.uid() and status = 'disponivel') with check (doador_id = auth.uid());
-- Impede: apagar doação de outra pessoa, ou apagar depois de reservada.
create policy "doacao: doador apaga a propria enquanto disponivel" on public.doacoes
  for delete to authenticated using (doador_id = auth.uid() and status = 'disponivel');
create policy "doacao: admin apaga (moderacao)" on public.doacoes
  for delete to authenticated using (public.e_admin());

-- ENDERECO (privado)
-- Impede: qualquer pessoa ver o endereço antes da reserva. Só doador, receptor que reservou e admin.
create policy "endereco: so doador, quem reservou e admin" on public.doacao_endereco
  for select to authenticated using (
    public.sou_doador_da(doacao_id) or public.reservei(doacao_id) or public.e_admin()
  );
create policy "endereco: doador edita o proprio enquanto disponivel" on public.doacao_endereco
  for update to authenticated using (public.sou_doador_da_disponivel(doacao_id));

-- RESERVAS
-- Impede: ver reservas dos outros. Vê quem reservou, o doador daquela doação e o admin.
create policy "reserva: receptor, doador da doacao e admin" on public.reservas
  for select to authenticated using (
    receptor_id = auth.uid() or public.sou_doador_da(doacao_id) or public.e_admin()
  );
-- (Sem políticas de insert/update/delete: reservar só pela função reservar_doacao.)

-- =========================================================
-- DEPOIS DE RODAR: criar o admin (uma vez só)
-- 1) Cadastre-se pelo site como doador, com o e-mail do admin.
-- 2) Rode isto aqui no SQL Editor, trocando o e-mail:
--    update public.profiles set perfil = 'admin', aprovado = true
--    where id = (select id from auth.users where email = 'EMAIL-DO-ADMIN@exemplo.com');
-- =========================================================
