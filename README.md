# Web Tenant

Interface de gestion de l’entreprise : tableau de bord global, magasins, utilisateurs, rôles, catalogue, fournisseurs, comptes financiers, paramètres et abonnement de l’entreprise.

Cette application utilise l’API Laravel commune du projet et demande un jeton Sanctum limité au client `tenant`. L’API vérifie également les permissions de gestion de l’entreprise et le tenant de l’utilisateur.

## Démarrage

1. Copier `.env.example` vers `.env.local` et configurer `VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_MEDIA_URL` et `VITE_WEB_SIGNUP_URL`.
2. Installer les dépendances avec `npm ci`.
3. Lancer `npm run dev` ou compiler avec `npm run build`.

Le projet dispose de son propre dépôt Git. Le remote Git n’est pas configuré.

Les demandes de souscription et de changement de plan sont validées manuellement par l’administration SaaS. L’essai initial dure 14 jours; à son échéance, les opérations de l’entreprise et des magasins sont suspendues tant qu’un abonnement n’a pas été activé.

## Organisation du code

Tous les modules applicatifs sont regroupés par portail dans `src/portals/` :

- `tenant/` : gestion de l’entreprise, des magasins, du catalogue, de l’abonnement, des services et des types associés.
- `store/` : opérations du magasin et du POS, avec leurs services et types.
- `shared/` : authentification, contexte applicatif, routes, API commune, configuration, styles et types partagés.

La page d’abonnement et le contrôle d’accès associé sont regroupés dans `tenant/pages/subscriptions/` et `tenant/components/subscriptions/`.

Le seul fichier applicatif conservé directement dans `src/` est `main.tsx`, le point d’entrée requis par Vite. Les routes restent centralisées dans `shared/routes/AppRoutes.tsx`; cette organisation ne change ni les URL ni le comportement des portails.

Pour le fonctionnement détaillé, les parcours d’authentification, les responsabilités des portails, les permissions, l’API et les conventions d’évolution, consulter le [guide de fonctionnement](./docs/fonctionnement.md).
