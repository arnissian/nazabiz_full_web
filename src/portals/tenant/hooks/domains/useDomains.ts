import { useState, useEffect, useCallback } from 'react';
import type { Domain, PaginatedDomainsResponse } from '../../types/domain';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface DomainQueryParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const useDomains = (initialParams?: DomainQueryParams) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedDomainsResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<DomainQueryParams>(initialParams || { page: 1, per_page: 5 });

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(params)

      // Envoi explicite des paramètres (page, per_page, search, etc.)
      const res = await axiosInstance.get('/domains', { params });
    

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data; // Contient current_page, data[], total, etc.
        const { data, ...paginationMeta } = paginatedData;

        setDomains(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des domaines');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des domaines');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  return {
    domains,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchDomains,
  };
};