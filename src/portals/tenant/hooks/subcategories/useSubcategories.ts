import { useState, useEffect, useCallback } from 'react';
import type { Subcategory, SubcategoryQueryParams, PaginatedSubcategoriesResponse } from '../../types/subcategory';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useSubcategories = (initialParams?: SubcategoryQueryParams) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedSubcategoriesResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<SubcategoryQueryParams>(initialParams || { page: 1, per_page: 10 });

  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/subcategories', { params });

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data;
        const { data, ...paginationMeta } = paginatedData;

        setSubcategories(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des sous-catégories');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des sous-catégories');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  return {
    subcategories,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchSubcategories,
  };
};
