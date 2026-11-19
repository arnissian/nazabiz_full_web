import type { CurrencyFormat } from '../types/currencyFormat';

/**
 * Service de formatage de devise
 */
export class CurrencyFormatter {
  static normalize(value: unknown): CurrencyFormat {
    let parsed = value;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        console.error('Format de devise enregistré invalide:', error);
        parsed = null;
      }
    }

    if (parsed === null || parsed === undefined || typeof parsed !== 'object' || Array.isArray(parsed)) {
      if (parsed !== null && parsed !== undefined) {
        console.error('Format de devise enregistré invalide.');
      }
      return {
        locale: 'fr',
        thousandsSeparator: ' ',
        decimalSeparator: ',',
        decimalPlaces: 2,
        symbolPosition: 'suffix',
      };
    }

    const format = parsed as Partial<CurrencyFormat>;
    return {
      locale: format.locale === 'en' ? 'en' : 'fr',
      thousandsSeparator: format.thousandsSeparator === ',' || format.thousandsSeparator === '.'
        ? format.thousandsSeparator
        : ' ',
      decimalSeparator: format.decimalSeparator === '.' ? '.' : ',',
      decimalPlaces: Number.isInteger(format.decimalPlaces)
        ? Math.max(0, Math.min(Number(format.decimalPlaces), 20))
        : 2,
      symbolPosition: format.symbolPosition === 'prefix' ? 'prefix' : 'suffix',
    };
  }

  /**
   * Formater un montant selon les options de formatage
   */
  static format(amount: number, format: CurrencyFormat, symbol: string): string {
    format = this.normalize(format);
    const {
      locale,
      thousandsSeparator,
      decimalSeparator,
      decimalPlaces,
      symbolPosition,
    } = format;

    // Assurer que les séparateurs sont valides
    const validThousandsSeparator = thousandsSeparator || ' ';
    const validDecimalSeparator = decimalSeparator || ',';

    // Créer un formateur Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    const formatted = formatter.formatToParts(amount)
      .map(part => {
        if (part.type === 'group') return validThousandsSeparator;
        if (part.type === 'decimal') return validDecimalSeparator;
        return part.value;
      })
      .join('');

    // Ajouter le symbole
    if (symbolPosition === 'prefix') {
      return `${symbol} ${formatted}`;
    } else {
      return `${formatted} ${symbol}`;
    }
  }

  /**
   * Formater avec les paramètres par défaut (français)
   */
  static formatDefault(amount: number, symbol: string = '€'): string {
    const defaultFormat: CurrencyFormat = {
      locale: 'fr',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
      decimalPlaces: 2,
      symbolPosition: 'suffix',
    };

    return this.format(amount, defaultFormat, symbol);
  }

  /**
   * Convertir un montant entre deux devises
   *
   * Convention : USD est la devise de référence avec rate = 1.0
   * Les autres devises sont exprimées par rapport au USD
   * Exemple : FC = 2800 (1 USD = 2800 FC), EUR = 0.92 (1 USD = 0.92 EUR)
   *
   * Formule : (montant / taux_source) * taux_destination
   */
  static convert(
    amount: number,
    fromRate: number,
    toRate: number,
    decimalPlaces = 2,
  ): number {
    if (fromRate <= 0) return amount;
    const converted = (amount / fromRate) * toRate;
    const precision = 10 ** decimalPlaces;
    return Math.round(converted * precision) / precision;
  }
}
