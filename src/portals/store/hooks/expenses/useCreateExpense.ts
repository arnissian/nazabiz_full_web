import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateExpense = () => {
  const [submitting, setSubmitting] = useState(false);

  const createExpense = async (payload: any) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/expenses', payload);
      return {
        success: true,
        message: res.data?.message || 'Dépense enregistrée avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de l\'enregistrement de la dépense',
        errors: err?.response?.data?.errors
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createExpense, submitting };
};
