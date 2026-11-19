export interface CurrencyFormat {
  locale: 'fr' | 'en';
  thousandsSeparator: ',' | '.' | ' ';
  decimalSeparator: ',' | '.';
  decimalPlaces: number;
  symbolPosition: 'prefix' | 'suffix';
}

export interface CurrencyFormatSettings {
  currencyFormat: CurrencyFormat;
  defaultCurrency: string;
  defaultLanguage: string;
}
