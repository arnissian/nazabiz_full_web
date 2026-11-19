import { useState } from 'react';
import type { DomainPayload } from '../../types/domain';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateDomain = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const createDomain = async (payload: DomainPayload) => {
    try {
      setSubmitting(true);

      // 1. Construction du FormData si payload contient un objet File / Blob
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Gère les booléens pour Laravel (1 ou 0)
          if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      // 2. Envoi avec le header multipart/form-data
      const response = await axiosInstance.post('/domains', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const res = response.data;

      if (res.success || res.status === 200 || res.status === 201) {
        return {
          success: true,
          message: res.message || 'Domaine créé avec succès.',
          data: res.data,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Erreur lors de la création du domaine.',
        };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la création du domaine.',
        errors: err?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createDomain, submitting };
};