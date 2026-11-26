import type { Currency, Money } from './types';

export const cop = (amount: number): Money => ({ amount, currency: 'COP' });
/** USD en centavos */
export const usd = (cents: number): Money => ({ amount: cents, currency: 'USD' });

/** Convierte a pesos. USD en centavos × TRM en centavos de peso → pesos (redondeado). */
export function toCop(money: Money, trmCents: number): number {
  return amountToCop(money.amount, money.currency, trmCents);
}

export function amountToCop(amount: number, currency: Currency, trmCents: number): number {
  if (currency === 'COP') return amount;
  return Math.round((amount * trmCents) / 10_000);
}

/** Pesos → centavos de USD (redondeado). */
export function copToUsdCents(pesos: number, trmCents: number): number {
  return Math.round((pesos * 10_000) / trmCents);
}

const MINUS = '−';

function groupThousands(n: number): string {
  return Math.trunc(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function compactMillions(abs: number): string {
  const tenths = Math.round(abs / 100_000); // décimas de millón
  const whole = Math.trunc(tenths / 10);
  const dec = tenths % 10;
  return `${groupThousands(whole)}${dec ? `,${dec}` : ''}M`;
}

/**
 * Formato de dinero (docs/pantallas.md §1.3):
 * COP `$28.669.300` · compacto `$24,4M` · USD `US$11.259`.
 */
export function formatMoney(money: Money, opts: { compact?: boolean } = {}): string {
  const units = money.currency === 'USD' ? Math.round(money.amount / 100) : Math.round(money.amount);
  const sign = units < 0 ? MINUS : '';
  const abs = Math.abs(units);
  const prefix = money.currency === 'USD' ? 'US$' : '$';
  const body = opts.compact && abs >= 1_000_000 ? compactMillions(abs) : groupThousands(abs);
  return `${sign}${prefix}${body}`;
}

/** Variación con signo explícito: `+$1.240.000`, `−$320.000`. */
export function formatSignedMoney(money: Money, opts: { compact?: boolean } = {}): string {
  const text = formatMoney(money, opts);
  return money.amount > 0 ? `+${text}` : text;
}

/** Porcentaje con coma decimal: formatPercent(0.61) → `61%`, formatPercent(0.0212, 2) → `2,12%`. */
export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals).replace('.', ',')}%`;
}

/** Número con coma decimal y un decimal: 1.54 → `1,5`. */
export function formatDecimal(n: number, decimals = 1): string {
  return n.toFixed(decimals).replace('.', ',');
}
