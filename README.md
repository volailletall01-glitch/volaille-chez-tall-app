# Volaille chez TALL — Gestion avicole

Application web progressive (PWA) pour l’élevage et la commercialisation de poulets de chair. Elle fonctionne sur ordinateur, tablette et téléphone, sans compte ni serveur : toutes les données sont enregistrées dans le navigateur (IndexedDB) et restent disponibles hors ligne.

## Application en ligne

Déploiement continu depuis ce dépôt (GitHub Pages) :
https://volailletall01-glitch.github.io/volaille-chez-tall-app/

Déploiement Vercel existant (déjà installé sur certains appareils) :
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
- Indicateurs généraux : bandes en cours, sujets vivants, mortalité cumulée, chiffre d’affaires, dépenses totales.
- Tableau **Par bande** : sujets en élevage, mortalité cumulée, revenus, charges de la bande, bénéfice après vente.

### Bandes
- Création et modification : nom, souche, date de mise en place, nombre de poussins, fournisseur, poids et cycle cibles, prix unitaire du poussin, transport initial (coût initial calculé automatiquement).
- Suppression d’une bande, ou suppression de son historique de relevés.
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
- **Reçu PDF téléchargeable** (avec le logo) après chaque vente : montant global si la vente est soldée, sinon montant payé + reliquat.
- **Crédits clients** : liste des clients avec le montant restant dû, possibilité d’enregistrer le paiement du solde et de télécharger le reçu correspondant.

### Mes Commandes
- **Lien public de commande** (`commander.html`) à partager aux clients : stock de poulets disponibles et fourchette de prix (2 500 – 4 500 FCFA) affichés en temps réel.
- Si le stock est épuisé, le formulaire est remplacé par le message « Désolé, le stock est actuellement épuisé. »
- Le client saisit nom et prénom, téléphone, quartier, quantité et prix par tête proposé. La commande est envoyée avec le statut **En attente** et un message de remerciement s’affiche.
- Côté gérant : liste des demandes avec les détails du client, bouton **Valider** (statut Validée, quantité déduite du stock de l’élevage et stock public réactualisé) et bouton **Refuser** (statut Refusée, sans impact sur le stock) qui prépare un message d’excuse à envoyer sur WhatsApp.
- Les commandes sont stockées dans Supabase ; la connexion gérant se fait dans l’onglet avec le compte créé dans **Authentication → Users**.

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
- **Commandes clients** : seules les commandes et le stock publié passent par Supabase, afin que le lien public fonctionne depuis n’importe quel appareil. La clé utilisée dans `supabase-config.js` est publique et limitée par les règles de sécurité (RLS) : elle ne peut que créer une commande et lire le stock publié.

## Mise en place de Supabase (une seule fois)

1. Exécuter `supabase/commandes.sql` dans **Supabase → SQL Editor**.
2. Créer le compte gérant dans **Authentication → Users → Add user**.
3. Renseigner l’URL du projet et la clé **publishable / anon** dans `supabase-config.js`.
4. Dans l’application, ouvrir **Mes Commandes → Se connecter**, puis **Publier le stock** pour rendre le stock visible sur la page publique.

## Installer

- **Windows / Android :** ouvrez l’application depuis une adresse HTTPS (ou `localhost`) puis utilisez l’invite d’installation du navigateur.
- **iPhone / iPad :** ouvrez l’URL dans Safari, touchez **Partager → Sur l’écran d’accueil**.

## Développement

Après chaque modification de `app.js`, `styles.css`, `index.html` ou des icônes :

1. Incrémentez `CACHE_NAME` dans `sw.js` (par exemple `poulet-pro-shell-v30`) pour forcer la mise à jour du cache.
2. Rechargez l’application en désinscrivant le service worker ou en vidant le cache du site.

## Limites connues

- Une saisie quotidienne par bande et par date.
- Les ventes portent sur des poulets vivants ; aucun abattoir, lot transformé, SMS/WhatsApp ou Mobile Money n’est connecté.
- Les données locales ne remplacent pas une sauvegarde : exportez ou conservez un profil de navigateur dédié.
