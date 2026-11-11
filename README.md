# Volaille chez TALL — Gestion avicole

Application web progressive (PWA) pour l’élevage et la commercialisation de poulets de chair. Elle fonctionne sur ordinateur, tablette et téléphone, sans compte ni serveur : toutes les données sont enregistrées dans le navigateur (IndexedDB) et restent disponibles hors ligne.

## Application en ligne

Déploiement continu depuis ce dépôt (GitHub Pages) :
https://volailletall01-glitch.github.io/volaille-chez-tall-app/

Déploiement continu Vercel (dépôt `main`, redéploiement automatique à chaque push) :
https://volaille-chez-tall.vercel.app

> Les données sont propres à chaque adresse. Un appareil qui utilise déjà l’adresse Vercel continue d’y voir ses données ; une nouvelle adresse démarre avec une base vide.

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

### Vue d’ensemble
- Indicateurs **par bande** : sujets en élevage, mortalité cumulée, chiffre d’affaires, dépenses et bénéfice.
- Graphique de répartition du chiffre d’affaires entre les bandes.
- Les bandes archivées ne figurent plus dans la vue d’ensemble, mais leur historique reste comptabilisé dans les statistiques annuelles.

### Bandes
- Création et modification : nom, souche, date de mise en place, nombre de poussins, fournisseur, poids et cycle cibles, prix unitaire du poussin, transport initial (coût initial calculé automatiquement).
- **Archivage (suppression logique)** : la bande quitte l’élevage actif, mais tous ses relevés, ventes et charges restent conservés dans les statistiques et rapports globaux. Une section « Bandes archivées » permet de la restaurer.
- Suppression de l’historique des relevés d’une bande.
- Clic sur une ligne : fiche complète de la bande (effectif, mortalité, coûts, ventes, bénéfice).

### Suivi quotidien
Un relevé par bande et par date, limité à l’essentiel :
- bande ;
- date du relevé ;
- mortalité du jour ;
- tri / réformes ;
- note ou observation.

### Ventes
- Vente par bande avec nom, téléphone et adresse du client.
- Calcul du montant à partir du nombre de sujets, du poids moyen et du prix au kg.
- Suivi du règlement : montant payé et reliquat.
- **Reçu PDF téléchargeable** au format **ticket de caisse thermique 80 mm** (logo, en-tête avec adresse et téléphone, détail des articles, total, montant réglé et solde restant).
- **Suppression des ventes** : individuellement ou par lot (cases à cocher + « Tout sélectionner »). Les sujets supprimés redeviennent disponibles dans le stock.
- **Crédits clients** : liste des clients avec le montant restant dû, possibilité d’enregistrer le paiement du solde et de télécharger le reçu correspondant.

### Mes Commandes
- **Lien public de commande** (`commander.html`) à partager aux clients : stock de poulets disponibles et fourchette de prix (2 500 - 25 000 FCFA) affichés en temps réel.
- Si le stock est épuisé, le formulaire est remplacé par le message « Désolé, le stock est actuellement épuisé. »
- Le client saisit nom et prénom, téléphone, quartier, quantité et prix par tête proposé. La commande est envoyée avec le statut **En attente** et un message de remerciement s’affiche.
- En bas de la page, un grand bandeau suit la commande : « Commande en traitement — veuillez patienter ou revenir plus tard pour vérifier l’état de votre commande ». Dès que le gérant valide, il devient un message de confirmation et de remerciement (et un message d’excuse si la commande est refusée). Le suivi reste visible si le client revient plus tard sur le même appareil.
- Côté gérant : liste des demandes avec les détails du client, bouton **Valider** (la commande bascule automatiquement dans les ventes, la quantité est déduite du stock de l’élevage et le stock public est réactualisé) et bouton **Refuser** (la commande part dans la **Corbeille**, sans impact sur le stock, avec un message d’excuse à envoyer sur WhatsApp).
- **Corbeille** : les commandes refusées y restent 72 heures (compte à rebours affiché), puis sont purgées automatiquement. Un bouton **Restaurer** remet une commande refusée en attente (elle redevient traitable et le bandeau du client repasse à « Commande en traitement ») ; un autre bouton permet de vider la corbeille immédiatement.
- Les commandes sont stockées dans Supabase ; l’onglet **Mes Commandes** s’ouvre directement, sans écran de connexion ni mot de passe.

### Charges
- Dépense libre ou affectée à une bande.
- Une charge affectée à une bande entre dans le coût et le bénéfice de cette bande.

### Statistiques annuelles
- Synthèse par année : bandes, ventes, revenus, charges, bénéfice, mortalité.

Tous les montants sont affichés en FCFA.

## Structure

```text
POULET/
├── index.html                 # Shell de la PWA et navigation
├── commander.html             # Page publique de commande client
├── commander.js               # Stock temps réel, formulaire, envoi
├── supabase-config.js         # URL + clé publique Supabase
├── supabase/commandes.sql     # Tables, sécurité (RLS) et droits
├── app.js                     # Interface, IndexedDB, calculs, reçus PDF
├── styles.css                 # Mise en page responsive
├── manifest.webmanifest       # Configuration d’installation PWA
├── sw.js                      # Cache hors ligne (APP_SHELL)
├── icons/                     # Logo et icônes PWA
└── .github/workflows/         # Déploiement GitHub Pages
```

## Données et sauvegarde

- Bandes, relevés, ventes, charges et clients sont stockés localement dans IndexedDB, par navigateur et par adresse (origine). Ils ne sont pas partagés entre appareils.
- Vider les données du site ou changer d’adresse (par exemple passer de GitHub Pages à Vercel) revient à repartir d’une base vide pour ces données locales.
- **Commandes clients** : seules les commandes et le stock publié passent par Supabase, afin que le lien public fonctionne depuis n’importe quel appareil. La clé utilisée dans `supabase-config.js` est publique et limitée par les règles de sécurité (RLS) : elle ne peut que créer une commande, lire les commandes reçues, les passer à « Validée » ou « Refusée », supprimer les commandes refusées (corbeille) et publier le stock. Il n’y a volontairement plus de compte ni de mot de passe : toute personne qui ouvre l’application peut traiter les commandes, donc gardez l’adresse privée.

## Mise en place de Supabase (une seule fois)

1. Exécuter `supabase/commandes.sql` dans **Supabase → SQL Editor** (tables, règles RLS, droits pour la clé publique).
2. Renseigner l’URL du projet et la clé **publishable / anon** dans `supabase-config.js`.
3. Dans l’application, ouvrir **Mes Commandes**, puis **Publier le stock** pour rendre le stock visible sur la page publique.

## Installer

- **Windows / Android :** ouvrez l’application depuis une adresse HTTPS (ou `localhost`) puis utilisez l’invite d’installation du navigateur.
- **iPhone / iPad :** ouvrez l’URL dans Safari, touchez **Partager → Sur l’écran d’accueil**.

## Développement

Après chaque modification de `app.js`, `styles.css`, `index.html` ou des icônes :

1. Incrémentez `CACHE_NAME` dans `sw.js` (par exemple `poulet-pro-shell-v38`) pour forcer la mise à jour du cache.
2. Rechargez l’application en désinscrivant le service worker ou en vidant le cache du site.

## Limites connues

- Une saisie quotidienne par bande et par date.
- Les ventes portent sur des poulets vivants ; aucun abattoir, lot transformé, SMS/WhatsApp ou Mobile Money n’est connecté.
- Les données locales ne remplacent pas une sauvegarde : exportez ou conservez un profil de navigateur dédié.
