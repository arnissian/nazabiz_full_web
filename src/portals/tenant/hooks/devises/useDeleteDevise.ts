import { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { DeviseScope } from '../../../shared/types/devise';

export const useDeleteDevise = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDevise = async (
    id: string,
    storeId?: string,
    scope: DeviseScope = storeId ? 'store' : 'tenant',
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = scope === 'platform'
        ? `/devises/${id}`
        : scope === 'store'
          ? `/stores/${storeId}/devises/${id}`
          : `/tenant/devises/${id}`;
      const res = await axiosInstance.delete(endpoint);

      if (res.status === 200 && res.data.success) {
        return true;
      } else {
        setError(res.data.message || 'Erreur lors de la suppression de la devise');
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      setError(
        (axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : null)
        || 'Erreur lors de la suppression de la devise',
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteDevise,
    loading,
    error,
  };
};
