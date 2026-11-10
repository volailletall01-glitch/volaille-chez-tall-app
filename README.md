# Volaille chez TALL — Gestion avicole

Application web progressive pour l’élevage et la commercialisation de poulets de chair. Elle est utilisable sur ordinateur, tablette et téléphone ; les relevés restent enregistrés localement lorsque le réseau est indisponible.

## Démarrer

Cette version ne nécessite ni Node.js, ni compilation, ni dépendance tierce. Servez le dossier avec un serveur HTTP local (les PWA ne s’installent pas depuis `file://`) :

```powershell
cd C:\Users\LENOVO\Desktop\POULET
py -m http.server 8080
```

Ouvrez ensuite `http://localhost:8080`. Le service worker met en cache l’interface après le premier chargement. Les relevés et les files de synchronisation sont conservés dans IndexedDB sur l’appareil.

## Fonctions disponibles

- Création de bandes de poulets de chair, souche, effectif, fournisseur, coût unitaire des poussins et transport initial ; le coût initial est calculé automatiquement.
- Relevés journaliers de mortalité, tri, aliments par phase, eau, poids, traitements et frais de soins.
- Inventaire par intrant, seuils d’alerte, entrées de stock et coût moyen pondéré ; l’aliment consommé déduit le stock et alimente le coût de la bande.
- Ventes de sujets vivants par lot, calcul du poids et du montant, suivi du règlement et des crédits.
- Clients, charges affectées à un lot ou communes, tableaux de bord et estimation de rentabilité par bande.
- File locale hors ligne avec synchronisation Supabase explicite, idempotente et reprise après erreur.
- Navigation entre les sections accessible au clavier, conservée dans l’URL et restaurée avec les boutons précédent/suivant du navigateur ; accès aux paramètres également disponible sur mobile.

Les catégories et montants sont présentés en FCFA ; adaptez le format dans `app.js` si votre exploitation utilise une autre devise.

## Structure

```text
POULET/
├── index.html                 # Shell de la PWA
├── app.js                     # Interface, IndexedDB, règles de calcul et sync Supabase
├── styles.css                 # Interface tactile responsive
├── manifest.webmanifest       # Configuration d’installation PWA
├── sw.js                      # Cache de l’application hors ligne
├── icons/volaille-chez-tall-logo.png # Logo utilisé dans l’interface
├── icons/volaille-chez-tall-192.png # Icône PWA Android
├── icons/volaille-chez-tall-512.png # Icône PWA haute résolution
└── supabase/schema.sql        # Schéma PostgreSQL, fonctions et politiques RLS
```

### Modèle métier et indicateurs

| Table PostgreSQL | Données principales |
|---|---|
| `batches` (bandes) | Arrivée, souche, effectif, fournisseur, coût unitaire et total des poussins, transport, poids/âge cibles et statut |
| `daily_logs` | Relevé unique par bande et par jour : mortalité, tri, aliments par phase, eau, poids, traitement et frais |
| `inventory_items`, `inventory_movements` | Intrants, quantité disponible, seuil, coût moyen pondéré, achats/transport et consommations |
| `poultry_sales` | Lot source, client, sujets, poids, prix, montant, règlement initial et solde |
| `charges` | Dépenses affectées à un lot ou communes à l’exploitation |
| `clients` | Coordonnées, canal de vente et notes |

Calculs affichés : mortalité cumulée = sujets morts / effectif initial ; IC = kg d’aliment distribués / biomasse vive mesurée (sujets encore présents pesés + poids vendu) ; coût du lot = poussins + transport + aliment consommé + soins et autres coûts de relevés + charges directes ; coût unitaire = coût du lot / sujets vivants ou vendus. La date de vente cible est estimée à partir de la date d’arrivée et de l’âge cible (42 jours par défaut). Le taux de mortalité ne comprend pas les tris/réformes. L’IC reste indisponible tant qu’une pesée réelle n’est pas saisie.

Les politiques RLS filtrent chaque table par adhésion à l’organisation. Les clés étrangères composées empêchent de lier une vente, un relevé ou un mouvement de stock à une ressource d’une autre exploitation.

## Navigation et interactions

