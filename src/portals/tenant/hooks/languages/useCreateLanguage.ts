import { useState } from 'react';
import type { LanguagePayload, Language } from '../../../shared/types/language';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateLanguage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createLanguage = async (payload: LanguagePayload): Promise<Language | null> => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.post('/languages', payload);

      if (res.status === 201 && res.data.success) {
        return res.data.data;
      } else {
        setError(res.data.message || 'Erreur lors de la création de la langue');
        return null;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors de la création de la langue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createLanguage,
    loading,
    error,
  };
};
