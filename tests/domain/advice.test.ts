import { runAdvice } from '@/domain/advice/engine';
import {
  ALL_RULES,
  c01EmergencyFund,
  c02CreditCard,
  c03SavingsPlan,
  c04DebtLoad,
  c05Provision,
  c06IdleMoney,
  c07Cdt,
  c08GoalBehind,
  c09InformalDebt,
} from '@/domain/advice/rules';
import type { Snapshot } from '@/domain/types';

import { ACC, DEBT, makeContext, snapshotDic, snapshotNov } from '../fixtures/anexo-a';

const snapshotOct: Snapshot = {
  ...snapshotNov,
  id: 0,
  date: '2026-10-08',
  debts: snapshotNov.debts.map((d) => (d.debtId === DEBT.rappi ? { ...d, balance: 800_000 } : d)),
};

describe('reglas', () => {
  test('C01: 1,4 meses < 2 → alta, con el faltante', () => {
    const [a] = c01EmergencyFund.evaluate(makeContext());
    expect(a.severity).toBe('alta');
    expect(a.data.missingCop).toBe(39_600_000 - 13_634_000);
    expect(a.fallbackMessage).toBe('Tu liquidez cubre 1,4 meses. Tu mínimo es 4: te faltan $25.966.000.');
  });

  test('C01: media entre el nivel alto y el mínimo; nada si se cumple', () => {
    expect(c01EmergencyFund.evaluate(makeContext({}, { emergencyHighSeverityMonths: 1 }))[0].severity).toBe('media');
    expect(c01EmergencyFund.evaluate(makeContext({}, { emergencyMinMonths: 1 }))).toHaveLength(0);
  });

  test('C02: tarjeta que sube en 2 snapshots seguidos', () => {
    const ctx = makeContext({ snapshots: [snapshotOct, snapshotNov, snapshotDic] });
    const r = c02CreditCard.evaluate(ctx);
    expect(r).toHaveLength(1);
    expect(r[0].fallbackMessage).toBe('TC Rappi pasó de $800.000 a $1.200.000. ¿La estás pagando completa?');
    expect(c02CreditCard.evaluate(makeContext())).toHaveLength(0);
  });

  test('C02: tarjeta por encima del 30% del ingreso', () => {
    const ctx = makeContext({}, { creditCardIncomeThreshold: 0.1 });
    expect(c02CreditCard.evaluate(ctx).map((a) => a.key)).toEqual([`C02:debt:${DEBT.rappi}`]);
  });

  test('C03: ahorro real < 70% del plan', () => {
    const r = c03SavingsPlan.evaluate(makeContext({ plannedSavings: 4_000_000 }));
    expect(r[0].data).toEqual({ plan: 4_000_000, real: 2_134_000, diff: 1_866_000 });
    expect(r[0].fallbackMessage).toBe('Esperábamos +$4.000.000 y fue +$2.134.000. Hay $1.866.000 sin explicar.');
    expect(c03SavingsPlan.evaluate(makeContext({ plannedSavings: 3_000_000 }))).toHaveLength(0);
  });

  test('C04: cuotas > 40% del ingreso', () => {
    expect(c04DebtLoad.evaluate(makeContext())).toHaveLength(0);
    const r = c04DebtLoad.evaluate(makeContext({}, { debtLoadMax: 0.3 }));
    expect(r[0].fallbackMessage).toBe('Tus cuotas se llevan el 35% del ingreso.');
  });

  test('C05: provisión atrasada; alta si faltan ≤ 60 días', () => {
    // vence en 8 meses → deberían ir 4/12 de 3.000.000 = 1.000.000
    expect(c05Provision.evaluate(makeContext())).toHaveLength(0);
    const atrasada = makeContext({
      provisions: [{ id: 1, concept: 'Impuesto de renta', annualAmount: 3_000_000, dueDate: '2027-08-10', savedAmount: 800_000 }],
    });
    const [a] = c05Provision.evaluate(atrasada);
    expect(a.severity).toBe('media');
    expect(a.fallbackMessage).toBe('Para Impuesto de renta deberías llevar $1.000.000 y llevas $800.000.');
    const cerca = makeContext({
      provisions: [{ id: 2, concept: 'SOAT', annualAmount: 1_200_000, dueDate: '2027-01-20', savedAmount: 0 }],
    });
    expect(c05Provision.evaluate(cerca)[0].severity).toBe('alta');
  });

  test('C06: plata quieta > 2 × GFM durante 2 snapshots', () => {
    expect(c06IdleMoney.evaluate(makeContext())).toHaveLength(0);
    const quieta = makeContext({}, { idleMoneyMultiple: 1.5 });
    const r = c06IdleMoney.evaluate(quieta);
    expect(r.map((a) => a.data.account)).toEqual(['Wise']);
    expect(r[0].severity).toBe('baja');
  });

  test('C07: CDT que vence en ≤ 15 días', () => {
    const [a] = c07Cdt.evaluate(makeContext());
    expect(a.fallbackMessage).toBe('Tu CDT de $5.000.000 vence el 15 dic 2026.');
    expect(c07Cdt.evaluate(makeContext({}, { cdtNoticeDays: 5 }))).toHaveLength(0);
  });

  test('C08: meta Japón atrasada (caso dorado)', () => {
    const [a] = c08GoalBehind.evaluate(makeContext());
    expect(a.data.goal).toBe('Viaje a Japón');
    expect(a.data.requiredMonthly).toBe(3_000_000);
    expect(a.fallbackMessage).toBe('A este ritmo llegas a Viaje a Japón en dic 2031 (49 meses tarde).');
  });

  test('C09: deuda informal igual en 3 snapshots', () => {
    expect(c09InformalDebt.evaluate(makeContext())).toHaveLength(0);
    const r = c09InformalDebt.evaluate(makeContext({ snapshots: [snapshotOct, snapshotNov, snapshotDic] }));
    expect(r.map((a) => a.data.debt)).toEqual(['Deuda Madre', 'Acreedores']);
  });
});

