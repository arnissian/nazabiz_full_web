import { useState } from 'react';
import axios from 'axios';
import type { DevisePayload, Devise, DeviseScope } from '../../../shared/types/devise';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateDevise = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createDevise = async (
    payload: DevisePayload,
    storeId?: string,
    scope: DeviseScope = storeId ? 'store' : 'tenant',
  ): Promise<Devise | null> => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = scope === 'platform'
        ? '/devises'
        : scope === 'store'
          ? `/stores/${storeId}/devises`
          : '/tenant/devises';
      const res = await axiosInstance.post(endpoint, payload);

      if (res.status === 201 && res.data.success) {
        return res.data.data;
      } else {
        setError(res.data.message || 'Erreur lors de la création de la devise');
        console.log(res.data.error)
        return null;
      }
    } catch (err: unknown) {
      console.error(err);
      setError(
        (axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : null)
        || 'Erreur lors de la création de la devise',
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDevise,
    loading,
    error,
  };
};
