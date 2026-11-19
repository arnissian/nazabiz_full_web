import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteRole = () => {
  const [submitting, setSubmitting] = useState(false);

  const deleteRole = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.delete(`/roles/${id}`);
      return {
        success: true,
        message: res.data?.message || 'Rôle supprimé avec succès'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression du rôle'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { deleteRole, submitting };
};
