import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateRole = () => {
  const [submitting, setSubmitting] = useState(false);

  const updateRole = async (id: string, payload: { name: string;label: string; description?: string; permissions: string[] }) => {
    try {
      setSubmitting(true);
    //   alert(payload.label)
    //  console.log('form : ',payload)
      const res = await axiosInstance.put(`/roles/${id}`, payload);
      return {
        success: true,
        message: res.data?.message || 'Rôle mis à jour avec succès',
        data: res.data?.data
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la mise à jour du rôle'
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateRole, submitting };
};
