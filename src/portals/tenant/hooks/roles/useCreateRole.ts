import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateRole = () => {
  const [submitting, setSubmitting] = useState(false);

  const createRole = async (payload: { name: string ;label: string;description?: string; permissions: string[] }) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/roles', payload);
      return {
        success: true,
        message: res.data?.message || 'Rôle créé avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la création du rôle'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createRole, submitting };
};
