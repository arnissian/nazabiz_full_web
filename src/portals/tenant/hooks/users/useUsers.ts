import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { AppUser, CreateUserPayload, UpdateUserPayload } from '../../../shared/types/user';
import type { PaginationMeta } from '../../../shared/components/common/Pagination';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = axios.isAxiosError<ApiErrorResponse>(error) ? error.response?.data : undefined;
  return Object.values(response?.errors ?? {}).flat()[0] || response?.message || fallback;
};

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [params, setParams] = useState<{ search?: string; page?: number; per_page?: number }>({
    page: 1,
    per_page: 15,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/users', { params });
      const d = res.data?.data;

      if (d && Array.isArray(d.data)) {
        setUsers(d.data);
        setPagination({
          current_page: d.current_page,
          last_page: d.last_page,
          from: d.from,
          to: d.to,
          total: d.total,
          per_page: d.per_page,
        });
      } else if (Array.isArray(d)) {
        setUsers(d);
        setPagination(null);
      } else {
        setUsers([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const createUser = async (payload: CreateUserPayload) => {
    try {
      const res = await axiosInstance.post('/users',payload);
      
      await fetchUsers();

      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      return {
        success: false,
        message: getErrorMessage(err, 'Erreur lors de la création'),
        errors: axios.isAxiosError<ApiErrorResponse>(err) ? err.response?.data?.errors : undefined,
      };
    }
  };

  const updateUser = async (id: string, payload: UpdateUserPayload) => {
    try {
      const res = await axiosInstance.put(`/users/${id}`, payload);
      await fetchUsers();
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      return {
        success: false,
        message: getErrorMessage(err, 'Erreur lors de la modification'),
      };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/users/${id}`);
      await fetchUsers();
      return { success: true, message: res.data?.message };
    } catch (err: unknown) {
      return {
        success: false,
        message: getErrorMessage(err, 'Erreur lors de la suppression'),
      };
    }
  };

  const activateUserStore = async (userId: string, storeId: string) => {
    try {
      const res = await axiosInstance.post(`/users/${userId}/activate-store`, { store_id: storeId });
      await fetchUsers();
      return { success: true, message: res.data?.message };
    } catch (err: unknown) {
      return {
        success: false,
        message: getErrorMessage(err, 'Erreur lors de l\'activation du magasin'),
      };
    }
  };

  useEffect(() => {
    // Fetching users is a request side effect; fetchUsers owns loading/error state updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    params,
    setParams,
    reFetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    activateUserStore,
  };
};
