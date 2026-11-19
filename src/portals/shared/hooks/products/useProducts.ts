import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../../services/api/axiosInterceptor';

export interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  purchase_price?: number | string | null;
  selling_price?: number | string | null;
  price?: number | string | null;
}

export interface ProductQueryParams {
  page: number;
  per_page: number;
  is_active?: boolean;
  search?: string;
  store_id?: string;
}

interface ProductPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const getResponseErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return undefined;
  const data = response.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
};

export const useProducts = (
  initialParams: ProductQueryParams = { page: 1, per_page: 10 },
) => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ProductQueryParams>(initialParams);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    try {
      setLoading(true);
      setError(null);
      const endpoint = params.search ? '/products/search' : '/products';
      const response = await axiosInstance.get(endpoint, { params });

      if (currentRequestId !== requestId.current) return;

      const result = response.data?.data;
      setProducts(Array.isArray(result) ? result : result?.data || []);
      setPagination(Array.isArray(result) ? null : result);
    } catch (fetchError: unknown) {
      if (currentRequestId === requestId.current) {
        setError(
          getResponseErrorMessage(fetchError) || 'Erreur lors de la récupération des données',
        );
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, pagination, loading, error, params, setParams, reFetch: fetchData };
};