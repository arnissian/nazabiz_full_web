# Fonctionnement de Business Management Portal

## 1. Objectif et périmètre

Business Management Portal est une application web React/TypeScript pour gérer une entreprise (tenant) et exploiter ses magasins. Le même frontend contient trois espaces de responsabilités :

- **Tenant** : administration de l’entreprise, de ses magasins, de son catalogue, de ses utilisateurs et de son abonnement.
- **Store** : opérations quotidiennes d’un magasin, dont le point de vente (POS), les stocks, les ventes et les achats.
- **Shared** : infrastructure et interfaces communes aux espaces, en particulier l’authentification, le contexte applicatif, les routes, les appels API et les composants réutilisables.

Le backend est une API Laravel distincte. Ce dépôt décrit et implémente le client web; il ne contient pas la logique serveur d’autorisation, de persistance, de facturation ou de validation des abonnements. Les réponses et règles serveur doivent être confirmées dans le dépôt backend.

## 2. Démarrage de l’application

`src/main.tsx` charge les styles globaux, monte React en `StrictMode` et affiche `src/portals/shared/App.tsx`. `App` assemble `AppProvider`, `BrowserRouter`, les notifications Toast et `AppRoutes`.

Les chemins applicatifs sont centralisés dans `src/portals/shared/routes/AppRoutes.tsx`. Le rangement des fichiers sous `tenant/` ou `store/` n’établit pas l’URL d’une page : toute nouvelle page doit aussi être déclarée dans le routeur.

### Organisation des sources

```text
src/
  main.tsx
  portals/
    shared/
      App.tsx
      components/       composants réellement communs
      config/           configuration de l’application et de l’environnement
      context/          état global, authentification et paramètres
      hooks/            hooks réutilisés par plusieurs espaces
      layouts/          shell commun aux pages protégées
      routes/           registre central des routes
      services/         client HTTP et services partagés
      types/            contrats partagés
      utils/            helpers communs
    tenant/
      components/ hooks/ pages/ services/ types/
    store/
      components/ hooks/ layouts/ pages/ types/
```

Une fonctionnalité spécifique à un seul espace doit rester dans cet espace. `shared/` ne doit recevoir un module que si plusieurs portails l’utilisent réellement. Les pages et hooks tenant de gestion des magasins ne doivent pas être importés dans le portail store; les opérations store utilisent le magasin actif du contexte.

## 3. Routes et espaces

Les routes publiques d’authentification incluent :

| URL | Fonction |
| --- | --- |
| `/login` | Connexion |
| `/login/otp` | Vérification du code après une connexion qui exige un second facteur |
| `/forgot-password` | Démarrage de la récupération du mot de passe |
| `/otp-verify` | Vérification du code de récupération |
| `/password-reset` | Réinitialisation du mot de passe |

Les routes privées sont protégées par `ProtectedRoute`. Les pages tenant comprennent notamment `/tenant-dashboard`, `/stores` et `/tenant-subscription`. Les opérations magasin sont regroupées sous `/pos` (POS, sessions de caisse, stocks, transferts, ventes, achats, dépenses, rapports et paramètres du magasin). Consulter `AppRoutes.tsx` pour la liste exacte et les permissions attribuées à chaque route.

Les interfaces entreprise et magasin sont réunies dans un même frontend et un même flux de connexion. Il n’existe plus de choix `CLIENT_APP` ni d’en-tête `X-Client-Context`. Dans son entreprise active, `super_admin` accède à tous les modules, magasins et actions sans restriction de permissions ni d’abonnement; son sélecteur de magasin présente tous les magasins actifs de cette entreprise. Cette règle ne permet pas de consulter une autre entreprise. Les autres utilisateurs restent filtrés selon les permissions de leurs rôles et leurs magasins affectés.

## 4. Authentification et état global

`shared/context/AppContext.tsx` (`AppProvider`) est la source d’état applicatif partagé. Il coordonne notamment :

- l’identité et le jeton de session;
- le login, la vérification OTP, la déconnexion et le renouvellement de session;
- le magasin actif et son changement;
- la langue et les traductions;
- les paramètres généraux, `tenantSettings` et les paramètres du magasin;
- les vérifications de permission et les états de chargement.

Au démarrage, le contexte initialise les données nécessaires à l’interface. L’identité, la langue et le jeton utilisent les clés de stockage définies dans `shared/config/authStorage.ts`; les anciennes clés tenant sont migrées lors de la lecture afin de conserver les connexions existantes. Le magasin actif provient de l’affectation utilisateur (notamment `auth.active_store` ou `user.active_store`). Après un changement de magasin, le contexte actualise les données dépendantes, en particulier les paramètres du magasin et de l’application.

### Parcours de connexion

