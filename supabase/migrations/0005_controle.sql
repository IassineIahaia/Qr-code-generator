-- =============================================================
-- QR Generator Pro — 0005 controle do QR (Fase 5) e redirect (Fase 6)
-- Rode no SQL Editor do Supabase, depois de 0004.
-- =============================================================

-- ---------- histórico: as ações da Fase 5 ----------
-- O `check` de 0001 não previa "mexeram nas regras" nem as duas metades da
-- senha. Sem estas entradas, `registrarEvento` falharia calado (o insert do
-- histórico é deliberadamente tolerante a erro) e o item 5.8 nasceria cego
-- justamente para as mudanças mais delicadas.
alter table public.qr_events drop constraint if exists qr_events_action_check;

alter table public.qr_events add constraint qr_events_action_check
  check (action in (
    'created', 'updated', 'destination_changed', 'activated', 'paused',
    'scheduled', 'expired', 'limit_reached', 'design_changed', 'moved',
    'restored', 'rules_changed', 'password_set', 'password_removed'
  ));

-- ---------- janela coerente ----------
-- Um código que expira antes de começar não é um estado a suportar: é um
-- engano de digitação. Barrar no banco evita que a lista mostre "expirado"
-- para algo que nunca esteve no ar.
alter table public.qr_codes drop constraint if exists janela_coerente;

alter table public.qr_codes add constraint janela_coerente
  check (active_from is null or expires_at is null or expires_at > active_from);

-- Nota sobre o slug: a busca do redirect é exata, e continua sendo. Tornar
-- `/r/Ab3Kx9` e `/r/ab3kx9` o mesmo endereço parece gentileza, mas o
-- alfabeto do slug usa as duas caixas — as duas formas são slugs válidos e
-- *diferentes*, que podem pertencer a donos diferentes. Uma busca por
-- `lower(slug)` acharia dois códigos e teria que escolher um. O índice único
-- de `slug` já atende a busca exata.

-- ---------- leituras bloqueadas também contam para o dono ----------
-- `handle_scan_insert` (0002) só mexe nos contadores quando `outcome` é
-- 'redirected', e está certo: um bloqueio não é uma leitura entregue. Mas o
-- dono precisa ver que houve tentativa — daí este índice, que é o que a
-- Fase 7 vai usar para separar entregue de bloqueado.
create index if not exists scans_outcome_idx
  on public.scans (qr_id, outcome, created_at desc);

-- ---------- limpeza de agendamentos vencidos ----------
-- `qr_effective_status` já responde "expirado" pelo relógio, então nada
-- aqui é obrigatório para o redirect funcionar. Esta função existe para o
-- histórico: sem ela, o item 5.8 nunca registraria "expirou", porque
-- ninguém *fez* a expiração acontecer. Chame por cron (pg_cron) quando
-- quiser essas linhas no diário.
create or replace function public.registrar_expiracoes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  registrados integer := 0;
begin
  with vencidos as (
    select q.id
      from public.qr_codes q
     where q.status = 'active'
       and (
         (q.expires_at is not null and q.expires_at <= now())
         or (q.scan_limit is not null and q.scan_count >= q.scan_limit)
       )
       -- só o que ainda não foi anotado desde a última mudança
       and not exists (
         select 1 from public.qr_events e
          where e.qr_id = q.id
            and e.action in ('expired', 'limit_reached')
            and e.created_at > q.updated_at
       )
  )
  insert into public.qr_events (qr_id, user_id, action, meta)
  select v.id,
         null,
         case
           when q.expires_at is not null and q.expires_at <= now() then 'expired'
           else 'limit_reached'
         end,
         jsonb_build_object('automatico', true)
    from vencidos v
    join public.qr_codes q on q.id = v.id;

  get diagnostics registrados = row_count;
  return registrados;
end;
$$;

revoke all on function public.registrar_expiracoes() from public, anon, authenticated;
