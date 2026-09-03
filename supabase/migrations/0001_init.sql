-- =============================================================
-- QR Generator Pro — 0001 schema inicial
-- Rode no SQL Editor do Supabase, na ordem dos arquivos.
-- =============================================================

-- ---------- perfis ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados do usuário espelhados de auth.users.';

-- ---------- pastas ----------
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#FF4D00',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists folders_user_idx on public.folders (user_id, created_at desc);

-- ---------- códigos ----------
create table if not exists public.qr_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  folder_id   uuid references public.folders (id) on delete set null,

  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[A-Za-z0-9_-]{3,40}$'),
  is_dynamic  boolean not null default true,

  -- conteúdo
  type        text not null check (type in (
                'url', 'pix', 'whatsapp', 'wifi', 'vcard',
                'email', 'sms', 'text', 'pdf', 'menu', 'appstore', 'video'
              )),
  content     jsonb not null default '{}'::jsonb,   -- payload cru por tipo
  destination text,                                  -- alvo final do redirect (tipos dinâmicos)

  -- aparência (cores, módulos, olhos, logo, moldura, nível de correção)
  design      jsonb not null default '{}'::jsonb,

  -- controle
  status              text not null default 'active'
                        check (status in ('active', 'paused', 'archived')),
  active_from         timestamptz,
  expires_at          timestamptz,
  scan_limit          integer check (scan_limit is null or scan_limit > 0),
  password_hash       text,
  disabled_behavior   text not null default 'default'
                        check (disabled_behavior in ('default', 'message', 'redirect')),
  disabled_message    text,
  disabled_redirect_url text,
  device_rules        jsonb not null default '{}'::jsonb,  -- {"ios": "...", "android": "..."}
  geo_rules           jsonb not null default '{}'::jsonb,  -- {"BR": "...", "PT": "..."}

  -- contadores desnormalizados (leitura barata na listagem)
  scan_count        integer not null default 0,
  unique_scan_count integer not null default 0,
  last_scan_at      timestamptz,

  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- um QR estático não tem como ser redirecionado nem controlado
  constraint dynamic_needs_destination
    check (not is_dynamic or destination is not null or type <> 'url')
);

create index if not exists qr_codes_user_idx    on public.qr_codes (user_id, created_at desc);
create index if not exists qr_codes_folder_idx  on public.qr_codes (folder_id);
create index if not exists qr_codes_status_idx  on public.qr_codes (user_id, status);
create index if not exists qr_codes_tags_idx    on public.qr_codes using gin (tags);
create index if not exists qr_codes_name_idx    on public.qr_codes using gin (to_tsvector('portuguese', name));

-- ---------- leituras ----------
create table if not exists public.scans (
  id           bigint generated always as identity primary key,
  qr_id        uuid not null references public.qr_codes (id) on delete cascade,
  created_at   timestamptz not null default now(),

  is_unique    boolean not null default false,
  visitor_hash text,          -- hash do visitante, para contar scans únicos
  ip_hash      text,          -- IP com hash + sal; nunca guardamos o IP cru

  device_type  text,          -- mobile | tablet | desktop | outro
  os           text,
  browser      text,
  country      text,          -- ISO-2
  city         text,
  referrer     text,
  user_agent   text,

  outcome      text not null default 'redirected'
                 check (outcome in ('redirected', 'blocked_paused', 'blocked_expired',
                                    'blocked_limit', 'blocked_scheduled', 'password_required'))
);

create index if not exists scans_qr_time_idx  on public.scans (qr_id, created_at desc);
create index if not exists scans_time_idx     on public.scans (created_at desc);
create index if not exists scans_visitor_idx  on public.scans (qr_id, visitor_hash);

-- ---------- histórico de alterações ----------
create table if not exists public.qr_events (
  id          bigint generated always as identity primary key,
  qr_id       uuid not null references public.qr_codes (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete set null,
  action      text not null check (action in (
                'created', 'updated', 'destination_changed', 'activated', 'paused',
                'scheduled', 'expired', 'limit_reached', 'design_changed', 'moved', 'restored'
              )),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists qr_events_qr_idx on public.qr_events (qr_id, created_at desc);
