import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateExpense = () => {
  const [submitting, setSubmitting] = useState(false);

  const updateExpense = async (id: string, payload: any) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.put(`/expenses/${id}`, payload);
      return {
        success: true,
        message: res.data?.message || 'Dépense mise à jour avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la modification de la dépense'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateExpense, submitting };
};
