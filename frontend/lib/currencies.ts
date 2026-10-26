import { data } from "currency-codes";

type CurrencyRecord = (typeof data)[number];

export const DEFAULT_CURRENCY_CODE = "PHP";

export const supportedCurrencies = data
  .filter((currency) => !currency.countries.some((country) => country.startsWith("Zz")))
  .sort((left, right) => left.code.localeCompare(right.code));

export function getCurrency(code: string | null | undefined): CurrencyRecord | undefined {
  const normalized = code?.trim().toUpperCase();
  return supportedCurrencies.find((currency) => currency.code === normalized);
}

export function isSupportedCurrencyCode(code: string): boolean {
  return getCurrency(code) !== undefined;
}

export function formatCurrency(
  amount: number | string,
  code: string | null | undefined,
  locale?: string,
): string {
  const normalizedCode = code?.trim().toUpperCase();
  const currency = getCurrency(normalizedCode ?? DEFAULT_CURRENCY_CODE);
  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  if (!currency) {
    return `${normalizedCode ?? DEFAULT_CURRENCY_CODE} ${numericAmount.toLocaleString(locale)}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.digits,
    maximumFractionDigits: currency.digits,
  }).format(numericAmount);
}
