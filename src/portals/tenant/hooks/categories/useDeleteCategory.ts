import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteCategory = () => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const deleteCategory = async (id: string) => {
    try {
      setDeleting(true);
      const response = await axiosInstance.delete(`/categories/${id}`);
      const res = response.data;

      if (res.success || response.status === 200) {
        return { success: true, message: res.message || 'Catégorie supprimée avec succès.' };
      } else {
        return { success: false, message: res.message || 'Erreur lors de la suppression' };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression de la catégorie.',
      };
    } finally {
      setDeleting(false);
    }
  };

  return { deleteCategory, deleting };
};
