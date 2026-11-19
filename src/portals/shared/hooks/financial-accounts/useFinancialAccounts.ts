import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../services/api/axiosInterceptor';

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_money';
  currency: string | null;
  store_id: string | null;
  store?: { id: string; name: string } | null;
  opening_balance: string;
  current_balance: string;
  is_active: boolean;
}

export interface FinancialAccountTransaction {
  id: string;
  amount: string;
  description: string | null;
  transaction_date?: string | null;
  payment_method?: string | null;
  reference?: string | null;
  created_at: string;
  account?: Pick<FinancialAccount, 'id' | 'name' | 'type'> | null;
}

export interface FinancialAccountDashboard {
  groups: Array<{
    type: FinancialAccount['type'];
    account_count: number;
    balance: string;
  }>;
  recent_transactions: FinancialAccountTransaction[];
}

export function useFinancialAccounts(
  isActive: boolean | 'all' | undefined = true,
  storeId?: string | null,
  scope: 'tenant' | 'store' = 'tenant',
  allStores = false,
) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [dashboard, setDashboard] = useState<FinancialAccountDashboard>({
    groups: [],
    recent_transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const basePath = scope === 'store' ? '/pos/financial-accounts' : '/financial-accounts';
      const params = {
        ...(isActive === undefined ? {} : { is_active: isActive }),
        ...(storeId ? { store_id: storeId } : {}),
        ...(allStores ? { all_stores: true } : {}),
      };
      const dashboardParams = {
        ...params,
        ...(isActive === 'all' ? { is_active: true } : {}),
      };
      const [response, dashboardResponse] = await Promise.all([
        axiosInstance.get(basePath, { params }),
        axiosInstance.get(`${basePath}/dashboard`, { params: dashboardParams }),
      ]);
      setAccounts(response.data?.data || []);
      setDashboard(dashboardResponse.data?.data || { groups: [], recent_transactions: [] });
    } catch (loadError) {
      setError('Impossible de charger les comptes de trésorerie.');
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [allStores, isActive, scope, storeId]);

  useEffect(() => {
    // Load the active tenant's accounts when the consumer mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload().catch((loadError: unknown) => {
      console.error('Erreur de chargement des comptes de trésorerie.', loadError);
    });
  }, [reload]);

  return { accounts, dashboard, loading, error, reload };
}
