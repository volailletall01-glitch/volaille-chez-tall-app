-- Commandes clients — Volaille chez TALL
-- À exécuter dans Supabase → SQL Editor.
--
-- Principe :
--   * le public (clé anon) peut créer une commande « en_attente »
--     et lire le stock publié ;
--   * l'application gérant utilise la même clé publique, sans compte ni
--     mot de passe : elle peut lire les commandes, les valider ou les
--     refuser, et publier le stock.

create extension if not exists pgcrypto;

-- Stock publié vers la page publique (une seule ligne).
create table if not exists public.app_config (
  id smallint primary key default 1 check (id = 1),
  stock_heads integer not null default 0 check (stock_heads >= 0),
  min_price integer not null default 2500 check (min_price > 0),
  max_price integer not null default 25000 check (max_price >= min_price),
  updated_at timestamptz not null default now()
);

insert into public.app_config (id) values (1)
on conflict (id) do nothing;

-- Demandes reçues depuis le lien public.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_phone text not null check (char_length(client_phone) between 6 and 30),
  neighborhood text not null check (char_length(neighborhood) between 2 and 120),
  quantity integer not null check (quantity > 0 and quantity <= 5000),
  price_per_head integer not null check (price_per_head between 2500 and 25000),
  status text not null default 'en_attente'
    check (status in ('en_attente', 'validee', 'refusee', 'archivee')),
  handled_at timestamptz
);

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

-- Migration des installations existantes : fourchette de prix 2 500 - 25 000 FCFA.
alter table public.orders drop constraint if exists orders_price_per_head_check;
alter table public.orders add constraint orders_price_per_head_check
  check (price_per_head between 2500 and 25000);
alter table public.app_config alter column max_price set default 25000;
alter table public.app_config drop constraint if exists app_config_max_price_check;
alter table public.app_config add constraint app_config_max_price_check
  check (max_price >= min_price);

-- Migration : statut « archivee » utilisé par la remise à zéro du compteur
-- « Validées » de l'onglet Mes Commandes (les ventes restent intactes).
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('en_attente', 'validee', 'refusee', 'archivee'));

alter table public.orders enable row level security;
alter table public.app_config enable row level security;

-- Politiques commandes
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders
  for insert to anon, authenticated
  with check (status = 'en_attente' and handled_at is null);

-- Accès direct depuis l'application gérant, sans écran de connexion.
drop policy if exists "orders_read_manager" on public.orders;
drop policy if exists "orders_read_app" on public.orders;
create policy "orders_read_app" on public.orders
  for select to anon, authenticated
  using (true);

drop policy if exists "orders_update_manager" on public.orders;
drop policy if exists "orders_update_app" on public.orders;
create policy "orders_update_app" on public.orders
  for update to anon, authenticated
  using (true)
  with check (status in ('en_attente', 'validee', 'refusee', 'archivee'));

-- Corbeille : les commandes refusées sont supprimées après 72 h (ou manuellement).
drop policy if exists "orders_delete_app" on public.orders;
create policy "orders_delete_app" on public.orders
  for delete to anon, authenticated
  using (status = 'refusee');

-- Politiques stock publié
drop policy if exists "config_read_public" on public.app_config;
create policy "config_read_public" on public.app_config
  for select to anon, authenticated
  using (true);

drop policy if exists "config_update_manager" on public.app_config;
drop policy if exists "config_update_app" on public.app_config;
create policy "config_update_app" on public.app_config
  for update to anon, authenticated
  using (true)
  with check (id = 1);

-- Droits
revoke all on public.orders from anon;
grant insert (client_name, client_phone, neighborhood, quantity, price_per_head)
  on public.orders to anon;
-- Si la migration pwa-selling-band.sql a déjà été exécutée, conserver l'accès
-- aux colonnes de bande lors d'une ré-exécution de ce script.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'band_id'
  ) then
    execute 'grant insert (band_id, band_name) on public.orders to anon';
  end if;
end $$;
grant select, update, delete on public.orders to anon;
grant select, update, delete on public.orders to authenticated;

revoke all on public.app_config from anon;
grant select, update on public.app_config to anon;
grant select, update on public.app_config to authenticated;

-- Exemple : le stock sera publié par l'application gérant.
-- Pour initialiser à la main :
-- update public.app_config set stock_heads = 500, updated_at = now() where id = 1;
