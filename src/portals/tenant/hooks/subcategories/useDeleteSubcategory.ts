import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useDeleteSubcategory = () => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const deleteSubcategory = async (id: string) => {
    try {
      setDeleting(true);
      const response = await axiosInstance.delete(`/subcategories/${id}`);
      const res = response.data;

      if (res.success || response.status === 200) {
        return { success: true, message: res.message || 'Sous-catégorie supprimée avec succès.' };
      } else {
        return { success: false, message: res.message || 'Erreur lors de la suppression' };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression de la sous-catégorie.',
      };
    } finally {
      setDeleting(false);
    }
  };

  return { deleteSubcategory, deleting };
};
