export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description?: string;
  permissions: string[]; // array of permission codes
  is_system?: boolean;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const AVAILABLE_PERMISSIONS: { module: string; moduleName: string; permissions: { code: string; label: string }[] }[] = [
  {
    module: 'pos',
    moduleName: 'Point de Vente (POS / Caisse)',
    permissions: [
      { code: 'pos.access', label: 'Accéder à la caisse' },
      { code: 'pos.session_manage', label: 'Ouvrir et clôturer les sessions' },
      { code: 'pos.discount', label: 'Appliquer des remises manuelles' },
    ]
  },
  {
    module: 'sales',
    moduleName: 'Ventes & Facturation',
    permissions: [
      { code: 'sales.view', label: 'Consulter les ventes' },
      { code: 'sales.create', label: 'Créer une vente' },
      { code: 'sales.edit', label: 'Modifier une vente' },
      { code: 'sales.delete', label: 'Supprimer une vente' },
    ]
  },
  {
    module: 'quotations',
    moduleName: 'Devis & Proformas',
    permissions: [
      { code: 'quotations.view', label: 'Consulter les devis' },
      { code: 'quotations.create', label: 'Créer un devis' },
      { code: 'quotations.edit', label: 'Modifier un devis' },
      { code: 'quotations.delete', label: 'Supprimer un devis' },
      { code: 'quotations.convert', label: 'Convertir un devis en vente' },
    ]
  },
  {
    module: 'stocks',
    moduleName: 'Produits & Stocks',
    permissions: [
      { code: 'products.view', label: 'Consulter le catalogue produits' },
      { code: 'products.create', label: 'Ajouter des produits' },
      { code: 'products.edit', label: 'Modifier les fiches produits' },
      { code: 'products.delete', label: 'Supprimer des produits' },
      { code: 'stocks.adjust', label: 'Ajuster le stock et faire des transferts' },
    ]
  },
  {
    module: 'purchases',
    moduleName: 'Achats & Fournisseurs',
    permissions: [
      { code: 'purchases.view', label: 'Consulter les achats' },
      { code: 'purchases.create', label: 'Créer un achat' },
      { code: 'purchases.edit', label: 'Modifier un achat' },
      { code: 'purchases.delete', label: 'Supprimer un achat' },
    ]
  },
  {
    module: 'expenses',
    moduleName: 'Dépenses & Charges',
    permissions: [
      { code: 'expenses.view', label: 'Consulter les dépenses' },
      { code: 'expenses.create', label: 'Enregistrer une dépense' },
      { code: 'expenses.edit', label: 'Modifier une dépense' },
      { code: 'expenses.delete', label: 'Supprimer une dépense' },
    ]
  },
  {
    module: 'reports',
    moduleName: 'Rapports & Statistiques',
    permissions: [
      { code: 'reports.sales', label: 'Voir les rapports des ventes' },
      { code: 'reports.stocks', label: 'Voir la valorisation des stocks' },
      { code: 'reports.financial', label: 'Voir le bilan financier & marge' },
    ]
  },
  {
    module: 'settings',
    moduleName: 'Paramètres & Utilisateurs',
    permissions: [
      { code: 'users.manage', label: 'Gérer les utilisateurs et accès' },
      { code: 'roles.manage', label: 'Gérer les rôles et permissions' },
      { code: 'settings.manage', label: 'Modifier la configuration de la société' },
    ]
  },
];
