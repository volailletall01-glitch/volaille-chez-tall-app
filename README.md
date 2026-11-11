# Volaille chez TALL — Gestion avicole

Application web progressive (PWA) pour l’élevage et la commercialisation de poulets de chair. Elle fonctionne sur ordinateur, tablette et téléphone. Un compte personnel (email ou téléphone + mot de passe) est obligatoire : bandes, relevés, ventes, charges et paramètres sont enregistrés dans Supabase et **synchronisés sur tous les appareils connectés**.

## Application en ligne

Déploiement continu depuis ce dépôt (GitHub Pages) :
https://volailletall01-glitch.github.io/volaille-chez-tall-app/

Déploiement continu Vercel (dépôt `main`, redéploiement automatique à chaque push) :
https://volaille-chez-tall.vercel.app

> Les données sont désormais liées au **compte** et non plus à l’adresse : connectez-vous avec le même email/téléphone sur GitHub Pages ou Vercel pour retrouver exactement les mêmes bandes, ventes et charges.

Le code est hébergé sur GitHub : https://github.com/volailletall01-glitch/volaille-chez-tall-app

Chaque push sur `main` déclenche le déploiement via [deploy-pages.yml](./.github/workflows/deploy-pages.yml).

## Démarrer en local

Aucune compilation, aucun Node.js, aucune dépendance tierce. Servez simplement le dossier avec un serveur HTTP local (une PWA ne s’installe pas depuis `file://`) :

```powershell
cd C:\Users\LENOVO\Desktop\POULET
py -m http.server 8080
```

Ouvrez ensuite `http://localhost:8080`. Le service worker met l’interface en cache après le premier chargement.

## Fonctions

### Connexion et synchronisation
- **Écran d’accueil animé** avec le logo de l’exploitation, avant toute utilisation de l’application.
- **Inscription** et **connexion** par email **ou** numéro de téléphone, avec mot de passe (6 caractères minimum).
- À l’inscription, le **numéro WhatsApp du gestionnaire est obligatoire** (format international, ex. `+223 78 31 48 18`). Les numéros locaux maliens à 8 chiffres reçoivent automatiquement l’indicatif `223`.
- Les données sont stockées sur le compte Supabase : à la reconnexion sur un autre appareil, l’historique complet est retrouvé automatiquement.
- Bouton **Mon compte** (en bas de la barre latérale) : profil, nombre d’enregistrements, synchronisation manuelle, **modification du numéro WhatsApp du gestionnaire** et déconnexion.
- Le numéro WhatsApp est publié dans `app_config` afin que la page publique de commande puisse alerter le gestionnaire, même sans compte connecté.

### Vue d’ensemble
- Indicateurs **par bande** : sujets en élevage, mortalité cumulée, chiffre d’affaires, dépenses et bénéfice.
- Graphique de répartition du chiffre d’affaires entre les bandes.
- Les bandes archivées ne figurent plus dans la vue d’ensemble, mais leur historique reste comptabilisé dans les statistiques annuelles.

### Bandes
- Création et modification : nom, souche, date de mise en place, nombre de poussins, fournisseur, poids et cycle cibles, prix unitaire du poussin, transport initial (coût initial calculé automatiquement).
- **Archivage (suppression logique)** : la bande et toutes ses opérations (relevés, ventes, charges) disparaissent des menus de gestion quotidienne. Une section « Bandes archivées » permet de la restaurer.
- **Suppression définitive** d’une bande archivée : efface en cascade la bande et tous ses relevés, ventes et charges, y compris dans les statistiques. Double confirmation (confirmation puis saisie du nom exact de la bande), action irréversible.
- Suppression de l’historique des relevés d’une bande.
- Clic sur une ligne : fiche complète de la bande (effectif, mortalité, coûts, ventes, bénéfice).

### Suivi quotidien
Un relevé par bande et par date, limité à l’essentiel :
- bande ;
- date du relevé ;
- mortalité du jour ;
- tri / réformes ;
- note ou observation.

**Suppression d’un relevé** : le bouton ✕ retire immédiatement la mortalité et le tri des totaux de la bande (sujets en élevage, taux de mortalité, indicateurs). Le recalcul est instantané, sans étape supplémentaire.

### Ventes
- Vente par bande avec nom, téléphone et adresse du client.
- Calcul du montant à partir du nombre de sujets, du poids moyen et du prix au kg.
- Suivi du règlement : montant payé et reliquat.
- **Reçu PDF téléchargeable** au format **ticket de caisse thermique 80 mm** (logo, en-tête avec adresse et téléphone, détail des articles, total, montant réglé et solde restant).
- **Après chaque vente enregistrée**, une boîte de dialogue s’ouvre immédiatement avec un récapitulatif, un message WhatsApp modifiable et deux actions : **Envoyer par WhatsApp** au numéro du client et **Télécharger le reçu** PDF.
- **Suppression des ventes** : individuellement ou par lot (cases à cocher + « Tout sélectionner »). Les sujets supprimés redeviennent disponibles dans le stock.
- **Crédits clients** : liste des clients avec le montant restant dû, possibilité d’enregistrer le paiement du solde et de télécharger le reçu correspondant.

