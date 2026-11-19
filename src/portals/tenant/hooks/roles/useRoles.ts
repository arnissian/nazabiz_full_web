import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { Role } from '../../../shared/types/role';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/roles');
      const d = res.data?.data;
     
      setRoles(Array.isArray(d) ? d : d?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des rôles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, reFetch: fetchRoles };
};
