import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

interface PurchaseReceiptLine {
  purchase_item_id: string;
  quantity: number;
  selling_price?: number;
}

export const useReceivePurchase = () => {
  const [submitting, setSubmitting] = useState(false);

  const receivePurchase = async (purchaseId: string, items: PurchaseReceiptLine[]) => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.post(`/purchases/${purchaseId}/receive`, { items });
      return {
        success: true,
        message: response.data?.message || 'Réception enregistrée avec succès.',
        data: response.data?.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Erreur lors de la réception.',
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { receivePurchase, submitting };
};
