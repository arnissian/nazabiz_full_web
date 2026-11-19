import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateQuotation = () => {
  const [submitting, setSubmitting] = useState(false);

  const createQuotation = async (payload: any) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/quotations', payload);
      return {
        success: true,
        message: res.data?.message || 'Devis créé avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la création du devis',
        errors: err?.response?.data?.errors
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createQuotation, submitting };
};
