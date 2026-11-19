import { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

type UpdateSaleResult = {
  success: boolean;
  message: string;
};

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Erreur lors de la modification.';
  }

  const data = error.response?.data as {
    message?: unknown;
    errors?: Record<string, unknown>;
  } | undefined;
  const validationMessage = Object.values(data?.errors ?? {})
    .flatMap((messages) => Array.isArray(messages) ? messages : [messages])
    .find((message): message is string => typeof message === 'string' && message.length > 0);

  return validationMessage
    || (typeof data?.message === 'string' ? data.message : null)
    || 'Erreur lors de la modification.';
}

export const useUpdateSale = () => {
  const [submitting, setSubmitting] = useState(false);

  const updateSale = async (
    id: string,
    payload: Record<string, unknown>,
  ): Promise<UpdateSaleResult> => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.put(`/sales/${id}`, payload);
      return {
        success: true,
        message: response.data?.message || 'Modification réussie.',
      };
    } catch (error: unknown) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateSale, submitting };
};