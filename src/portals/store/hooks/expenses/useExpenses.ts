import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { Expense } from '../../types/expense';

export const useExpenses = (initialParams: any = { page: 1, per_page: 10 }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/expenses', { params });
      const d = res.data?.data;
      setExpenses(Array.isArray(d) ? d : d?.data || []);
      setPagination(Array.isArray(d) ? null : d);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des dépenses');
      setExpenses([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchExpenses
  };
};