### Mes Commandes
- **Lien public de commande** (`commander.html`) à partager aux clients : stock de poulets disponibles et fourchette de prix (2 500 - 25 000 FCFA) affichés en temps réel.
- Si le stock est épuisé, le formulaire est remplacé par le message « Désolé, le stock est actuellement épuisé. »
- Le client saisit nom et prénom, téléphone, quartier, quantité et prix par tête proposé. La commande est envoyée avec le statut **En attente** et un message de remerciement s’affiche.
- **Alerte gestionnaire** : dès l’envoi, la page publique propose (et tente d’ouvrir automatiquement) un message WhatsApp prérempli vers le numéro du gestionnaire, avec le nom, le téléphone, le quartier, la quantité, le prix et le total estimé.
- En bas de la page, un grand bandeau suit la commande : « Commande en traitement — veuillez patienter ou revenir plus tard pour vérifier l’état de votre commande ». Dès que le gérant valide, il devient un message de confirmation et de remerciement (et un message d’excuse si la commande est refusée). Le suivi reste visible si le client revient plus tard sur le même appareil.
- Côté gérant : liste des demandes avec les détails du client, bouton **Valider** (la commande bascule automatiquement dans les ventes, la quantité est déduite du stock de l’élevage et le stock public est réactualisé) et bouton **Refuser** (la commande part dans la **Corbeille**, sans impact sur le stock).
- **Après validation ou refus**, une boîte de dialogue s’affiche aussitôt : statut, articles, quantités, total payé, solde restant, message WhatsApp modifiable à envoyer au client, et **Télécharger le reçu** PDF (le refus génère un justificatif « Commande refusée » avec montants à zéro).
- **Corbeille** : les commandes refusées y restent 72 heures (compte à rebours affiché), puis sont purgées automatiquement. Un bouton **Restaurer** remet une commande refusée en attente (elle redevient traitable et le bandeau du client repasse à « Commande en traitement ») ; un autre bouton permet de vider la corbeille immédiatement.
- Les commandes sont stockées dans Supabase ; l’onglet **Mes Commandes** s’ouvre directement, sans écran de connexion ni mot de passe.

### Charges
- Dépense libre ou affectée à une bande.
- Une charge affectée à une bande entre dans le coût et le bénéfice de cette bande.
- **Suppression d’une charge** : le bouton ✕ la retire immédiatement des dépenses, du coût de la bande et du bénéfice. Les totaux sont recalculés sur-le-champ.

### Statistiques annuelles
- Synthèse par année : bandes, ventes, revenus, charges, bénéfice, mortalité.
- **Graphiques animés** : recettes, dépenses, marge nette et mortalité par année, puis recettes et dépenses de chaque bande (actives et archivées). Les animations se désactivent si l’appareil demande moins de mouvement.
- L’historique des bandes archivées reste consultable et comptabilisé dans les calculs globaux tant qu’elles ne sont pas supprimées définitivement.

### PWA iPhone / iPad
- Métadonnées **iOS** complètes : `apple-mobile-web-app-capable`, barre d’état `black-translucent`, titre d’application, icônes `apple-touch-icon` 180 et 192 px, `mobile-web-app-capable` et manifeste.
- Détection d’iOS hors mode installé : un **bandeau discret** explique d’appuyer sur **Partager → Sur l’écran d’accueil**. Il peut être masqué et ne réapparaît plus.
- Zones sûres (`safe-area-inset-*`) respectées sur l’encoche et la barre d’accueil iOS ; le service worker s’installe de façon résiliente même si une ressource du cache est indisponible.
- Demande de **stockage persistant** au navigateur et tolérance aux purges de cache WebKit : l’application continue de fonctionner et se resynchronise avec Supabase.

### Logo et netteté
- Logo servi en 96, 192 et 512 px via `srcset`, avec des conteneurs de dimensions fixes et `object-fit: contain` : net sur écrans haute densité (Retina) sans étirement.
- Rendu haute fidélité (`image-rendering` / anticrénelage) et conservation de la résolution native, sans recompression destructive.
- Facteur d’agrandissement maximal ~256 px pour le logo du reçu PDF, afin de rester lisible à l’impression 80 mm.

Tous les montants sont affichés en FCFA.

## Structure

