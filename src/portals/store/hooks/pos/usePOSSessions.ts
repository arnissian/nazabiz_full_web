import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { POSSession } from '../../types/pos';

export const usePOSSessions = (initialParams: any = { page: 1, per_page: 15 }) => {
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/pos/sessions', { params });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : data?.data || [];
      setSessions(list);
      setPagination(Array.isArray(data) ? null : data);
      const open = list.find((s: POSSession) => s.status === 'open');
      setActiveSession(open || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur de récupération des sessions');
      setSessions([]);
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const openSession = async (payload: { store_id: string; opening_balance: number; notes?: string }) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post('/pos/sessions/open', payload);
      const newSession: POSSession = res.data?.data;
      setActiveSession(newSession);
      setSessions((prev) => [newSession, ...prev]);
      return { success: true, session: newSession };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de l\'ouverture de caisse'
      };
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async (payload: { session_id: string; closing_balance: number; notes?: string }) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post('/pos/sessions/close', payload);
      setActiveSession(null);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === payload.session_id
            ? { ...s, status: 'closed', closing_time: new Date().toISOString(), closing_balance: payload.closing_balance }
            : s
        )
      );
      return { success: true, message: res.data?.message || 'Session clôturée avec succès' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Erreur lors de la clôture de caisse'
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    activeSession,
    pagination,
    loading,
    error,
    params,
    setParams,
    openSession,
    closeSession,
    reFetch: fetchSessions
  };
};
