import { useState } from 'react';
import type { CategoryPayload } from '../../../shared/types/category';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useCreateCategory = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const createCategory = async (payload: CategoryPayload) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      const response = await axiosInstance.post('/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const res = response.data;

      if (res.success || response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: res.message || 'Catégorie créée avec succès.',
          data: res.data,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Erreur lors de la création de la catégorie.',
        };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la création de la catégorie.',
        errors: err?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createCategory, submitting };
};
