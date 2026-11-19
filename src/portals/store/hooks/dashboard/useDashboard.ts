import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDashboard = (storeId?: string) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await axiosInstance.get('/dashboard', { params: { store_id: storeId } });
      setStatistics(r.data?.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la récupération des statistiques');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, reFetch: fetchStatistics };
};

export const useRecentSales = (storeId?: string, limit: number = 5) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await axiosInstance.get('/dashboard/recent-sales', { params: { store_id: storeId, limit } });
      setSales(r.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la récupération des ventes récentes');
    } finally {
      setLoading(false);
    }
  }, [storeId, limit]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, loading, error, reFetch: fetchSales };
};

export const useLowStock = (storeId?: string, limit: number = 10) => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await axiosInstance.get('/dashboard/low-stock', { params: { store_id: storeId, limit } });
      setStocks(r.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la récupération des alertes de stock');
    } finally {
      setLoading(false);
    }
  }, [storeId, limit]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return { stocks, loading, error, reFetch: fetchStocks };
};
