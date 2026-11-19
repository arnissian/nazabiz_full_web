import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { ExpenseCategory } from '../../types/expense';

export const useExpenseCategories = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/expense-categories');
      const d = res.data?.data;
      setCategories(Array.isArray(d) ? d : d?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (name: string, description?: string, color?: string) => {
    try {
      const res = await axiosInstance.post('/expense-categories', { name, description, color });
      const newCat: ExpenseCategory = res.data?.data;
      if (newCat) {
        setCategories((prev) => [...prev, newCat]);
      }
      return { success: true, message: res.data?.message || 'Catégorie créée avec succès', data: newCat };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la création de la catégorie'
      };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, createCategory, reFetch: fetchCategories };
};
