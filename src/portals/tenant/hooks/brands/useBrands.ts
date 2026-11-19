import { useState, useEffect, useCallback } from 'react';
import type { Brand, BrandQueryParams, PaginatedBrandsResponse } from '../../types/brand';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useBrands = (initialParams?: BrandQueryParams) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedBrandsResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<BrandQueryParams>(initialParams || { page: 1, per_page: 10 });

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/brands', { params });

      if (res.status === 200 && res.data.success) {
        const paginatedData = res.data.data;
        const { data, ...paginationMeta } = paginatedData;

        setBrands(data);
        setPagination(paginationMeta);
      } else {
        setError(res.data.message || 'Erreur lors de la récupération des marques');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des marques');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchBrands,
  };
};
