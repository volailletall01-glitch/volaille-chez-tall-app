-- Suppression du compte — Volaille chez TALL
-- À exécuter dans Supabase → SQL Editor (une seule fois).
--
-- Principe :
--   * la clé publishable utilisée par l'application ne peut pas supprimer
--     un utilisateur de `auth.users` ;
--   * cette fonction `security definer` s'exécute donc avec les droits du
--     propriétaire, mais supprime uniquement le compte de l'utilisateur
--     actuellement connecté (`auth.uid()`) ;
--   * les tables `profiles`, `bands`, `daily_logs`, `sales`, `charges` et
--     `app_settings` sont nettoyées automatiquement par les clés étrangères
--     `on delete cascade`.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Utilisateur non connecté.';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
