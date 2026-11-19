import axios from 'axios';
import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface StorePayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface StoreUserContext {
  id: string;
  name: string;
  email: string;
  stores?: Array<{ id: string; name: string; code?: string; is_active: boolean }>;
  active_store?: { id: string; name: string; code?: string } | null;
}

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

export const useCreateStore = () => {
  const [submitting, setSubmitting] = useState(false);

  const createStore = async (payload: StorePayload) => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.post('/stores', payload);
      return {
        success: true as const,
        message: response.data?.message || 'Opération réussie.',
        data: response.data?.data,
        user: response.data?.user as StoreUserContext | undefined,
        active_store: response.data?.active_store as StoreUserContext['active_store'],
      };
    } catch (error: unknown) {
      const apiError = axios.isAxiosError<ApiError>(error) ? error.response?.data : undefined;
      return {
        success: false as const,
        message: apiError?.message || 'Erreur lors de l’opération.',
        errors: apiError?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { createStore, submitting };
};