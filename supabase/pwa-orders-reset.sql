-- Remise à zéro du compteur « Validées » (onglet Mes Commandes).
-- À exécuter une seule fois dans Supabase → SQL Editor.
--
-- Le statut « archivee » retire une commande validée du compteur sans rien
-- supprimer : la commande, la vente associée (sales.order_id) et son reçu
-- restent intacts. L'archivage est réversible en base si nécessaire.

-- 1. Autoriser le nouveau statut.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('en_attente', 'validee', 'refusee', 'archivee'));

-- 2. Autoriser l'application gérant à passer « validee » → « archivee ».
drop policy if exists "orders_update_app" on public.orders;
create policy "orders_update_app" on public.orders
  for update to anon, authenticated
  using (true)
  with check (status in ('en_attente', 'validee', 'refusee', 'archivee'));

-- 3. Recharge le cache de schéma utilisé par l'API REST.
notify pgrst, 'reload schema';