1. La page `/login` envoie les identifiants à `/auth/login`.
2. Si l’API exige une vérification supplémentaire, le frontend conserve le challenge et redirige vers `/login/otp`; le code est vérifié par `/auth/login/verify-otp`.
3. Après connexion, `getInitialRoute` choisit une destination selon les rôles et permissions reçus.
4. La récupération du mot de passe passe par `/auth/email-verify`, `/auth/otp-verify` et `/auth/reset-password`. L’email et le jeton de réinitialisation sont transmis entre étapes par l’état de navigation.

L’API reste l’autorité pour authentifier et autoriser les requêtes. Les gardes et permissions côté React améliorent la navigation et l’expérience utilisateur; elles ne remplacent pas les contrôles serveur.

## 5. Permissions et accès aux pages

`RoleAccessGate` associe les routes à des permissions applicatives (par exemple `users.manage`, `products.view`, `sales.view` ou `purchases.view`). Les permissions disponibles et leurs libellés se trouvent dans `shared/types/role.ts`.

`hasPermission` accepte les permissions attribuées aux rôles et accorde toutes les permissions à `super_admin`. `getInitialRoute` agrège les permissions des rôles afin de sélectionner une page initiale. Le menu entreprise est réservé à `super_admin`; ce rôle voit aussi tous les modules magasin et peut y effectuer toutes les actions sans blocage d’abonnement. Les autres utilisateurs voient uniquement les modules et actions permis par leurs rôles. Ces contrôles côté React améliorent la navigation; l’API applique les règles côté serveur et conserve l’isolation entre entreprises.

À chaque ajout d’une page protégée, vérifier à la fois :

1. la route et son garde dans `AppRoutes.tsx`;
2. la permission dans `RoleAccessGate` et, si nécessaire, le menu correspondant;
3. le contrôle et le contrat équivalents côté API.

## 6. Portail tenant

Le portail tenant administre les données et paramètres à l’échelle de l’entreprise :

- tableau de bord global, avec période et filtre par magasin;
- domaines, catégories, sous-catégories, marques, produits et unités;
- fournisseurs, magasins, utilisateurs et rôles;
- paramètres de l’entreprise, comptes financiers et réglages par magasin;
- langues, devises et abonnement.

Les pages, hooks, services et types de gestion propres à ces fonctions sont sous `tenant/`. Par exemple, `tenant/hooks/stores/useStores.ts` sert à administrer les magasins depuis le tenant; ce n’est pas le mécanisme de contexte du portail store.

### Abonnement tenant

`TenantSubscriptionGate` vérifie l’accès auprès de `/tenant/subscription/access` pour les utilisateurs ordinaires. `super_admin` contourne ce gate et n’est pas bloqué par l’expiration de l’abonnement; `/tenant-subscription` reste accessible pour consulter ou gérer le forfait.

La page d’abonnement utilise notamment :

- `GET /tenant/subscription` pour consulter l’état;
- `POST /tenant/subscription/requests` pour demander un forfait;
- `POST /tenant/subscription/cancel` pour demander l’annulation.

Les demandes et leur validation dépendent du backend et de l’administration SaaS. Les éventuels délais d’essai ou règles de suspension indiqués dans l’interface ou les communications doivent être vérifiés côté serveur avant modification.

## 7. Portail store et magasin actif

Le portail store regroupe les opérations d’un magasin :

- tableau de bord, POS et sessions de caisse;
- stocks, mouvements, inventaires et transferts;
- clients, ventes, créances, devis, livraisons et paiements;
- achats, paiements fournisseurs et retours;
- dépenses, rapports et paramètres du magasin.

Le magasin actif est la référence des opérations store. Le changement est réalisé par `switchStore` dans le contexte partagé, et les pages POS/tableau de bord transmettent son identifiant aux appels concernés. Les hooks store ne doivent pas utiliser le hook tenant `useStores` comme sélecteur global.

**Exception : destination d’un transfert de stock.** La source est le magasin actif, mais l’utilisateur peut sélectionner comme destination n’importe quel magasin. Le hook store `useTransferDestinationStores` récupère la liste complète des magasins et exclut le magasin source de la sélection. Ne pas restreindre ces destinations aux magasins affectés à l’utilisateur.

### POS

Le POS compose la recherche de produits, le panier et la vérification de disponibilité, le client (sélection ou création rapide), les remises selon les permissions, les taxes et l’encaissement. Il prend aussi en charge la mise en attente et la reprise de ventes. Les sessions de caisse sont gérées séparément avec les permissions correspondantes. Les détails de calcul, d’enregistrement et de validation des ventes restent soumis au contrat API.

## 8. API, paramètres et devises

Les composants et hooks appellent l’API avec l’instance Axios partagée dans `shared/services/api/axiosInterceptor.tsx`. Les chemins d’API sont relatifs à la base configurée. L’intercepteur :

- ajoute le jeton d’accès aux requêtes;
- n’ajoute aucun contexte tenant/store; le backend décide selon les rôles, permissions et affectations;
- gère le renouvellement de session après une réponse 401.

Les hooks regroupent généralement l’accès réseau, la pagination et les filtres propres à une ressource. Les pages orchestrent les hooks et les formulaires. Avant d’ajouter un endpoint, chercher un hook ou service existant pour la ressource et suivre son format de réponse, sa pagination et ses erreurs plutôt que d’introduire un appel concurrent.

