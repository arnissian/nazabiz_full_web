import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteExpense = () => {
  const [submitting, setSubmitting] = useState(false);

  const deleteExpense = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.delete(`/expenses/${id}`);
      return {
        success: true,
        message: res.data?.message || 'Dépense supprimée avec succès'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression de la dépense'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { deleteExpense, submitting };
};
