import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { Quotation } from '../../types/quotation';

export interface QuotationQueryParams {
  page: number;
  per_page: number;
  search?: string;
  status?: string;
  store_id?: string;
}

interface QuotationPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null && 'message' in data) {
        return typeof data.message === 'string' ? data.message : undefined;
      }
    }
  }
  return 'message' in error && typeof error.message === 'string' ? error.message : undefined;
};

export const useQuotations = (
  initialParams: QuotationQueryParams = { page: 1, per_page: 10 },
) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<QuotationPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<QuotationQueryParams>(initialParams);
  const requestId = useRef(0);

  const fetchQuotations = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/quotations', { params });
      if (currentRequestId !== requestId.current) return;

      const result = response.data?.data;
      if (Array.isArray(result)) {
        setQuotations(result);
        setPagination(null);
      } else if (
        typeof result === 'object'
        && result !== null
        && 'data' in result
        && Array.isArray(result.data)
      ) {
        setQuotations(result.data);
        setPagination(result as QuotationPagination);
      } else {
        throw new Error('Le serveur a retourné une réponse invalide pour les devis.');
      }
    } catch (fetchError: unknown) {
      if (currentRequestId === requestId.current) {
        setError(getErrorMessage(fetchError) || 'Erreur lors de la récupération des devis.');
        setQuotations([]);
        setPagination(null);
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    // Keep the asynchronous request lifecycle synchronized with the query parameters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    quotations,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch: fetchQuotations,
  };
};