describe('motor de consejos (M7)', () => {
  test('máximo 3, ordenados por severidad y luego por impacto', () => {
    const run = runAdvice(makeContext(), ALL_RULES);
    expect(run.visible.map((a) => a.ruleId)).toEqual(['C01', 'C08', 'C07']);
  });

  test('datos parciales: la regla se bloquea con lo que falta (RF-1.3)', () => {
    const run = runAdvice(makeContext({ incomes: [], snapshots: [snapshotDic] }), ALL_RULES);
    const c03 = run.blocked.find((b) => b.ruleId === 'C03');
    expect(c03?.missing).toEqual(['un segundo cierre de mes', 'tu ahorro planeado', 'tus ingresos']);
    expect(run.blocked.map((b) => b.ruleId)).toEqual(expect.arrayContaining(['C02', 'C04']));
    expect(run.visible.every((a) => Object.values(a.data).every((v) => v !== null && !Number.isNaN(v)))).toBe(true);
  });

  test('sin snapshots no hay errores', () => {
    const run = runAdvice(makeContext({ snapshots: [] }), ALL_RULES);
    expect(run.visible.filter((a) => a.ruleId !== 'C08')).toHaveLength(0);
  });

  test('enfriamiento: un descartado no vuelve en 60 días, salvo que suba la severidad', () => {
    const ctx = makeContext();
    const dismissed = [{ key: 'C07', severity: 'media' as const, dismissedAt: '2026-11-20' }];
    const cdtKey = `C07:account:${ACC.cdt}:2026-12-15`;
    const run = runAdvice(ctx, ALL_RULES, [{ ...dismissed[0], key: cdtKey }]);
    expect(run.visible.map((a) => a.ruleId)).not.toContain('C07');

    const old = runAdvice(ctx, ALL_RULES, [{ key: cdtKey, severity: 'media', dismissedAt: '2026-09-01' }]);
    expect(old.visible.map((a) => a.ruleId)).toContain('C07');

    const escalated = runAdvice(ctx, ALL_RULES, [{ key: 'C01', severity: 'media', dismissedAt: '2026-12-01' }]);
    expect(escalated.visible[0].ruleId).toBe('C01');
  });
});