### Principales familles d’endpoints utilisées

Cette liste sert de repère pour les appels présents dans le frontend; elle ne constitue pas la spécification complète de l’API. Les opérations réellement disponibles et leurs règles sont définies par le backend.

| Domaine | Exemples de chemins |
| --- | --- |
| Authentification | `/auth/login`, `/auth/login/verify-otp`, `/auth/email-verify`, `/auth/otp-verify`, `/auth/reset-password` |
| Contexte et paramètres | `/auth/active-store`, `/admin/settings`, `/tenant/settings`, `/stores/{id}/settings`, `/getTraductions` |
| Tenant | `/dashboard/tenant`, `/domains`, `/categories`, `/products`, `/brands`, `/units`, `/stores`, `/users`, `/suppliers`, `/financial-accounts`, `/devises`, `/languages` |
| Utilisateurs tenant | `/users/{id}`, `/users/{userId}/activate-store` |
| Abonnement | `/tenant/subscription`, `/tenant/subscription/access`, `/tenant/subscription/requests`, `/tenant/subscription/cancel` |
| Tableau de bord store | `/dashboard`, `/dashboard/recent-sales`, `/dashboard/low-stock` |
| POS et ventes | `/pos/sessions`, `/pos/sessions/open`, `/pos/sessions/close`, `/sales`, `/sales/search`, `/sales/returnable`, `/sales/{id}` |
| Stocks | `/stocks`, `/stock-movements`, `/stock-transfers`, `/inventories` |
| Achats et retours | `/purchases`, `/purchases/search`, `/purchases/{id}/receive`, `/purchase-returns`, `/sale-returns` |
| Autres opérations store | `/customers`, `/customers/quick-create`, `/quotations`, `/payments`, `/purchase-payments`, `/expenses`, `/expense-categories`, `/reports/dashboard`, `/reports/receivables` |
| Conversion de devise | `/devises/{id}` |

Les ressources prennent souvent des paramètres de pagination, de recherche ou de filtre, comme `store_id`. Certaines ressources ont un endpoint `/search` distinct. Vérifier le hook concerné pour le format exact des paramètres et de la réponse avant de réutiliser ou d’ajouter une requête.

Le formatage commun est assuré par `shared/services/currencyFormatter.ts`. Les convertisseurs de devise restent distincts car leur devise cible dépend du contexte :

- `tenant/hooks/currency/useTenantCurrencyConverter.ts` utilise les paramètres tenant;
- `store/hooks/currency/useStoreCurrencyConverter.ts` utilise les paramètres store.

Les deux s’appuient sur les devises disponibles et le formatage partagé. Ne pas fusionner leurs paramètres de référence sans vérifier les effets sur chaque portail.

Les paramètres de marque (dont le logo et le nom) proviennent des réglages applicatifs/tenant exposés par le contexte et sont consommés par les composants partagés dédiés, par exemple `TenantLogo` et `TenantDocumentHeader`. Les paramètres magasin relèvent de `storeSettings`.

## 9. Configuration locale

Copier `.env.example` vers `.env.local`, puis configurer :

| Variable | Usage |
| --- | --- |
| `VITE_API_BASE_URL` | URL de base du serveur API |
| `VITE_API_URL` | URL de l’API, généralement avec le préfixe `/api` |
| `VITE_MEDIA_URL` | Base des médias retournés par l’API |
| `VITE_WEB_SIGNUP_URL` | URL du site d’inscription |

La lecture et les valeurs par défaut sont centralisées dans `shared/config/env.ts`. Ne jamais inclure de secret serveur dans les variables `VITE_*` : elles sont intégrées au bundle navigateur.

## 10. Faire évoluer le projet

Pour ajouter ou modifier une fonctionnalité :

1. Déterminer si elle appartient à `tenant`, `store` ou si elle est véritablement partagée. Éviter les imports d’un portail vers l’autre.
2. Ajouter les types près du domaine propriétaire; placer dans `shared/types/` uniquement les contrats utilisés par plusieurs domaines.
3. Réutiliser le client API partagé et suivre les conventions du hook/service existant.
4. Déclarer la route dans `shared/routes/AppRoutes.tsx`, avec son layout, ses protections d’authentification, de permission et d’abonnement.
5. Ajouter l’entrée de menu au layout approprié et la filtrer par permission.
6. Vérifier le comportement entreprise/magasin concerné, notamment le rôle utilisateur, ses permissions, le magasin actif, les paramètres de devise et les réglages de marque.
7. Lancer les validations ciblées puis le build quand le périmètre le permet.

### Commandes

```bash
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

`npm run build` exécute d’abord le contrôle TypeScript (`tsc -b`), puis le build Vite. Les dépendances principales incluent React, TypeScript, React Router, Axios, Bootstrap/React-Bootstrap, Ant Design, React Toastify, Recharts et jsPDF.
