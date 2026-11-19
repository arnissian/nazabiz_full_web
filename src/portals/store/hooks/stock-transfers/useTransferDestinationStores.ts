import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface TransferDestinationStore {
  id: string | number;
  name: string;
}

interface StoresPage {
  data?: TransferDestinationStore[];
  last_page?: number;
}

export function useTransferDestinationStores() {
  const [stores, setStores] = useState<TransferDestinationStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const firstPage = await axiosInstance.get('/stores', {
        params: { page: 1, per_page: 100 },
      });
      const payload = firstPage.data?.data as TransferDestinationStore[] | StoresPage | undefined;

      if (Array.isArray(payload)) {
        setStores(payload);
        return;
      }

      const allStores = [...(payload?.data || [])];
      const lastPage = payload?.last_page || 1;

      for (let page = 2; page <= lastPage; page += 1) {
        const response = await axiosInstance.get('/stores', {
          params: { page, per_page: 100 },
        });
        const pagePayload = response.data?.data as TransferDestinationStore[] | StoresPage | undefined;
        allStores.push(...(Array.isArray(pagePayload) ? pagePayload : pagePayload?.data || []));
      }

      setStores(allStores);
    } catch (requestError: unknown) {
      const responseMessage = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(responseMessage || 'Impossible de charger la liste des magasins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadStores);
  }, [loadStores]);

  return { stores, loading, error, reFetch: loadStores };
}
