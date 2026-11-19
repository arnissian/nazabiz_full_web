export interface AppSettings {
  // Identifiants & Méta-données
  id: string;
  slug: string;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  user: unknown | null;

  // Informations générales
  organization_name: string;
  organization_short_name: string | null;
  organization_description: string | null;
  organization_logo: string | null;
  organization_website: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  organization_address: string | null;
  organization_city: string | null;
  organization_country: string | null;

  // Paramètres régionaux
  default_country: string;
  default_currency: string;
  default_language: string;
  timezone: string;

  // Apparence
  primary_color: string;
  secondary_color: string;
  logo_dark: string | null;
  logo_light: string | null;
  favicon: string | null;

  // Dons (Note: les montants sont sous forme de string dans le JSON)
  donation_min_amount: string;
  donation_max_amount: string;
  donation_default_amount: string;
  enable_recurring_donations: boolean;
  enable_corporate_sponsorship: boolean;

  // Communication & Notifications
  admin_email: string | null;
  notification_email: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  email_signature: string | null;

  // Sécurité
  enable_2fa: boolean;
  session_timeout: number;
  max_login_attempts: number;
  password_policy: 'low' | 'medium' | 'high';

  // Modules activés
  enable_projects: boolean;
  enable_activities: boolean;
  enable_emergencies: boolean;
  enable_beneficiaries: boolean;
  enable_indicators: boolean;
  enable_partnerships: boolean;
  enable_donations: boolean;
  enable_reports: boolean;
  enable_news: boolean;
  enable_publications: boolean;
  enable_contacts: boolean;

  // Propriétés personnalisées & thèmes dynamiques
  [key: string]: any;
}