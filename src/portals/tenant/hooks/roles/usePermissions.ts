import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export interface DbPermission {
  id: string;
  name: string;
  label?: string;
  module?: string;
  module_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedPermissionModule {
  module: string;
  moduleName: string;
  permissions: {
    id?: string;
    code: string;
    label: string;
  }[];
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<DbPermission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissionModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/permissions');
      const d = res.data?.data;
      const g = res.data?.grouped;

      setPermissions(Array.isArray(d) ? d : []);
      if (Array.isArray(g) && g.length > 0) {
        setGroupedPermissions(g);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = async (payload: { name: string; label?: string; module?: string; module_name?: string }) => {
    try {
      const res = await axiosInstance.post('/permissions', payload);
      await fetchPermissions();
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur création permission',
      };
    }
  };

  const updatePermission = async (id: string, payload: { name?: string; label?: string; module?: string; module_name?: string }) => {
    try {
      const res = await axiosInstance.put(`/permissions/${id}`, payload);
      await fetchPermissions();
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur modification permission',
      };
    }
  };

  const deletePermission = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/permissions/${id}`);
      await fetchPermissions();
      return { success: true, message: res.data?.message };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur suppression permission',
      };
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    groupedPermissions,
    loading,
    error,
    reFetch: fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  };
};
