import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { PaginationMeta } from '../../../shared/components/common/Pagination';

export interface StoreSummary {
  id: string;
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean | string | number;
  users_count?: number | string;
  users?: unknown[];
}

interface StoreParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

export const useStores = (
  initialParams: StoreParams = { page: 1, per_page: 10 },
  fetchAllPages = false,
) => {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams);

  const loadStores = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/stores', { params });
      const payload = response.data?.data;
      const allStores = Array.isArray(payload) ? [...payload] : [...(payload?.data || [])];
      if (fetchAllPages && payload && !Array.isArray(payload)) {
        for (let page = Number(payload.current_page || params.page || 1) + 1; page <= Number(payload.last_page || 1); page += 1) {
          const pageResponse = await axiosInstance.get('/stores', {
            params: { ...params, page },
          });
          const pageData = pageResponse.data?.data;
          if (Array.isArray(pageData?.data)) {
            allStores.push(...pageData.data);
          }
        }
      }
      setStores(allStores);
      setPagination(Array.isArray(payload) ? null : payload);
      setError(null);
    } catch (error: unknown) {
      const responseMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setError(typeof responseMessage === 'string' ? responseMessage : 'Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages, params]);

  useEffect(() => {
    // This effect keeps the list synchronized with the API when its filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStores();
  }, [loadStores]);

  const updateParams = useCallback((next: SetStateAction<StoreParams>) => {
    setLoading(true);
    setParams(next);
  }, []);

  const reFetch = useCallback(() => {
    setLoading(true);
    return loadStores();
  }, [loadStores]);

  return { stores, pagination, loading, error, params, setParams: updateParams, reFetch };
};