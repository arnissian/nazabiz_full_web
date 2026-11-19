import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { Devise, DeviseQueryParams, DeviseScope, PaginatedDevisesResponse } from '../../types/devise';
import axiosInstance from '../../services/api/axiosInterceptor';

export const useDevises = (
  initialParams?: DeviseQueryParams,
  storeId?: string,
  enabled = true,
  scope: DeviseScope = storeId ? 'store' : 'tenant',
) => {
  const [devises, setDevises] = useState<Devise[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedDevisesResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<DeviseQueryParams>(initialParams || { page: 1, per_page: 15 });

  const fetchDevises = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const endpoint = scope === 'platform'
        ? '/devises'
        : scope === 'store'
          ? `/stores/${storeId}/devises`
          : '/tenant/devises';
      const res = await axiosInstance.get(endpoint, { params });

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data;
        const { data, ...paginationMeta } = paginatedData;

        setDevises(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des devises');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(
        (axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : null)
        || 'Erreur lors de la récupération des devises',
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, params, scope, storeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDevises();
  }, [fetchDevises]);

  return {
    devises,
    pagination,
    loading: loading && enabled,
    error,
    params,
    setParams,
    reFetch: fetchDevises,
  };
};
