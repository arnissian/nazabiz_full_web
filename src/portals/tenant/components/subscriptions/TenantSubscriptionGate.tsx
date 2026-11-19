import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../../shared/context/AppContext';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

export default function TenantSubscriptionGate() {
  const { auth } = useContext(AppContext);
  const isSuperAdmin = auth?.user?.roles?.some(role => role.name === 'super_admin') ?? false;
  const [canAccessManagement, setCanAccessManagement] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (isSuperAdmin) return;

    let active = true;

    const verifyAccess = async () => {
      setCanAccessManagement(null);
      setError('');
      try {
        const response = await axiosInstance.get('/tenant/subscription/access');
        if (active) {
          setCanAccessManagement(response.data.data.can_access_management === true);
        }
      } catch (requestError: unknown) {
        if (active) {
          setError(axios.isAxiosError<{ message?: string }>(requestError)
            ? requestError.response?.data?.message || 'Impossible de vérifier l’accès à la gestion.'
            : 'Une erreur inattendue est survenue pendant la vérification de l’abonnement.');
        }
      }
    };

    void verifyAccess();
    return () => {
      active = false;
    };
  }, [isSuperAdmin, retry]);

  if (!isSuperAdmin && error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert" aria-live="assertive">{error}</div>
        <button type="button" className="btn btn-outline-primary" onClick={() => setRetry(value => value + 1)}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!isSuperAdmin && canAccessManagement === null) {
    return null;
  }

  return isSuperAdmin || canAccessManagement
    ? <Outlet />
    : <Navigate to="/tenant-subscription" replace />;
}
