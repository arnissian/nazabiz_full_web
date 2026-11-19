import { useState } from 'react';
import type { DomainPayload } from '../../types/domain';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateDomain = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const updateDomain = async (id: number | string, payload: DomainPayload) => {
    try {
      setSubmitting(true);
      // 1. Conversion du payload en FormData
      const formData = new FormData();

      // Astuce Laravel : Nécessaire pour simuler un PUT lors de l'envoi de fichiers
      formData.append('_method', 'PUT');

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      // 2. Requête POST vers l'URL /domains/{id}
      const response = await axiosInstance.post(`/domains/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const res = response.data;

      if (res.success || res.status === 200) {
        return {
          success: true,
          message: res.message || 'Domaine modifié avec succès.',
          data: res.data,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Erreur lors de la modification du domaine.',
        };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la modification du domaine.',
        errors: err?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateDomain, submitting };
};