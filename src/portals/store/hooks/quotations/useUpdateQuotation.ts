import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateQuotation = () => {
  const [submitting, setSubmitting] = useState(false);

  const updateQuotation = async (id: string, payload: any) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.put(`/quotations/${id}`, payload);
      return {
        success: true,
        message: res.data?.message || 'Devis mis à jour avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la modification du devis'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateQuotation, submitting };
};
