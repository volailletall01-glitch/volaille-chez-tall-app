-- Sexe du client dans le formulaire public de commande.
-- À exécuter une seule fois dans Supabase → SQL Editor.
--
-- Le formulaire demande « Homme (M) » ou « Femme (F) ». La valeur est
-- enregistrée dans public.orders.client_gender, puis affichée dans
-- l'application devant le nom du client. Les anciennes commandes restent
-- valides : la colonne est facultative.

alter table public.orders add column if not exists client_gender text;

alter table public.orders drop constraint if exists orders_client_gender_check;
alter table public.orders add constraint orders_client_gender_check
  check (client_gender in ('M', 'F'));

-- Autorise le formulaire public (anon) à renseigner le sexe du client.
grant insert (client_gender) on public.orders to anon;

-- Recharge le cache de schéma utilisé par l'API REST.
notify pgrst, 'reload schema';
