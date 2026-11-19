import { useContext } from 'react';
import { AppContext } from '../../../shared/context/AppContext';
import type { CurrencyFormat } from '../../../shared/types/currencyFormat';
import type { Devise } from '../../../shared/types/devise';
import { CurrencyFormatter } from '../../../shared/services/currencyFormatter';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { useDevises } from '../../../shared/hooks/devises/useDevises';

interface UseStoreCurrencyConverterReturn {
  formatAmount: (amount: number, customFormat?: CurrencyFormat, customSymbol?: string) => string;
  formatFromUSD: (amountInUSD: number, customFormat?: CurrencyFormat, customSymbol?: string) => string;
  convertCurrency: (
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    decimalPlaces?: number,
  ) => Promise<number>;
  formatConverted: (amount: number, fromCurrencyId: string, toCurrencyId: string) => Promise<string>;
  format: CurrencyFormat | null;
  defaultCurrency: string | null;
  loading: boolean;
}

const defaultFormat: CurrencyFormat = {
  locale: 'fr',
  thousandsSeparator: ' ',
  decimalSeparator: ',',
  decimalPlaces: 2,
  symbolPosition: 'suffix',
};

const getRate = (devise: Pick<Devise, 'code' | 'rate'>): number =>
  devise.code.toUpperCase() === 'USD' ? 1 : devise.rate;

export const useStoreCurrencyConverter = (): UseStoreCurrencyConverterReturn => {
  const { activeStore, storeSettings } = useContext(AppContext);
  const { devises } = useDevises(
    { per_page: 100, is_active: true },
    activeStore?.id,
    Boolean(activeStore?.id),
    'store',
  );
  const format = CurrencyFormatter.normalize(storeSettings?.currency_format || defaultFormat);
  const defaultCurrencyId = storeSettings?.default_currency;
  const selectedCurrency = devises.find((devise: Devise) =>
    String(devise.id) === String(defaultCurrencyId),
  ) || devises.find((devise: Devise) => devise.code.toUpperCase() === 'USD');
  const defaultCurrency = selectedCurrency?.id || null;
  const defaultCurrencySymbol = selectedCurrency?.symbol || '$';
  const loading = !storeSettings;

  /**
   * Formater un montant selon les préférences configurées
   * (montant déjà dans la devise par défaut)
   */
  const formatAmount = (
    amount: number,
    customFormat?: CurrencyFormat,
    customSymbol?: string
  ): string => {
    const currentFormat = customFormat || format;

    // Récupérer le symbole de la devise par défaut si non fourni
    const symbol = customSymbol || defaultCurrencySymbol;

    return CurrencyFormatter.format(amount, currentFormat, symbol);
  };

  /**
   * Formater un montant depuis USD vers la devise par défaut
   *
   * Convention : Tous les prix dans le système sont en USD
   * Cette méthode convertit automatiquement de USD vers la devise par défaut
   *
   * Exemple : formatFromUSD(3) avec FC (taux 2800) → "8 400,00 FC"
   */
  const formatFromUSD = (
    amountInUSD: number,
    customFormat?: CurrencyFormat,
    customSymbol?: string
  ): string => {
    const currentFormat = customFormat || format;
    // Si la devise par défaut est USD, pas de conversion
    const convertedAmount = selectedCurrency?.code.toUpperCase() === 'USD' || !selectedCurrency?.rate
      ? amountInUSD
      : CurrencyFormatter.convert(
        amountInUSD,
        1,
        getRate(selectedCurrency),
        currentFormat.decimalPlaces,
      );

    return formatAmount(convertedAmount, currentFormat, customSymbol);
  };

  /**
   * Convertir un montant entre deux devises
   *
   * Convention : USD est la devise de référence avec rate = 1.0
   * Les autres devises sont exprimées par rapport au USD
   * Exemple : FC = 2800 (1 USD = 2800 FC), EUR = 0.92 (1 USD = 0.92 EUR)
   *
   * Formule : (montant / taux_source) * taux_destination
   */
  const convertCurrency = async (
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    decimalPlaces = 2,
  ): Promise<number> => {
    try {
      if (!activeStore?.id) throw new Error('Aucun magasin actif pour convertir cette devise.');
      const getDevise = async (id: string): Promise<Devise> => {
        const cachedDevise = devises.find((devise: Devise) => String(devise.id) === String(id));
        if (cachedDevise) return cachedDevise;
        const response = await axiosInstance.get(`/stores/${activeStore?.id}/devises/${id}`);
        const devise = response.data?.data ?? response.data?.result ?? response.data;
        if (!devise || typeof devise !== 'object' || !devise.id) {
          throw new Error(`Devise introuvable pour l’identifiant ${id}.`);
        }
        return devise as Devise;
      };
      const [fromDevise, toDevise] = await Promise.all([
        getDevise(fromCurrencyId),
        getDevise(toCurrencyId),
      ]);

      return CurrencyFormatter.convert(
        amount,
        getRate(fromDevise),
        getRate(toDevise),
        decimalPlaces,
      );
    } catch (error) {
      console.error('Erreur lors de la conversion de devise:', error);
      throw error;
    }
  };

  /**
   * Convertir et formater en une seule opération
   */
  const formatConverted = async (
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string
  ): Promise<string> => {
    try {
      if (!activeStore?.id) throw new Error('Aucun magasin actif pour formater cette devise.');
      const [convertedAmount, toDevise] = await Promise.all([
        convertCurrency(amount, fromCurrencyId, toCurrencyId, format.decimalPlaces),
        (async () => {
          const cachedDevise = devises.find((devise: Devise) => String(devise.id) === String(toCurrencyId));
          if (cachedDevise) return cachedDevise;
          const response = await axiosInstance.get(`/stores/${activeStore?.id}/devises/${toCurrencyId}`);
          const devise = response.data?.data ?? response.data?.result ?? response.data;
          if (!devise || typeof devise !== 'object' || !devise.id) {
            throw new Error(`Devise introuvable pour l’identifiant ${toCurrencyId}.`);
          }
          return devise as Devise;
        })(),
      ]);

      return formatAmount(convertedAmount, undefined, toDevise.symbol);
    } catch (error) {
      console.error('Erreur lors du formatage converti:', error);
      throw error;
    }
  };

  return {
    formatAmount,
    formatFromUSD,
    convertCurrency,
    formatConverted,
    format,
    defaultCurrency,
    loading,
  };
};
