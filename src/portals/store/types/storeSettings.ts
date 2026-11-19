export interface StoreSettings {
  id: string;
  store_id: string;

  // Coordonnées du magasin
  phone?: string;
  email?: string;
  address?: string;

  // Paramètres financiers
  default_currency?: string;
  currency_format?: CurrencyFormat;
  default_tax?: number;
  discount_max_percent?: number;
  credit_limit?: number;
  allow_credit?: boolean;

  // Paramètres linguistiques
  default_language?: string;
  timezone?: string;
  date_format?: string;

  // Paramètres POS
  pos_receipt_header?: string;
  pos_receipt_footer?: string;
  pos_receipt_serial?: string;
  auto_print_receipt?: boolean;
  receipt_copies?: number;
  paper_size?: string;
  cash_rounding_rule?: string;

  // Paramètres de facturation
  invoice_serial?: string;
  invoice_footer?: string;
  payment_terms?: string;
  invoice_due_days?: number;

  // Paramètres de devis
  quotation_validity_days?: number;
  quotation_prefix?: string;
  quotation_header?: string;
  quotation_footer?: string;
  quotation_default_terms?: string;

  // Paramètres de stock
  low_stock_threshold?: number;
  out_of_stock_threshold?: number;
  enable_expiry_management?: boolean;
  enable_batch_management?: boolean;
  reorder_point?: number;

  // Paramètres de vente
  min_sale_price?: number;
  require_customer_for_sale?: boolean;
  allow_percentage_discount?: boolean;
  allow_zero_price_sale?: boolean;

  // Paramètres de caisse
  default_opening_amount?: number;
  require_close_cash_register?: boolean;
  cash_tolerance?: number;
  cashier_pin?: string;
  auto_lock_minutes?: number;

  // Paramètres de paiement
  enable_mobile_money?: boolean;
  enable_card_payment?: boolean;
  enable_transfer_payment?: boolean;
  mobile_money_providers?: any;
  payment_gateway_config?: any;

  // Paramètres d'expédition
  default_shipping_cost?: number;
  free_shipping_threshold?: number;
  shipping_zones?: any;

  // Paramètres de retour
  return_period_days?: number;
  return_conditions?: string;
  require_receipt_for_return?: boolean;

  // Paramètres de promotion
  enable_promotions?: boolean;
  promotion_rules?: any;

  // Paramètres de notification
  enable_stock_alerts?: boolean;
  enable_sales_notifications?: boolean;
  enable_cash_register_notifications?: boolean;
  notification_emails?: string;

  // Paramètres de reporting
  auto_report_schedule?: string;
  report_recipients?: string;

  // Paramètres de sécurité
  session_timeout_minutes?: number;
  max_concurrent_sessions?: number;
  require_pin_for_sensitive?: boolean;
  enable_2fa?: boolean;

  // Paramètres d'approvisionnement
  default_supplier_for_reorder?: string;
  auto_reorder_enabled?: boolean;

  // Paramètres d'export
  default_export_format?: string;

  // Métadonnées
  metadata?: any;

  created_at?: string;
  updated_at?: string;
}

export interface CurrencyFormat {
  locale: 'fr' | 'en';
  thousandsSeparator: ',' | '.' | ' ';
  decimalSeparator: ',' | '.';
  decimalPlaces: number;
  symbolPosition: 'prefix' | 'suffix';
}
