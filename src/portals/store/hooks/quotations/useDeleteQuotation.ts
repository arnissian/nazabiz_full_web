import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteQuotation = () => {
  const [submitting, setSubmitting] = useState(false);

  const deleteQuotation = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.delete(`/quotations/${id}`);
      return {
        success: true,
        message: res.data?.message || 'Devis supprimé avec succès'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression du devis'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { deleteQuotation, submitting };
};
