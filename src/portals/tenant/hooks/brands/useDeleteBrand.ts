import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteBrand = () => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const deleteBrand = async (id: string) => {
    try {
      setDeleting(true);
      const response = await axiosInstance.delete(`/brands/${id}`);
      const res = response.data;

      if (res.success || response.status === 200) {
        return { success: true, message: res.message || 'Marque supprimée avec succès.' };
      } else {
        return { success: false, message: res.message || 'Erreur lors de la suppression' };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression de la marque.',
      };
    } finally {
      setDeleting(false);
    }
  };

  return { deleteBrand, deleting };
};
