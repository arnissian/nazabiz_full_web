export interface QuotationItem {
  id?: string;
  quotation_id?: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    selling_price?: number;
    unit?: { name: string };
  };
  quantity: number;
  reserved_quantity?: number;
  delivered_quantity?: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Quotation {
  id: string;
  reference: string;
  store_id: string;
  store?: { id: string; name: string };
  customer_id?: string | null;
  customer?: { id: string; name: string; email?: string; phone?: string; address?: string };
  date: string;
  expiry_date?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted' | 'ordered' | 'partially_delivered' | 'delivered';
  delivery_notes?: DeliveryNote[];
  notes?: string;
  terms?: string;
  items?: QuotationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryNote {
  id: string;
  reference: string;
  delivery_date: string;
  notes?: string | null;
  quotation?: {
    id: string;
    reference: string;
    customer?: { name: string; phone?: string | null; address?: string | null };
  };
  store?: { id: string; name: string };
  user?: { id: string; name: string };
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    product?: { id?: string; name: string; sku?: string | null };
  }>;
}
