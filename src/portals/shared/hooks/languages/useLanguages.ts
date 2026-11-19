import { useState, useEffect, useCallback } from 'react';
import type { Language, LanguageQueryParams, PaginatedLanguagesResponse } from '../../types/language';
import axiosInstance from '../../services/api/axiosInterceptor';

export const useLanguages = (initialParams?: LanguageQueryParams) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedLanguagesResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<LanguageQueryParams>(initialParams || { page: 1, per_page: 15 });

  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/languages', { params });

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data;
        const { data, ...paginationMeta } = paginatedData;

        setLanguages(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des langues');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des langues');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchLanguages,
  };
};
