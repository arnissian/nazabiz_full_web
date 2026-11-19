import type { CurrencyFormat } from '../../shared/types/currencyFormat';

export interface TenantSettingsData {
  tenant_id: string;

  name: string;
  slug: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  logo_path: string | null;
  default_currency: string | null;
  default_language: string | null;
  timezone: string;
  default_tax: string | number;
  currency_format: CurrencyFormat;
  invoice_prefix: string;
  enable_2fa: boolean;
}
