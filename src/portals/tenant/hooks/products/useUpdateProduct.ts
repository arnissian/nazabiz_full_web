import { useState } from "react";
import axiosInstance from "../../../shared/services/api/axiosInterceptor";

export const useUpdateProduct = () => {
  const [submitting, setSubmitting] = useState(false);

  const updateProduct = async (id: string, payload: any) => {
    try {
      setSubmitting(true);

      const formData = new FormData();

      // ✅ Ajout des champs avec filtrage et conversion
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, value as any);
          }
        }
      });

      // ✅ Trick Laravel : POST + _method=PUT
      formData.append("_method", "PUT");

      const r = await axiosInstance.post(`/products/${id}`, formData);

      return {
        success: true,
        message: r.data?.message || "Produit modifié avec succès.",
        data: r.data?.data,
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.response?.data?.message ||
          "Erreur lors de la modification du produit.",
        errors: e?.response?.data?.errors,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return { updateProduct, submitting };
};
