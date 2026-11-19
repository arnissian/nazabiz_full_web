export interface POSSession {
  id: string;
  store_id: string;
  store_name?: string;
  user_id?: string;
  user_name?: string;
  opening_time: string;
  closing_time?: string | null;
  opening_balance: number;
  closing_balance?: number | null;
  cash_sales: number;
  total_sales: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface POSCartItem {
  id: string;
  stock_id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  quantity: number;
  discount: number; // en montant ou pourcentage
  total: number;
  unit_name?: string;
  stock?: number;
}
