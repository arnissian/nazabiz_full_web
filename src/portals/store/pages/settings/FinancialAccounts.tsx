import { useContext } from 'react';
import FinancialAccountsManager from '../../../shared/components/financial-accounts/FinancialAccountsManager';
import { AppContext } from '../../../shared/context/AppContext';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';

export default function StoreFinancialAccounts() {
  const { activeStore } = useContext(AppContext);
  const { formatFromUSD } = useStoreCurrencyConverter();

  return (
    <FinancialAccountsManager
      mode="store"
      activeStore={activeStore}
      formatBalance={formatFromUSD}
    />
  );
}
