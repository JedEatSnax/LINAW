import { data, code as findCurrency } from "currency-codes";
import { z } from "zod";

export const DEFAULT_CURRENCY_CODE = "PHP";

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Currency code must be 3 characters.")
  .toUpperCase()
  .refine(isSupportedCurrencyCode, "Unsupported currency code.");

export const supportedCurrencies = data.filter(
  (currency) => !currency.countries.some((country) => country.startsWith("Zz")),
);

export function getCurrency(code: string | null | undefined) {
  const normalized = code?.trim().toUpperCase();

  if (!normalized) {
    return undefined;
  }

  const currency = findCurrency(normalized);
  return currency &&
    supportedCurrencies.some((item) => item.code === currency.code)
    ? currency
    : undefined;
}

export function isSupportedCurrencyCode(code: string): boolean {
  return getCurrency(code) !== undefined;
}

export function currencyDecimalPlaces(code: string): number {
  return getCurrency(code)?.digits ?? 0;
}

export function hasCurrencyPrecision(
  value: number,
  currencyCode: string,
): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }

  const scale = 10 ** currencyDecimalPlaces(currencyCode);
  return Number.isInteger(value * scale);
}
