import { useState } from 'react';
import axios from 'axios';
import type { DevisePayload, Devise, DeviseScope } from '../../../shared/types/devise';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateDevise = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateDevise = async (
    id: string,
    payload: DevisePayload,
    storeId?: string,
    scope: DeviseScope = storeId ? 'store' : 'tenant',
  ): Promise<Devise | null> => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = scope === 'platform'
        ? `/devises/${id}`
        : scope === 'store'
          ? `/stores/${storeId}/devises/${id}`
          : `/tenant/devises/${id}`;
      const res = await axiosInstance.put(endpoint, payload);

      if (res.status === 200 && res.data.success) {
        return res.data.data;
      } else {
        setError(res.data.message || 'Erreur lors de la modification de la devise');
        return null;
      }
    } catch (err: unknown) {
      console.error(err);
      setError(
        (axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : null)
        || 'Erreur lors de la modification de la devise',
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateDevise,
    loading,
    error,
  };
};
