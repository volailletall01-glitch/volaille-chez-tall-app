/* Configuration Supabase — commandes clients.
   La clé « publishable » (équivalent de l'ancienne clé anon) est publique :
   elle permet uniquement d'envoyer une commande et de lire le stock publié.
   Valider ou refuser une commande exige un compte gérant connecté
   (Supabase Authentication). */
window.SUPABASE_CONFIG = {
  url: 'https://avoktrlsmbnisxxvxogc.supabase.co',
  anonKey: 'sb_publishable_D637PCwufh33LbqhXoPsRQ_9EBvT1sa',
  minPrice: 2500,
  maxPrice: 4500,
};
