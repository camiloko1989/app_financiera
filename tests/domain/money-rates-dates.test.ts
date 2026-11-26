import { addMonths, daysBetween, formatDate, monthsBetween } from '@/domain/dates';
import { copToUsdCents, formatMoney, formatPercent, formatSignedMoney, toCop } from '@/domain/money';
import { annualRate, eaToEm, emToEa, installment, monthlyRate, totalInterest } from '@/domain/rates';

describe('money', () => {
  test('USD en centavos × TRM en centavos → pesos', () => {
    expect(toCop({ amount: 10_000, currency: 'USD' }, 371_245)).toBe(371_245); // US$100
    expect(toCop({ amount: 1_125_900, currency: 'USD' }, 370_000)).toBe(41_658_300);
    expect(toCop({ amount: 5_000, currency: 'COP' }, 370_000)).toBe(5_000);
    expect(copToUsdCents(371_245, 371_245)).toBe(10_000);
  });

  test.each([
    [{ amount: 28_669_300, currency: 'COP' as const }, {}, '$28.669.300'],
    [{ amount: 24_400_000, currency: 'COP' as const }, { compact: true }, '$24,4M'],
    [{ amount: 30_000_000, currency: 'COP' as const }, { compact: true }, '$30M'],
    [{ amount: 39_600_000, currency: 'COP' as const }, { compact: true }, '$39,6M'],
    [{ amount: 450_000, currency: 'COP' as const }, { compact: true }, '$450.000'],
    [{ amount: 1_125_900, currency: 'USD' as const }, {}, 'US$11.259'],
    [{ amount: -320_000, currency: 'COP' as const }, {}, '−$320.000'],
    [{ amount: 0, currency: 'COP' as const }, {}, '$0'],
  ])('formatMoney(%o, %o) = %s', (money, opts, expected) => {
    expect(formatMoney(money, opts)).toBe(expected);
  });

  test('formatos con signo y porcentaje', () => {
    expect(formatSignedMoney({ amount: 1_240_000, currency: 'COP' })).toBe('+$1.240.000');
    expect(formatSignedMoney({ amount: -320_000, currency: 'COP' })).toBe('−$320.000');
    expect(formatPercent(0.61)).toBe('61%');
    expect(formatPercent(0.0212, 2)).toBe('2,12%');
  });
});

describe('rates (casos dorados del Anexo A)', () => {
  test('2,1% EM → 28,32% EA (± 0,01)', () => {
    expect(emToEa(0.021) * 100).toBeCloseTo(28.32, 2);
    expect(annualRate(210, 'EM') * 100).toBeCloseTo(28.32, 2);
  });

  test('2,12% EM → 28,63% EA (± 0,01)', () => {
    expect(emToEa(0.0212) * 100).toBeCloseTo(28.63, 2);
  });

  test('EA → EM es la inversa', () => {
    expect(eaToEm(emToEa(0.021))).toBeCloseTo(0.021, 10);
    expect(monthlyRate(2832, 'EA')).toBeCloseTo(0.021, 4);
  });

  test('2.200.000 a 12 cuotas al 2,1% → cuota ≈ 209.311, intereses ≈ 311.730 (14,2%)', () => {
    const cuota = installment(2_200_000, 0.021, 12);
    const interes = totalInterest(2_200_000, 0.021, 12);
    expect(Math.round(cuota)).toBe(209_311);
    expect(Math.abs(interes - 311_730)).toBeLessThan(10);
    expect((interes / 2_200_000) * 100).toBeCloseTo(14.2, 1);
  });

  test('tasa 0 reparte el capital', () => {
    expect(installment(1_200_000, 0, 12)).toBe(100_000);
    expect(totalInterest(1_200_000, 0, 12)).toBe(0);
  });
});

describe('dates', () => {
  test('addMonths respeta el fin de mes', () => {
    expect(addMonths('2026-12-08', 10)).toBe('2027-10-08');
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2026-12-08', -1)).toBe('2026-11-08');
  });

  test('monthsBetween cuenta meses completos', () => {
    expect(monthsBetween('2026-12-08', '2027-10-31')).toBe(10);
    expect(monthsBetween('2026-12-08', '2027-10-01')).toBe(9);
    expect(monthsBetween('2027-10-31', '2026-12-08')).toBe(-10);
  });

  test('daysBetween y formatDate', () => {
    expect(daysBetween('2026-12-08', '2026-12-15')).toBe(7);
    expect(formatDate('2027-10-08')).toBe('8 oct 2027');
    expect(formatDate('2027-10-08', { day: false })).toBe('oct 2027');
  });
});
