-- Conferência do item 1.10: rode no SQL Editor do Supabase DEPOIS das
-- migrations 0001, 0002 e 0003. Só faz leitura — não altera nada.
--
-- São DUAS consultas. O SQL Editor mostra só o resultado da última
-- instrução, então rode uma de cada vez (selecione o bloco e Ctrl+Enter).
-- Qualquer linha com situacao <> 'ok' aponta uma migration que não rodou.

-- ===================== CONSULTA 1: estrutura =====================
with
  tabelas as (
    select
      'tabela ' || t.tablename as item,
      case
        when not c.relrowsecurity then 'RLS DESLIGADO'
        when (
          select count(*) from pg_policies p
          where p.schemaname = 'public' and p.tablename = t.tablename
        ) = 0 then 'SEM POLITICAS'
        else 'ok'
      end as situacao,
      (
        select count(*)::text || ' politica(s)' from pg_policies p
        where p.schemaname = 'public' and p.tablename = t.tablename
      ) as detalhe
    from pg_tables t
    join pg_class c
      on c.relname = t.tablename
     and c.relnamespace = 'public'::regnamespace
    where t.schemaname = 'public'
      and t.tablename in ('profiles','folders','qr_codes','scans','qr_events')
  ),
  faltando_tabela as (
    select 'tabela ' || nome as item, 'FALTANDO' as situacao, '-' as detalhe
    from unnest(array['profiles','folders','qr_codes','scans','qr_events']) as nome
    where not exists (
      select 1 from pg_tables
      where schemaname = 'public' and tablename = nome
    )
  ),
  funcoes as (
    select
      'funcao ' || split_part(assinatura, '(', 1) as item,
      case when to_regprocedure(assinatura) is null then 'FALTANDO' else 'ok' end as situacao,
      '-' as detalhe
    from unnest(array[
      'public.touch_updated_at()',
      'public.handle_new_user()',
      'public.handle_scan_insert()'
    ]) as assinatura
  ),
  funcoes_por_nome as (
    select
      'funcao ' || nome as item,
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = nome
      ) then 'ok' else 'FALTANDO' end as situacao,
      '-' as detalhe
    from unnest(array[
      'qr_effective_status','scan_series','generate_qr_slug',
      -- 0004 e 0005
      'slug_available','registrar_expiracoes',
      -- 0006 (Fase 7)
      'qr_analytics','account_analytics'
    ]) as nome
  ),
  triggers as (
    select
      'trigger ' || nome as item,
      case when exists (
        select 1 from pg_trigger where not tgisinternal and tgname = nome
      ) then 'ok' else 'FALTANDO' end as situacao,
      '-' as detalhe
    from unnest(array[
      'on_auth_user_created','scans_after_insert',
      'profiles_touch','folders_touch','qr_codes_touch'
    ]) as nome
  ),
  indices as (
    select
      'indice ' || nome as item,
      case when to_regclass('public.' || nome) is null then 'FALTANDO' else 'ok' end as situacao,
      '-' as detalhe
    from unnest(array[
      'qr_codes_user_idx','qr_codes_folder_idx','qr_codes_status_idx',
      'qr_codes_tags_idx','qr_codes_name_idx',
      'scans_qr_time_idx','scans_time_idx','scans_visitor_idx',
      'folders_user_idx','qr_events_qr_idx',
      'scans_qr_created_outcome_idx'
    ]) as nome
  ),
  slug_unico as (
    select
      'slug unico' as item,
      case when exists (
        select 1 from pg_indexes
        where schemaname = 'public' and tablename = 'qr_codes'
          and indexdef ilike '%unique%' and indexdef ilike '%slug%'
      ) then 'ok' else 'FALTANDO' end as situacao,
      '-' as detalhe
  ),
  gerador_slug as (
    select
      'gerador de slug' as item,
      case when count(distinct s) = 50 then 'ok' else 'COLISAO' end as situacao,
      count(distinct s)::text || '/50 distintos' as detalhe
    from (
      select public.generate_qr_slug() as s from generate_series(1, 50)
    ) g
  )
select * from tabelas
union all select * from faltando_tabela
union all select * from funcoes
union all select * from funcoes_por_nome
union all select * from triggers
union all select * from indices
union all select * from slug_unico
union all select * from gerador_slug
order by situacao desc, item;
-- Esperado: 33 linhas, todas com situacao = 'ok'.
-- `qr_analytics`, `account_analytics` e `scans_qr_created_outcome_idx` só
-- aparecem depois da migration `0006_analytics.sql`.


-- ============ CONSULTA 2: isolamento real do RLS ============
-- No SQL Editor você roda como superusuário, que ignora RLS. Forçamos o
-- papel 'anon' para ver o que um visitante não autenticado enxergaria.
-- Rode este bloco separado (selecione as linhas abaixo e Ctrl+Enter).

set local role anon;
select
  (select count(*) from public.qr_codes) as qr_para_anon,
  (select count(*) from public.scans)    as scans_para_anon,
  (select count(*) from public.profiles) as perfis_para_anon,
  (select count(*) from public.folders)  as pastas_para_anon;
-- Esperado: 0, 0, 0, 0. Qualquer número acima de zero é um furo no RLS.
