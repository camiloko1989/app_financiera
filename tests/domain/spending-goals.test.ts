import { goalProgress, priorityGoal } from '@/domain/goals';
import { inferSpending } from '@/domain/spending';
import type { Account, Snapshot } from '@/domain/types';

import { accounts, debts, GOAL, goals, makeContext, snapshotDic, snapshotNov } from '../fixtures/anexo-a';

describe('gasto inferido (§4.1)', () => {
  test('separa el efecto del dólar y el rendimiento de inversiones', () => {
    const r = inferSpending({
      previous: snapshotNov,
      current: snapshotDic,
      accounts,
      debts,
      periodIncome: 8_790_000,
      budgetedSpending: 6_622_600,
    });
    // Wise: US$3.500 × (3.700 − 3.650)
    expect(r.fxEffect).toBe(175_000);
    // Trii: 7.180.000 − 6.800.000 − aporte 500.000
    expect(r.investmentReturn).toBe(-120_000);
    // cuentas +1.789.000, deudas +400.000
    expect(r.netWorthDelta).toBe(2_189_000);
    expect(r.realSavings).toBe(2_134_000);
    expect(r.inferredSpending).toBe(6_656_000);
    expect(r.deviation).toBe(33_400);
  });

  test('ejemplo de la pantalla Resumen: 1.240.000 − 135.000 + 320.000 = 1.425.000', () => {
    const acc: Account[] = [
      { id: 1, name: 'Banco', currency: 'COP', liquidity: 'inmediata', ownerMemberId: 1, isInvestment: false, countsAsLiquidity: true },
      { id: 2, name: 'Wise', currency: 'USD', liquidity: 'inmediata', ownerMemberId: 1, isInvestment: false, countsAsLiquidity: true },
      { id: 3, name: 'Trii', currency: 'COP', liquidity: 'volatil', ownerMemberId: 1, isInvestment: true, countsAsLiquidity: false },
    ];
    // Wise: US$2.700 con TRM que sube 50 → +135.000 sin mover dólares
    const prev: Snapshot = { id: 1, date: '2026-11-08', trmCents: 365_000, debts: [], accounts: [
      { accountId: 1, balance: 1_000_000 }, { accountId: 2, balance: 270_000 }, { accountId: 3, balance: 7_000_000 },
    ] };
    const curr: Snapshot = { id: 2, date: '2026-12-08', trmCents: 370_000, debts: [], accounts: [
      { accountId: 1, balance: 2_425_000 }, { accountId: 2, balance: 270_000 }, { accountId: 3, balance: 6_680_000, contribution: 0 },
    ] };
    const r = inferSpending({ previous: prev, current: curr, accounts: acc, debts: [], periodIncome: 8_790_000, budgetedSpending: 6_745_000 });
    expect(r.netWorthDelta).toBe(1_240_000);
    expect(r.fxEffect).toBe(135_000);
    expect(r.investmentReturn).toBe(-320_000);
    expect(r.realSavings).toBe(1_425_000);
    expect(r.inferredSpending).toBe(7_365_000);
    expect(r.deviation).toBe(620_000);
  });

  test('una cuenta nueva no cuenta como ahorro', () => {
    const curr: Snapshot = {
      ...snapshotDic,
      accounts: [...snapshotDic.accounts, { accountId: 99, balance: 10_000_000 }],
    };
    const extra: Account = { id: 99, name: 'Nueva', currency: 'COP', liquidity: 'inmediata', ownerMemberId: 1, isInvestment: false, countsAsLiquidity: true };
    const r = inferSpending({ previous: snapshotNov, current: curr, accounts: [...accounts, extra], debts, periodIncome: 8_790_000 });
    expect(r.realSavings).toBe(2_134_000);
  });
});

describe('metas (M6)', () => {
  const ctx = makeContext();

  test('C08 caso dorado: Japón con 0 y 500 mil/mes desde dic 2026 → atrasada, se necesitan ~3M/mes', () => {
    const p = goalProgress(ctx, goals[1]);
    if (p.kind !== 'acumular') throw new Error('tipo');
    expect(p.status).toBe('atrasada');
    expect(p.projectedDate).toBe('2031-12-08'); // 60 meses
    expect(p.requiredMonthly).toBe(3_000_000);
    expect(p.monthsLate).toBeGreaterThan(40);
  });

  test('fondo de emergencia: avance = liquidez, objetivo de los ajustes, BAJO MÍNIMO', () => {
    const p = goalProgress(ctx, goals[0]);
    if (p.kind !== 'acumular') throw new Error('tipo');
    expect(p.target).toBe(39_600_000);
    expect(p.progress).toBe(13_634_000);
    expect(p.status).toBe('bajo_minimo');
  });

  test('aporte recurrente: cumplido / pendiente y % de meses cumplidos', () => {
    const pend = goalProgress(ctx, { ...goals[2], contributedThisPeriod: 400_000, contributionHistory: [450_000, 0, 500_000, 450_000] });
    if (pend.kind !== 'aporte_recurrente') throw new Error('tipo');
    expect(pend.status).toBe('pendiente');
    expect(pend.completionRate).toBe(0.75);
    const ok = goalProgress(ctx, { ...goals[3], contributedThisPeriod: 500_000 });
    expect(ok.status).toBe('cumplido');
  });

  test('meta prioritaria: la de mayor prioridad sin cumplir, o la configurada', () => {
    expect(priorityGoal(ctx)?.id).toBe(GOAL.fondo);
    expect(priorityGoal(makeContext({}, { priorityGoalId: GOAL.japon }))?.id).toBe(GOAL.japon);
    const fondoCumplido = makeContext({}, { emergencyMinMonths: 1 });
    expect(priorityGoal(fondoCumplido)?.id).toBe(GOAL.japon);
  });
});
