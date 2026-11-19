import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface SalePayment {
  amount: number;
  payment_method: string;
  created_at?: string;
  date?: string;
  reference?: string;
  note?: string;
}

export interface Sale {
  id: number | string;
  reference?: string;
  status?: string;
  payment_status?: string;
  customer_id?: number | string;
  store_id?: number | string;
  total?: number;
  paid_amount?: number;
  balance?: number;
  remaining_amount?: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  created_at: string;
  due_date?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  store?: { name?: string };
  items?: Array<{
    id?: number | string;
    stock_id?: number | string;
    product?: { name?: string; sku?: string | null } | null;
    product_name?: string;
    product_id?: number | string;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    available_return_quantity?: number | string;
  }>;
  payments?: SalePayment[];
}

export const useSale = (id?: string | null) => {
  const [item, setItem] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const loadSale = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/sales/${id}`);
        if (!cancelled) {
          setItem(response.data?.data?.data ?? response.data?.data ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSale();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  return { item, loading, refresh };
};