export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface Expense {
  id: string;
  reference: string;
  store_id: string;
  store?: { id: string; name: string };
  category_id: string;
  category?: ExpenseCategory;
  account_id?: string | null;
  account?: { id: string; name: string; type: string; store_id?: string | null } | null;
  amount: number;
  date: string;
  payment_method: string;
  reference_no?: string; // N° de facture ou reçu de dépense
  notes?: string;
  receipt_image?: string;
  created_at?: string;
  updated_at?: string;
}
