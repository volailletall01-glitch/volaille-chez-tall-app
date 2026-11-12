-- Bande vendue : mémorisée sur la mise en vente publique et sur chaque commande.
-- À exécuter une seule fois dans Supabase → SQL Editor.

alter table public.app_config add column if not exists band_id text;
alter table public.app_config add column if not exists band_name text;

alter table public.orders add column if not exists band_id text;
alter table public.orders add column if not exists band_name text;

-- Les identifiants de bandes sont des chaînes (uid), pas des UUID.
alter table public.app_config alter column band_id type text;
alter table public.orders alter column band_id type text;

-- Le rôle public (page de commande) doit pouvoir renseigner la bande vendue.
grant insert (client_name, client_phone, neighborhood, quantity, price_per_head, band_id, band_name)
  on public.orders to anon;

-- Recharge le cache de schéma utilisé par l'API REST.
notify pgrst, 'reload schema';
