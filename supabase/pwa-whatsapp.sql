-- Numéro WhatsApp du gestionnaire — Volaille chez TALL
-- À exécuter dans Supabase → SQL Editor (une seule fois).
--
-- * `profiles.whatsapp` conserve le numéro saisi à l'inscription.
-- * `app_config.manager_whatsapp` publie ce numéro pour la page publique
--   `commander.html`, qui n'a pas accès aux profils (RLS propriétaire).

alter table public.profiles
  add column if not exists whatsapp text;

alter table public.app_config
  add column if not exists manager_whatsapp text;

-- Le numéro publié reste lisible/modifiable par la page de commande et
-- l'application gérant, comme le reste de `app_config`.
grant select, update on public.app_config to anon;
grant select, update on public.app_config to authenticated;

-- Vérification rapide après exécution :
-- select id, whatsapp from public.profiles;
-- select id, manager_whatsapp from public.app_config where id = 1;
