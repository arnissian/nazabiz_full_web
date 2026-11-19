import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteLanguage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteLanguage = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.delete(`/languages/${id}`);

      if (res.status === 200 && res.data.success) {
        return true;
      } else {
        setError(res.data.message || 'Erreur lors de la suppression de la langue');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la suppression de la langue');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteLanguage,
    loading,
    error,
  };
};