```text
POULET/
├── index.html                 # Shell de la PWA et navigation
├── commander.html             # Page publique de commande client
├── commander.js               # Stock temps réel, formulaire, envoi
├── supabase-config.js         # URL + clé publique Supabase
├── supabase/commandes.sql     # Commandes publiques, stock publié (RLS)
├── supabase/auth-sync.sql     # Compte, bandes, relevés, ventes, charges (RLS)
├── supabase/pwa-whatsapp.sql  # Colonnes WhatsApp (profil + numéro publié)
├── app.js                     # Interface, auth, synchronisation, calculs, reçus PDF
├── styles.css                 # Mise en page responsive
├── manifest.webmanifest       # Configuration d’installation PWA
├── sw.js                      # Cache hors ligne (APP_SHELL)
├── icons/                     # Logo et icônes PWA
└── .github/workflows/         # Déploiement GitHub Pages
```

## Données et sauvegarde

- Bandes, relevés, ventes, charges, profil et paramètres sont stockés dans **Supabase**, rattachés au compte (`user_id`). Les règles **RLS** empêchent tout autre utilisateur d’y accéder. Le dernier snapshot synchronisé est conservé dans IndexedDB, séparément pour chaque compte, pour permettre la consultation hors ligne.
- La première connexion sur un appareil qui possède encore d’anciennes données locales (IndexedDB) les transfère une seule fois vers le compte, si celui-ci est vide. L’IndexedDB n’est plus utilisée ensuite.
- Hors ligne, l’application peut afficher le dernier snapshot synchronisé si IndexedDB est disponible. La création, la modification et la synchronisation des données nécessitent toujours une connexion Internet; les changements hors ligne ne sont pas mis en file.
- **Commandes clients** : les commandes et le stock publié restent dans des tables publiques Supabase, afin que le lien de commande fonctionne sans compte. La clé `supabase-config.js` est publique et limitée par RLS : création de commande, lecture des commandes reçues, validation/refus, corbeille et publication du stock.
- **Numéro WhatsApp** : `profiles.whatsapp` conserve le numéro du compte. Il est aussi publié dans `app_config.manager_whatsapp` (lisible par la page publique) pour construire l’alerte de nouvelle commande.

## Mise en place de Supabase (une seule fois)

1. Exécuter `supabase/commandes.sql` dans **Supabase → SQL Editor** (commandes publiques, stock, règles RLS).
2. Exécuter `supabase/auth-sync.sql` dans le même éditeur (comptes, profils, bandes, relevés, ventes, charges, paramètres + RLS).
3. Exécuter `supabase/pwa-whatsapp.sql` (colonnes `profiles.whatsapp` et `app_config.manager_whatsapp`).
4. Dans **Authentication → Providers → Email**, désactiver **Confirm email** pour que l’inscription ouvre directement la session (ou laisser la confirmation active et demander à l’utilisateur de valider son email).
5. Renseigner l’URL du projet et la clé **publishable / anon** dans `supabase-config.js`.
6. Dans l’application, créer un compte puis ouvrir **Mes Commandes → Publier le stock** pour rendre le stock visible sur la page publique.
7. Vérifier le numéro d’alerte dans **Mon compte → Numéro WhatsApp du gestionnaire**, puis **Enregistrer le numéro**.

## Installer

- **Windows / Android :** ouvrez l’application depuis une adresse HTTPS (ou `localhost`) puis utilisez l’invite d’installation du navigateur.
- **iPhone / iPad :** ouvrez l’URL dans Safari, touchez **Partager → Sur l’écran d’accueil**. La barre d’état est translucide et l’icône 180 px est utilisée sur l’écran d’accueil. Un bandeau dans l’application rappelle la procédure si nécessaire.

## Développement

Après chaque modification de `app.js`, `styles.css`, `index.html` ou des icônes :

1. Incrémentez `CACHE_NAME` dans `sw.js` (par exemple `poulet-pro-shell-v43`) pour forcer la mise à jour du cache.
2. Rechargez l’application en désinscrivant le service worker ou en vidant le cache du site.

## Limites connues

- Une saisie quotidienne par bande et par date.
- Les ventes portent sur des poulets vivants ; aucun abattoir, lot transformé, SMS/WhatsApp ou Mobile Money n’est connecté.
- **WhatsApp** : l’application ouvre WhatsApp avec un message prérempli (`wa.me`) ; l’envoi reste manuel et nécessite que le numéro soit joignable sur WhatsApp. L’ouverture automatique après une commande peut être bloquée par le navigateur : le bouton d’envoi reste alors disponible.
- Les reçus sont générés localement au format PDF 80 mm ; ils ne sont pas envoyés automatiquement, mais téléchargeables pour impression ou partage.
- Les données sont synchronisées avec Supabase : conservez l’accès à votre compte (email/téléphone et mot de passe) pour les retrouver sur un nouvel appareil.
