import { useState, useEffect, useCallback } from 'react';
import type { Category, CategoryQueryParams, PaginatedCategoriesResponse } from '../../types/category';
import axiosInstance from '../../services/api/axiosInterceptor';

export const useCategories = (initialParams?: CategoryQueryParams) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedCategoriesResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<CategoryQueryParams>(initialParams || { page: 1, per_page: 15 });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/categories', { params });

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data;
        const { data, ...paginationMeta } = paginatedData;

        setCategories(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des catégories');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des catégories');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchCategories,
  };
};
