import { useState } from 'react';
import type { BrandPayload } from '../../types/brand';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const useUpdateBrand = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const updateBrand = async (id: number | string, payload: BrandPayload) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
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

      const response = await axiosInstance.post(`/brands/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const res = response.data;

      if (res.success || response.status === 200) {
        return {
          success: true,
          message: res.message || 'Marque modifiée avec succès.',
          data: res.data,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Erreur lors de la modification de la marque.',
        };
      }
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la modification de la marque.',
        errors: err?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateBrand, submitting };
};
