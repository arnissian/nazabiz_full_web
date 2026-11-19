import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

/**
 * Hook pour la création/récupération rapide d'un client par téléphone.
 * - Si le client existe déjà (même numéro) → il est retourné directement.
 * - Sinon → un nouveau client est créé avec le nom et le téléphone fournis.
 */
export const useQuickCreateCustomer = () => {
  const [submitting, setSubmitting] = useState(false);

  const quickCreateCustomer = async (payload: {
    name: string;
    phone: string;
  }) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/customers/quick-create', payload);
      return {
        success: true,
        message: res.data?.message || 'Client enregistré avec succès.',
        data: res.data?.data,
        isExisting: res.data?.is_existing || false,
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.response?.data?.message ||
          "Erreur lors de l'enregistrement du client.",
        errors: e?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { quickCreateCustomer, submitting };
};
