import { useContext } from 'react';
import FinancialAccountsManager from '../../../shared/components/financial-accounts/FinancialAccountsManager';
import { AppContext } from '../../../shared/context/AppContext';
import { useStores } from '../../hooks/stores/useStores';
import { useTenantCurrencyConverter } from '../../hooks/currency/useTenantCurrencyConverter';

export default function FinancialAccounts() {
  const { activeStore } = useContext(AppContext);
  const { stores } = useStores({ page: 1, per_page: 100 }, true);
  const { formatFromUSD } = useTenantCurrencyConverter();

  return (
    <FinancialAccountsManager
      mode="tenant"
      activeStore={activeStore}
      formatBalance={formatFromUSD}
      stores={stores}
    />
  );
}
