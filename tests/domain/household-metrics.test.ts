import {
  householdMonthlySpending,
  householdSplit,
  personalMonthly,
  primaryMonthlyBudget,
  sharedMonthly,
  splitPercents,
} from '@/domain/household';
import {
  availableLiquidity,
  creditCardDebt,
  cushionMonths,
  debtLoad,
  emergencyTarget,
  netWorthOf,
  usdHoldings,
} from '@/domain/metrics';

import { accounts, CAMILO, CATA, debts, makeContext, snapshotDic } from '../fixtures/anexo-a';

describe('hogar (M4)', () => {
  const ctx = makeContext();

  test('reparto automático por ingreso: 8.790.000 vs 5.600.000 → 61/39', () => {
    const pct = splitPercents(ctx);
    expect(pct.get(CAMILO)).toBe(61);
    expect(pct.get(CATA)).toBe(39);
  });

  test('caso dorado: 7.160.000 a 61/39 → 4.367.600 / 2.792.400', () => {
    const split = householdSplit(ctx);
    expect(split.totalShared).toBe(7_160_000);
    const [camilo, cata] = split.members;
    expect(camilo.share).toBe(4_367_600);
    expect(cata.share).toBe(2_792_400);
  });

  test('balance: Cata le debe 122.400 a Camilo', () => {
    const [camilo, cata] = householdSplit(ctx).members;
    expect(camilo.paid).toBe(4_490_000);
    expect(camilo.balance).toBe(122_400);
    expect(cata.balance).toBe(-122_400);
  });

  test('reparto manual', () => {
    const manual = makeContext({}, { splitMode: 'manual', splitManual: { [CAMILO]: 50, [CATA]: 50 } });
    const [camilo, cata] = householdSplit(manual).members;
    expect(camilo.share).toBe(3_580_000);
    expect(cata.share).toBe(3_580_000);
  });

  test('gastos personales y GTH ≈ 9.900.000', () => {
    expect(sharedMonthly(ctx)).toBe(7_160_000);
    expect(personalMonthly(ctx, CAMILO)).toBe(2_255_000);
    expect(personalMonthly(ctx, CATA)).toBe(485_000);
    expect(householdMonthlySpending(ctx)).toBe(9_900_000);
  });

  test('presupuesto personal de Camilo = le toca + personales', () => {
    expect(primaryMonthlyBudget(ctx)).toBe(4_367_600 + 2_255_000);
  });
});

describe('métricas', () => {
  const ctx = makeContext();

  test('patrimonio neto del snapshot', () => {
    const nw = netWorthOf(snapshotDic, accounts, debts);
    expect(nw.assets).toBe(30_314_000);
    expect(nw.liabilities).toBe(157_000_000);
    expect(nw.netWorth).toBe(-126_686_000);
  });

  test('liquidez: inmediatas que cuentan − tarjetas − pendientes', () => {
    expect(creditCardDebt(ctx)).toBe(2_000_000);
    expect(availableLiquidity(ctx)).toBe(13_634_000);
    expect(availableLiquidity(makeContext({ pendingObligations: 634_000 }))).toBe(13_000_000);
  });

  test('fondo con base "hogar" = 4 × 9,9M; con base "mi parte" ≈ 26,5M', () => {
    expect(emergencyTarget(ctx)).toBe(39_600_000);
    expect(emergencyTarget(makeContext({}, { emergencyBase: 'mi_parte' }))).toBe(26_490_400);
  });

  test('meses de colchón', () => {
    expect(cushionMonths(ctx)).toBeCloseTo(13_634_000 / 9_900_000, 6);
    expect(cushionMonths(makeContext({ obligations: [], proratedExpenses: [], provisions: [] }))).toBeNull();
  });

  test('carga de deuda = cuotas / ingreso', () => {
    const load = debtLoad(ctx);
    expect(load?.installments).toBe(3_050_000);
    expect(load?.ratio).toBeCloseTo(3_050_000 / 8_790_000, 6);
  });

  test('saldos en USD', () => {
    expect(usdHoldings(ctx)).toBe(379_000);
  });
});
