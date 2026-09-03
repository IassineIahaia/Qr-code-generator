-- =============================================================
-- QR Generator Pro — 0006 agregações de analytics (Fase 7)
-- Rode no SQL Editor do Supabase, depois de 0005.
-- =============================================================
--
-- Por que em SQL e não em TypeScript: o PostgREST não faz `group by`, então
-- a alternativa seria trazer todas as linhas de `scans` para o Node e contar
-- lá. Funciona com cem leituras e derrete com cem mil — e é justamente o
-- código que dá certo em desenvolvimento e falha quando o produto pega.
--
-- Ambas as funções são `security invoker`: rodam como quem chamou, então o
-- RLS de `scans` e de `qr_codes` continua valendo. Um usuário não consegue
-- ler os números de outro passando um `qr_id` alheio — a política devolve
-- zero linhas e a função devolve zeros.
--
-- O fuso é fixado em `America/Sao_Paulo` na hora de agrupar. Sem isso, "o
-- dia 3" seria o dia em UTC: uma leitura às 22h de terça em Brasília cairia
-- na quarta, e o gráfico contaria a noite de campanha no dia seguinte.

-- ---------- analytics de um código ----------
create or replace function public.qr_analytics(
  p_qr_id uuid,
  p_from  timestamptz,
  p_to    timestamptz default now()
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with
  -- A janela anterior tem exatamente a mesma duração, encostada na atual.
  -- É o que dá sentido ao "+14% vs. período anterior": comparar 30 dias com
  -- 30 dias, e não com "o mês passado" (que tem 28, 30 ou 31).
  parametros as (
    select p_from as inicio, p_to as fim, (p_to - p_from) as duracao
  ),
  janela as (
    select s.* from public.scans s, parametros p
     where s.qr_id = p_qr_id
       and s.created_at >= p.inicio
       and s.created_at <  p.fim
  ),
  entregues as (select * from janela where outcome = 'redirected'),
  anterior as (
    select s.* from public.scans s, parametros p
     where s.qr_id = p_qr_id
       and s.created_at >= p.inicio - p.duracao
       and s.created_at <  p.inicio
       and s.outcome = 'redirected'
  ),

  dias as (
    select to_char(d, 'YYYY-MM-DD')                  as dia,
           count(e.id)                               as total,
           count(e.id) filter (where e.is_unique)    as unicos
      from parametros p,
           generate_series(
             date_trunc('day', p.inicio at time zone 'America/Sao_Paulo'),
             date_trunc('day', p.fim    at time zone 'America/Sao_Paulo'),
             interval '1 day'
           ) d
      left join entregues e
        on (e.created_at at time zone 'America/Sao_Paulo') >= d
       and (e.created_at at time zone 'America/Sao_Paulo') <  d + interval '1 day'
     group by d
     order by d
  ),

  horas as (
    select h                as hora,
           count(e.id)      as total
      from generate_series(0, 23) h
      left join entregues e
        on extract(hour from (e.created_at at time zone 'America/Sao_Paulo')) = h
     group by h
     order by h
  ),

  -- `limit 8` em toda quebra: o teto de cores que um gráfico categórico
  -- suporta. O que sobra vira "outros", somado do lado do TypeScript a
  -- partir do total — não é jogado fora.
  aparelhos as (
    select coalesce(nullif(device_type, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  sistemas as (
    select coalesce(nullif(os, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  navegadores as (
    select coalesce(nullif(browser, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  paises as (
    select coalesce(nullif(country, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  cidades as (
    select coalesce(nullif(city, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  origens as (
    select coalesce(nullif(referrer, ''), 'direto') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  -- Os bloqueios contam separado: são a resposta para "por que as leituras
  -- caíram?" — e quase sempre a resposta é uma regra que o dono mesmo pôs.
  desfechos as (
    select outcome as chave, count(*) as total
      from janela where outcome <> 'redirected' group by 1 order by 2 desc
  )

select jsonb_build_object(
  'total',       (select count(*) from entregues),
  'unicos',      (select count(*) from entregues where is_unique),
  'bloqueados',  (select count(*) from janela where outcome <> 'redirected'),
  'total_anterior',  (select count(*) from anterior),
  'unicos_anterior', (select count(*) from anterior where is_unique),
  'serie',       (select coalesce(jsonb_agg(to_jsonb(dias)),        '[]'::jsonb) from dias),
  'horas',       (select coalesce(jsonb_agg(to_jsonb(horas)),       '[]'::jsonb) from horas),
  'aparelhos',   (select coalesce(jsonb_agg(to_jsonb(aparelhos)),   '[]'::jsonb) from aparelhos),
  'sistemas',    (select coalesce(jsonb_agg(to_jsonb(sistemas)),    '[]'::jsonb) from sistemas),
  'navegadores', (select coalesce(jsonb_agg(to_jsonb(navegadores)), '[]'::jsonb) from navegadores),
  'paises',      (select coalesce(jsonb_agg(to_jsonb(paises)),      '[]'::jsonb) from paises),
  'cidades',     (select coalesce(jsonb_agg(to_jsonb(cidades)),     '[]'::jsonb) from cidades),
  'origens',     (select coalesce(jsonb_agg(to_jsonb(origens)),     '[]'::jsonb) from origens),
  'desfechos',   (select coalesce(jsonb_agg(to_jsonb(desfechos)),   '[]'::jsonb) from desfechos)
);
$$;

comment on function public.qr_analytics(uuid, timestamptz, timestamptz) is
  'Todas as quebras de um QR numa janela, em um jsonb. Security invoker: o RLS decide o que a pessoa vê.';

-- ---------- analytics da conta inteira ----------
-- O painel precisa dos mesmos números somados sobre todos os códigos do
-- usuário, mais o ranking dos que mais rodaram. As duas funções existem
-- separadas porque as perguntas são diferentes: uma é "como foi este
-- código", a outra é "como foi o mês".
create or replace function public.account_analytics(
  p_from timestamptz,
  p_to   timestamptz default now()
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with
  parametros as (
    select p_from as inicio, p_to as fim, (p_to - p_from) as duracao
  ),
  -- O join com `qr_codes` não é enfeite nem filtro de segurança (o RLS de
  -- `scans` já limita ao dono): é o que dá o nome do código no ranking.
  janela as (
    select s.*, q.name as qr_nome, q.slug as qr_slug
      from public.scans s
      join public.qr_codes q on q.id = s.qr_id,
           parametros p
     where s.created_at >= p.inicio
       and s.created_at <  p.fim
  ),
  entregues as (select * from janela where outcome = 'redirected'),
  anterior as (
    select s.* from public.scans s, parametros p
     where s.created_at >= p.inicio - p.duracao
       and s.created_at <  p.inicio
       and s.outcome = 'redirected'
  ),

  dias as (
    select to_char(d, 'YYYY-MM-DD')               as dia,
           count(e.id)                            as total,
           count(e.id) filter (where e.is_unique) as unicos
      from parametros p,
           generate_series(
             date_trunc('day', p.inicio at time zone 'America/Sao_Paulo'),
             date_trunc('day', p.fim    at time zone 'America/Sao_Paulo'),
             interval '1 day'
           ) d
      left join entregues e
        on (e.created_at at time zone 'America/Sao_Paulo') >= d
       and (e.created_at at time zone 'America/Sao_Paulo') <  d + interval '1 day'
     group by d
     order by d
  ),

  top_codigos as (
    select qr_id, qr_nome as nome, qr_slug as slug,
           count(*)                            as total,
           count(*) filter (where is_unique)   as unicos
      from entregues
     group by qr_id, qr_nome, qr_slug
     order by 4 desc
     limit 5
  ),

  aparelhos as (
    select coalesce(nullif(device_type, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  ),
  paises as (
    select coalesce(nullif(country, ''), 'desconhecido') as chave, count(*) as total
      from entregues group by 1 order by 2 desc, 1 limit 8
  )

select jsonb_build_object(
  'total',           (select count(*) from entregues),
  'unicos',          (select count(*) from entregues where is_unique),
  'bloqueados',      (select count(*) from janela where outcome <> 'redirected'),
  'total_anterior',  (select count(*) from anterior),
  'unicos_anterior', (select count(*) from anterior where is_unique),
  'serie',           (select coalesce(jsonb_agg(to_jsonb(dias)),        '[]'::jsonb) from dias),
  'top_codigos',     (select coalesce(jsonb_agg(to_jsonb(top_codigos)), '[]'::jsonb) from top_codigos),
  'aparelhos',       (select coalesce(jsonb_agg(to_jsonb(aparelhos)),   '[]'::jsonb) from aparelhos),
  'paises',          (select coalesce(jsonb_agg(to_jsonb(paises)),      '[]'::jsonb) from paises)
);
$$;

comment on function public.account_analytics(timestamptz, timestamptz) is
  'Os mesmos números da conta inteira, para o painel. Security invoker.';

-- Quem não está logado não tem analytics para ver.
revoke all on function public.qr_analytics(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.account_analytics(timestamptz, timestamptz) from public, anon;
grant execute on function public.qr_analytics(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.account_analytics(timestamptz, timestamptz) to authenticated;

-- ---------- índice que estas agregações pedem ----------
-- `scans_qr_time_idx` (0001) atende a varredura por código e janela. Falta o
-- caminho da conta inteira, que varre por tempo e junta com `qr_codes`.
create index if not exists scans_qr_created_outcome_idx
  on public.scans (created_at desc, qr_id) include (outcome, is_unique);
