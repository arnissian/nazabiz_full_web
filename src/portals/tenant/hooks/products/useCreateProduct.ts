import { useState } from "react";
import axiosInstance from "../../../shared/services/api/axiosInterceptor";

export const useCreateProduct = () => {
  const [submitting, setSubmitting] = useState(false);
  const createProduct = async (payload: any) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "boolean")
            formData.append(key, value ? "1" : "0");
          else formData.append(key, value as any);
        }
      });
      const r = await axiosInstance.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        success: true,
        message: r.data?.message || "Produit créé avec succès.",
        data: r.data?.data,
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.response?.data?.message ||
          "Erreur lors de la création du produit.",
        errors: e?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };
  return { createProduct, submitting };
};
