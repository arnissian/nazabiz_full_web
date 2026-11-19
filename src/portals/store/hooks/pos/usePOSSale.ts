import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export const usePOSSale = () => {
  const [submitting, setSubmitting] = useState(false);

  const processPOSSale = async (saleData: {
    store_id: string;
    customer_id?: string | null;
    items: Array<{ stock_id: string; product_id: string; quantity: number; unit_price?: number; discount?: number }>;
    payments: Array<{ payment_method: string; amount: number; reference?: string }>;
    discount?: number;
    tax?: number;
    notes?: string;
  }) => {
    try {
      setSubmitting(true);
      // Calls standard /sales endpoint with POS items
      const res = await axiosInstance.post('/sales', {
        ...saleData,
        is_pos: true,
      });
      return {
        success: true,
        data: res.data?.data || res.data,
        message: res.data?.message || 'Vente enregistrée avec succès'
      };
    } catch (err: any) {
      // If network/backend error, provide a simulated receipt fallback for testing if needed
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la validation de la vente',
        errors: err?.response?.data?.errors
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { processPOSSale, submitting };
};
