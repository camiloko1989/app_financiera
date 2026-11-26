import type { RateUnit } from './types';

/** EM → EA (fracciones): (1 + i)^12 − 1 */
export function emToEa(em: number): number {
  return (1 + em) ** 12 - 1;
}

/** EA → EM (fracciones): (1 + ea)^(1/12) − 1 */
export function eaToEm(ea: number): number {
  return (1 + ea) ** (1 / 12) - 1;
}

/** Tasa mensual (fracción) a partir de puntos básicos y su unidad. */
export function monthlyRate(rateBps: number, unit: RateUnit): number {
  const r = rateBps / 10_000;
  return unit === 'EM' ? r : eaToEm(r);
}

/** Tasa efectiva anual (fracción) a partir de puntos básicos y su unidad. */
export function annualRate(rateBps: number, unit: RateUnit): number {
  const r = rateBps / 10_000;
  return unit === 'EA' ? r : emToEa(r);
}

/** Cuota fija: P·i / (1 − (1+i)^−n). Sin redondear. */
export function installment(principal: number, monthly: number, n: number): number {
  if (n <= 0) throw new Error('n debe ser > 0');
  if (monthly === 0) return principal / n;
  return (principal * monthly) / (1 - (1 + monthly) ** -n);
}

/** Intereses totales de un crédito a cuota fija: cuota × n − P. Sin redondear. */
export function totalInterest(principal: number, monthly: number, n: number): number {
  return installment(principal, monthly, n) * n - principal;
}
