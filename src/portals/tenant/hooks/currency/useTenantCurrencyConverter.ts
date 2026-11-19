import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { CurrencyFormat } from '../../../shared/types/currencyFormat';
import type { Devise } from '../../../shared/types/devise';
import { CurrencyFormatter } from '../../../shared/services/currencyFormatter';
import { useDevises } from '../../../shared/hooks/devises/useDevises';
import { AppContext } from '../../../shared/context/AppContext';

const defaultFormat: CurrencyFormat = {
  locale: 'fr',
  thousandsSeparator: ' ',
  decimalSeparator: ',',
  decimalPlaces: 2,
  symbolPosition: 'suffix',
};

export const useTenantCurrencyConverter = () => {
  const { tenantSettings, getTenantSettings } = useContext(AppContext);
  const [loading, setLoading] = useState(!tenantSettings);
  const [error, setError] = useState<string | null>(null);
  const { devises, loading: devisesLoading, error: devisesError } = useDevises(
    { per_page: 100, is_active: true },
    undefined,
    true,
    'tenant',
  );

  useEffect(() => {
    let cancelled = false;

    const loadTenantSettings = async () => {
      try {
        if (!tenantSettings) {
          const settings = await getTenantSettings();
          if (!settings) {
            throw new Error('Les paramètres de devise de l’entreprise sont indisponibles.');
          }
        }
        if (!cancelled) setError(null);
      } catch (error: unknown) {
        console.error('Erreur lors du chargement des paramètres de devise de l’entreprise:', error);
        if (!cancelled) {
          setError(
            (axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : null)
            || 'Impossible de charger les paramètres de devise de l’entreprise.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTenantSettings();
    return () => {
      cancelled = true;
    };
  }, [tenantSettings, getTenantSettings]);

  const defaultCurrency = tenantSettings?.default_currency ?? null;
  const format = CurrencyFormatter.normalize(tenantSettings?.currency_format ?? defaultFormat);
  const selectedCurrency = devises.find((devise: Devise) => devise.id === defaultCurrency)
    || devises.find((devise: Devise) => devise.code === 'USD');
  const currencySymbol = selectedCurrency?.symbol || '$';

  const formatFromUSD = (amountInUSD: number): string => {
    const convertedAmount = selectedCurrency?.code.toUpperCase() === 'USD' || !selectedCurrency?.rate
      ? amountInUSD
      : CurrencyFormatter.convert(
        amountInUSD,
        1,
        selectedCurrency.rate,
        format.decimalPlaces,
      );

    return CurrencyFormatter.format(convertedAmount, format, currencySymbol);
  };

  return {
    formatFromUSD,
    format,
    defaultCurrency,
    loading: loading || devisesLoading,
    error: error || devisesError,
  };
};
