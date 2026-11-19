import { useState } from 'react';
import { domainService } from '../../services/domainService';

export const useDeleteDomain = () => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const deleteDomain = async (id: string) => {
    try {
      setDeleting(true);
      const res = await domainService.deleteDomain(id);
      if (res.success) {
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message || 'Erreur lors de la suppression' };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la suppression du domaine',
      };
    } finally {
      setDeleting(false);
    }
  };

  return { deleteDomain, deleting };
};
