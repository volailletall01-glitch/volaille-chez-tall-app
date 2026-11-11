/* Configuration Supabase - commandes clients.
   La clé « publishable » (équivalent de l'ancienne clé anon) est publique :
   elle permet d'envoyer une commande, de lire le stock publié, de consulter
   les commandes reçues et de les passer à « Validée » ou « Refusée ».
   L'onglet Mes Commandes s'ouvre directement, sans compte ni mot de passe. */
window.SUPABASE_CONFIG = {
  url: 'https://avoktrlsmbnisxxvxogc.supabase.co',
  anonKey: 'sb_publishable_D637PCwufh33LbqhXoPsRQ_9EBvT1sa',
  minPrice: 2500,
  maxPrice: 25000,
};
