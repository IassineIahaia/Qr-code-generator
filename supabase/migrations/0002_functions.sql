-- =============================================================
-- QR Generator Pro — 0002 funções e gatilhos
-- =============================================================

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists folders_touch on public.folders;
create trigger folders_touch before update on public.folders
  for each row execute function public.touch_updated_at();

drop trigger if exists qr_codes_touch on public.qr_codes;
create trigger qr_codes_touch before update on public.qr_codes
  for each row execute function public.touch_updated_at();

-- ---------- perfil criado junto com o usuário ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- slug curto e único ----------
-- Alfabeto sem 0/O/1/l/I: evita erro de quem digita o link à mão.
create or replace function public.generate_qr_slug(size integer default 6)
returns text
language plpgsql
as $$
declare
  alphabet  text := '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate text;
  i         integer;
begin
  loop
    candidate := '';
    for i in 1..size loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.qr_codes where slug = candidate);
  end loop;
  return candidate;
end;
$$;

-- ---------- estado efetivo do QR ----------
-- O status gravado é só a intenção do dono. O estado real também depende
-- do relógio e do contador de leituras.
create or replace function public.qr_effective_status(qr public.qr_codes)
returns text
language sql
stable
as $$
  select case
    when qr.status = 'archived' then 'archived'
    when qr.status = 'paused'   then 'paused'
    when qr.expires_at  is not null and qr.expires_at  <= now() then 'expired'
    when qr.active_from is not null and qr.active_from >  now() then 'scheduled'
    when qr.scan_limit  is not null and qr.scan_count  >= qr.scan_limit then 'limit_reached'
    else 'active'
  end;
$$;

-- ---------- contadores após cada leitura ----------
create or replace function public.handle_scan_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.outcome = 'redirected' then
    update public.qr_codes
       set scan_count        = scan_count + 1,
           unique_scan_count = unique_scan_count + (case when new.is_unique then 1 else 0 end),
           last_scan_at      = new.created_at
     where id = new.qr_id;
  end if;
  return new;
end;
$$;

drop trigger if exists scans_after_insert on public.scans;
create trigger scans_after_insert after insert on public.scans
  for each row execute function public.handle_scan_insert();

-- ---------- série diária de leituras (usada nos gráficos) ----------
create or replace function public.scan_series(
  p_qr_id uuid,
  p_from  timestamptz,
  p_to    timestamptz default now()
)
returns table (dia date, total bigint, unicos bigint)
language sql
stable
security invoker
as $$
  select d::date                                        as dia,
         count(s.id)                                    as total,
         count(s.id) filter (where s.is_unique)         as unicos
    from generate_series(date_trunc('day', p_from), date_trunc('day', p_to), interval '1 day') d
    left join public.scans s
      on s.qr_id = p_qr_id
     and s.outcome = 'redirected'
     and s.created_at >= d
     and s.created_at <  d + interval '1 day'
   group by d
   order by d;
$$;
