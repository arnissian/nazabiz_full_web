import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface ReceivableSale {
  id: string | number;
  reference: string;
  total: number;
  remaining_amount: number;
  paid_amount: number;
  due_date?: string | null;
  payment_status: string;
  created_at: string;
  store_name: string | null;
}

export interface ReceivableCustomer {
  id: string | number;
  name: string;
  phone?: string | null;
  total_outstanding: number;
  sales_count: number;
  oldest_due_date?: string | null;
  sales: ReceivableSale[];
}

export interface ReceivablesReport {
  customers: ReceivableCustomer[];
  total_outstanding: number;
  total_customers: number;
  overdue_count: number;
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export const useReceivables = (params: { store_id?: string } = {}) => {
  const [data, setData] = useState<ReceivablesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/reports/receivables', { params });
      setData(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la récupération des créances');
    } finally {
      setLoading(false);
    }
  }, [params.store_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, reFetch: fetchData };
};
