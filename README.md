# Volaille chez TALL — Gestion avicole

Application web progressive (PWA) pour l’élevage et la commercialisation de poulets de chair. Elle fonctionne sur ordinateur, tablette et téléphone, sans compte ni serveur : toutes les données sont enregistrées dans le navigateur (IndexedDB) et restent disponibles hors ligne.

## Application en ligne

https://volaille-chez-tall.vercel.app

Le code est hébergé sur GitHub : https://github.com/volailletall01-glitch/volaille-chez-tall-app

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
├── app.js                     # Interface, IndexedDB, calculs, reçus PDF
├── styles.css                 # Mise en page responsive
├── manifest.webmanifest       # Configuration d’installation PWA
├── sw.js                      # Cache hors ligne (APP_SHELL)
├── icons/                     # Logo et icônes PWA
└── .github/workflows/         # Déploiement GitHub Pages
```

## Données et sauvegarde

- Les données sont stockées localement dans IndexedDB, par navigateur et par adresse (origine). Elles ne sont pas partagées entre appareils.
- Vider les données du site ou changer d’adresse (par exemple passer de GitHub Pages à Vercel) revient à repartir d’une base vide.
- Aucun envoi vers un service externe : pas de Supabase, pas de synchronisation cloud.

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
