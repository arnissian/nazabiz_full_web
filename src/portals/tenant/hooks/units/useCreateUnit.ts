import { useState } from "react";
import axiosInstance from "../../../shared/services/api/axiosInterceptor";
export const useCreateUnit = () => {
  const [submitting, setSubmitting] = useState(false);
  const createUnit = async (payload: any) => {
    try {
      setSubmitting(true);
      const r = await axiosInstance.post("/units", payload);
      
      console.log(r)
      return {
        success: true,
        message: r.data?.message || "Opération réussie.",
        data: r.data?.data,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.message || "Erreur lors de l’opération.",
        errors: e?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };
  return { createUnit, submitting };
};
