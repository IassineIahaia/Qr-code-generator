-- =============================================================
-- QR Generator Pro — 0003 Row Level Security
-- Regra geral: cada usuário só enxerga e altera o que é dele.
-- A escrita em `scans` fica fora do alcance do browser: só o
-- servidor, com a chave service_role, registra leituras.
-- =============================================================

alter table public.profiles  enable row level security;
alter table public.folders   enable row level security;
alter table public.qr_codes  enable row level security;
alter table public.scans     enable row level security;
alter table public.qr_events enable row level security;

-- ---------- profiles ----------
drop policy if exists "perfil visível para o dono" on public.profiles;
create policy "perfil visível para o dono"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "perfil editável pelo dono" on public.profiles;
create policy "perfil editável pelo dono"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------- folders ----------
drop policy if exists "pastas do dono" on public.folders;
create policy "pastas do dono"
  on public.folders for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- qr_codes ----------
drop policy if exists "códigos do dono" on public.qr_codes;
create policy "códigos do dono"
  on public.qr_codes for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- scans ----------
-- Leitura: só o dono do QR. Escrita: ninguém pelo browser.
drop policy if exists "leituras dos códigos do dono" on public.scans;
create policy "leituras dos códigos do dono"
  on public.scans for select
  using (
    exists (
      select 1 from public.qr_codes q
       where q.id = scans.qr_id
         and q.user_id = (select auth.uid())
    )
  );

-- ---------- qr_events ----------
drop policy if exists "histórico dos códigos do dono" on public.qr_events;
create policy "histórico dos códigos do dono"
  on public.qr_events for select
  using (
    exists (
      select 1 from public.qr_codes q
       where q.id = qr_events.qr_id
         and q.user_id = (select auth.uid())
    )
  );

drop policy if exists "histórico gravado pelo dono" on public.qr_events;
create policy "histórico gravado pelo dono"
  on public.qr_events for insert
  with check (
    exists (
      select 1 from public.qr_codes q
       where q.id = qr_events.qr_id
         and q.user_id = (select auth.uid())
    )
  );
