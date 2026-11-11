-- Synchronisation multi-appareils — Volaille chez TALL
-- À exécuter dans Supabase → SQL Editor.
--
-- Principe :
--   * chaque donnée métier appartient à un utilisateur (`user_id`) ;
--   * les politiques RLS garantissent que chacun ne voit que ses données ;
--   * les commandes publiques restent gérées par `supabase/commandes.sql`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profils (facultatif, utile pour l'administration)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  whatsapp text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bandes de production
-- ---------------------------------------------------------------------------
create table if not exists public.bands (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text,
  name text not null,
  strain text,
  arrival_date date,
  initial_count integer not null default 0 check (initial_count >= 0),
  supplier text,
  target_weight_kg numeric(10, 3),
  target_age_days integer default 42,
  chick_unit_cost numeric(12, 2) default 0,
  transport_cost numeric(12, 2) default 0,
  chick_total_cost numeric(12, 2) default 0,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Suivi quotidien par bande
-- ---------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text,
  batch_id text,
  log_date date,
  mortality integer not null default 0 check (mortality >= 0),
  culls integer not null default 0 check (culls >= 0),
  note text,
  feed_starter_kg numeric(10, 2) default 0,
  feed_grower_kg numeric(10, 2) default 0,
  feed_finisher_kg numeric(10, 2) default 0,
  water_liters numeric(10, 2) default 0,
  avg_weight_kg numeric(10, 3),
  feed_cost numeric(12, 2) default 0,
  health_cost numeric(12, 2) default 0,
  other_cost numeric(12, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ventes
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text,
  batch_id text,
  sale_date date,
  client_id text,
  client_name text,
  client_phone text,
  client_address text,
  heads integer not null default 0 check (heads >= 0),
  unit_weight_kg numeric(10, 3) default 0,
  total_weight_kg numeric(12, 3) default 0,
  price_per_kg numeric(12, 2) default 0,
  price_per_head numeric(12, 2) default 0,
  total_amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  payment_method text,
  payment_status text,
  channel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Charges par bande / exploitation
-- ---------------------------------------------------------------------------
create table if not exists public.charges (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id text,
  batch_id text,
  charge_date date,
  category text,
  description text not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Paramètres utilisateur (meta : organization_id, préférences…)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------
create index if not exists bands_user_idx on public.bands (user_id, arrival_date desc);
create index if not exists daily_logs_user_idx on public.daily_logs (user_id, log_date desc);
create index if not exists daily_logs_batch_idx on public.daily_logs (batch_id);
create index if not exists sales_user_idx on public.sales (user_id, sale_date desc);
create index if not exists sales_batch_idx on public.sales (batch_id);
create index if not exists charges_user_idx on public.charges (user_id, charge_date desc);
create index if not exists charges_batch_idx on public.charges (batch_id);

-- ---------------------------------------------------------------------------
-- RLS : chaque utilisateur ne voit que ses propres données
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.daily_logs enable row level security;
alter table public.sales enable row level security;
alter table public.charges enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists bands_owner_all on public.bands;
create policy bands_owner_all on public.bands
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists daily_logs_owner_all on public.daily_logs;
create policy daily_logs_owner_all on public.daily_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists sales_owner_all on public.sales;
create policy sales_owner_all on public.sales
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists charges_owner_all on public.charges;
create policy charges_owner_all on public.charges
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists app_settings_owner_all on public.app_settings;
create policy app_settings_owner_all on public.app_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Droits (le rôle anon n'a aucun accès à ces tables)
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon;
revoke all on public.bands from anon;
revoke all on public.daily_logs from anon;
revoke all on public.sales from anon;
revoke all on public.charges from anon;
revoke all on public.app_settings from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.bands to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant select, insert, update, delete on public.charges to authenticated;
grant select, insert, update, delete on public.app_settings to authenticated;