Chaque section est un onglet accessible : utilisez les flèches gauche/droite ou haut/bas, ainsi que Début/Fin, puis Entrée ou Espace. Le changement de section actualise l’URL (`#bands`, `#stock`, etc.) ; les boutons précédent/suivant du navigateur restaurent aussi l’onglet. Sur téléphone, faites défiler la barre d’onglets en bas ; les paramètres sont accessibles par le bouton en haut de l’écran.

Les interactions suivent les principes du dépôt [wshobson/agents](https://github.com/wshobson/agents), notamment ses recommandations JavaScript moderne et d’accessibilité : [modern-javascript-patterns](https://github.com/wshobson/agents/tree/main/plugins/javascript-typescript/skills/modern-javascript-patterns) et [accessibility-compliance](https://github.com/wshobson/agents/tree/main/plugins/accessibility-compliance).

## Activer Supabase

1. Le projet **Volaillecheztall** (`avoktrlsmbnisxxvxogc`) est préconfiguré dans l’application. Ouvrez son [tableau de bord Supabase](https://supabase.com/dashboard/project/avoktrlsmbnisxxvxogc) et exécutez [`supabase/schema.sql`](./supabase/schema.sql) dans son SQL Editor.
2. Créez un utilisateur dans **Authentication → Users** (ou activez l’inscription contrôlée selon votre politique d’accès).
3. Dans l’application, ouvrez **Paramètres & synchronisation**, vérifiez l’URL préremplie, puis fournissez la clé publique `anon`/`publishable`, l’e-mail et le mot de passe de l’utilisateur.
4. La première connexion crée l’exploitation et son adhésion ; les enregistrements locaux sont associés à cette exploitation, envoyés dans l’ordre et les données du serveur sont ensuite récupérées.

N’insérez jamais une clé `service_role` dans l’application web. La clé publique et le jeton utilisateur ne remplacent pas les politiques RLS. Le mot de passe n’est pas stocké ; le jeton est gardé dans `sessionStorage` pour l’onglet courant.

Les synchronisations sont déclenchées par le bouton **Synchroniser** ou après une connexion depuis les paramètres. En cas d’échec, les opérations non confirmées restent en attente sur l’appareil. Les identifiants UUID rendent les nouvelles tentatives sûres ; la synchronisation est paginée. Utilisez un navigateur/profil par exploitation : l’app refuse de rattacher les données locales à une autre organisation.

## Installer

- **Windows / Android :** ouvrez l’application depuis un hébergement HTTPS (ou `localhost`) puis utilisez l’invite d’installation du navigateur.
- **iPhone / iPad :** ouvrez l’URL dans Safari, touchez **Partager → Sur l’écran d’accueil**. Le mode hors ligne est disponible après le premier chargement. Pour une icône iOS optimale, ajoutez un PNG `apple-touch-icon` dédié lors de la mise en production.

Le serveur doit être servi en HTTPS en production. La première ouverture nécessite une connexion pour mettre en cache le shell ; les données métier saisies sont ensuite utilisables hors ligne. Les polices distantes ne sont qu’un enrichissement visuel : l’application reste lisible sans elles.

## Hypothèses et limites du MVP

- Une saisie quotidienne par bande et par date ; les stocks d’aliments consommés doivent être saisis en kg pour garantir une déduction et un coût précis.
- Les ventes enregistrées portent sur des poulets vivants ; aucun abattoir, lot transformé, SMS/WhatsApp ou passerelle Mobile Money n’est connecté à ce MVP.
- Les règlements partiels sont suivis au niveau de la vente ; l’historique de versements successifs, les commandes planifiées et les courbes de croissance par souche restent à ajouter.
- En cas de saisies hors ligne concurrentes sur plusieurs appareils pour le même lot ou stock, la résolution des conflits doit être faite manuellement ; ce MVP ne fournit pas de verrouillage transactionnel multi-appareils.
- Les données locales ne sont pas un remplacement de sauvegarde : synchronisez régulièrement et prévoyez une politique de sauvegarde Supabase.
- Les calculs de marge sont des estimations de gestion. Ils reposent sur les quantités et coûts saisis, sans répartition automatique des charges communes entre lots.
