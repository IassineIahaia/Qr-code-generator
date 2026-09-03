-- =============================================================
-- QR Generator Pro — 0004 slug: unicidade que enxerga além do RLS
-- =============================================================
--
-- Problema que esta migration corrige: `generate_qr_slug` (0002) consulta
-- `public.qr_codes` como o usuário que a chamou. Com o RLS ligado, esse
-- usuário só enxerga os próprios códigos — então a checagem "já existe?"
-- sempre passava, e a colisão só aparecia no índice único, na hora do insert.
--
-- As duas funções abaixo rodam com os privilégios do dono (`security definer`)
-- e por isso enxergam a tabela inteira. Elas devolvem apenas um booleano ou um
-- slug novo: nenhum dado de outro usuário vaza por aqui.

-- ---------- o slug está livre? ----------
create or replace function public.slug_available(candidate text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select candidate ~ '^[A-Za-z0-9_-]{3,40}$'
     and not exists (select 1 from public.qr_codes where slug = candidate);
$$;

comment on function public.slug_available(text) is
  'Diz se um slug pode ser usado. Security definer para enxergar além do RLS.';

-- ---------- sorteio, agora enxergando a tabela toda ----------
create or replace function public.generate_qr_slug(size integer default 6)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Alfabeto sem 0/O/1/l/I: evita erro de quem digita o link à mão.
  alphabet   text := '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate  text;
  i          integer;
  tentativas integer := 0;
begin
  loop
    candidate := '';
    for i in 1..size loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;

    exit when not exists (select 1 from public.qr_codes where slug = candidate);

    -- Se o espaço de nomes deste tamanho estiver saturado, cresce em vez de
    -- girar para sempre.
    tentativas := tentativas + 1;
    if tentativas % 8 = 0 then
      size := least(size + 1, 40);
    end if;
  end loop;

  return candidate;
end;
$$;

-- `anon` não cria QR Code; só quem está logado precisa destas funções.
revoke all on function public.slug_available(text) from public, anon;
revoke all on function public.generate_qr_slug(integer) from public, anon;
grant execute on function public.slug_available(text) to authenticated;
grant execute on function public.generate_qr_slug(integer) to authenticated;
