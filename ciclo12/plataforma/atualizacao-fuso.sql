-- =========================================================
-- Ciclo Prato — ATUALIZAÇÃO de fuso horário (07/10/2026)
-- Rode UMA vez no Supabase (SQL Editor > New query > colar > Run).
-- NÃO apaga nada: as contas e doações continuam.
-- O que muda: "hoje" passa a ser o dia em Guarulhos (America/Sao_Paulo), não o dia em UTC.
-- Antes, entre 21h e meia-noite, o banco achava que já era o dia seguinte.
-- (Quem rodar o banco.sql novo do zero já recebe esta correção; este arquivo é só para quem já rodou o antigo.)
-- =========================================================

create or replace function public.hoje_sp() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;
revoke all on function public.hoje_sp() from public, anon;
grant execute on function public.hoje_sp() to authenticated;

create or replace function public.validade_futura() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.validade < public.hoje_sp() then
    raise exception 'A validade precisa ser hoje ou depois.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.reservar_doacao(p_doacao bigint) returns void
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

drop policy if exists "doacao: receptor aprovado ve disponiveis e nao vencidas" on public.doacoes;
create policy "doacao: receptor aprovado ve disponiveis e nao vencidas" on public.doacoes
  for select to authenticated using (public.e_receptor_aprovado() and status = 'disponivel' and validade >= public.hoje_sp());
