import { evaluatePurchase, type PurchaseInput, type PurchaseResult } from '@/domain/purchase';

import { DEBT, GOAL, makeContext } from '../fixtures/anexo-a';

const ok = (r: ReturnType<typeof evaluatePurchase>): PurchaseResult => {
  if (r.status !== 'ok') throw new Error(`esperaba ok, fue ${r.status}`);
  return r;
};

// Contexto con colchón suficiente (mínimo 1 mes) para aislar el efecto de los intereses.
const holgado = makeContext({}, { emergencyMinMonths: 1 });
const rappi12 = (kind: PurchaseInput['kind']): PurchaseInput => ({
  price: { amount: 2_200_000, currency: 'COP' },
  payment: { method: 'credito', debtId: DEBT.rappi, installments: 12 },
  kind,
});

describe('¿Lo compro? (M8)', () => {
  test('caso dorado: 2.200.000 en TC Rappi a 12 cuotas, gusto → rojo', () => {
    const r = ok(evaluatePurchase(holgado, rappi12('gusto')));
    expect(Math.round(r.installmentAmount ?? 0)).toBe(209_311);
    expect(Math.abs(r.interest - 311_730)).toBeLessThan(10);
    expect(r.interestShare * 100).toBeCloseTo(14.2, 1);
    expect(r.light).toBe('rojo');
    expect(r.texts.title).toBe('Mejor no por ahora');
  });

  test('caso dorado: la misma compra como necesidad → amarillo', () => {
    expect(ok(evaluatePurchase(holgado, rappi12('necesidad'))).light).toBe('amarillo');
  });

  test('determinismo: misma entrada → mismo resultado', () => {
    expect(evaluatePurchase(holgado, rappi12('gusto'))).toEqual(evaluatePurchase(holgado, rappi12('gusto')));
  });

  test('D6: con tarjeta el colchón no cambia; de contado baja', () => {
    const ctx = makeContext();
    const card = ok(evaluatePurchase(ctx, { ...rappi12('necesidad'), price: { amount: 1_200_000, currency: 'COP' } }));
    const cash = ok(
      evaluatePurchase(ctx, { price: { amount: 1_200_000, currency: 'COP' }, payment: { method: 'contado' }, kind: 'necesidad' }),
    );
    expect(card.liquidityAfter).toBe(13_634_000);
    expect(cash.liquidityAfter).toBe(12_434_000);
    expect(cash.cushionAfter).toBeLessThan(card.cushionAfter ?? 0);
  });

  test('rojo si el colchón queda bajo el mínimo', () => {
    const r = ok(
      evaluatePurchase(makeContext(), { price: { amount: 100_000, currency: 'COP' }, payment: { method: 'contado' }, kind: 'necesidad' }),
    );
    expect(r.light).toBe('rojo');
    expect(r.texts.reasons[0]).toBe('Tu colchón quedaría en 1,4 de 4 meses.');
  });

  test('rojo si hay una provisión cercana sin cubrir', () => {
    const ctx = makeContext(
      { provisions: [{ id: 1, concept: 'SOAT', annualAmount: 900_000, dueDate: '2026-12-20', savedAmount: 300_000 }] },
      { emergencyMinMonths: 1 },
    );
    const r = ok(evaluatePurchase(ctx, { price: { amount: 100_000, currency: 'COP' }, payment: { method: 'contado' }, kind: 'necesidad' }));
    expect(r.light).toBe('rojo');
    expect(r.nearProvisions).toHaveLength(1);
  });

  test('amarillo si retrasa la meta prioritaria más de 4 semanas', () => {
    const ctx = makeContext({}, { emergencyMinMonths: 1, priorityGoalId: GOAL.japon });
    // 600.000 / 500.000 × 4,33 ≈ 5,2 semanas
    const r = ok(evaluatePurchase(ctx, { price: { amount: 600_000, currency: 'COP' }, payment: { method: 'contado' }, kind: 'gusto' }));
    expect(r.delayWeeks).toBeCloseTo(5.196, 3);
    expect(r.light).toBe('amarillo');
  });

  test('verde si nada aplica', () => {
    const ctx = makeContext({}, { emergencyMinMonths: 1, priorityGoalId: GOAL.japon });
    const r = ok(evaluatePurchase(ctx, { price: { amount: 300_000, currency: 'COP' }, payment: { method: 'contado' }, kind: 'gusto' }));
    expect(r.light).toBe('verde');
    expect(r.texts.title).toBe('Adelante');
  });

  test('precio en USD se convierte con la TRM actual', () => {
    const r = ok(evaluatePurchase(holgado, { price: { amount: 10_000, currency: 'USD' }, payment: { method: 'contado' }, kind: 'necesidad' }));
    expect(r.priceCop).toBe(370_000);
  });

  test('tarjeta sin tasa → pide la tasa', () => {
    const ctx = makeContext({ debts: makeContext().debts.map((d) => (d.id === DEBT.rappi ? { ...d, rateBps: undefined } : d)) });
    expect(evaluatePurchase(ctx, rappi12('gusto'))).toEqual({ status: 'falta_tasa', debtId: DEBT.rappi });
  });

  test('sin aporte en la meta prioritaria no hay retraso (pendiente: aporte del fondo)', () => {
    const ctx = makeContext({}, { emergencyMinMonths: 1, priorityGoalId: GOAL.fondo });
    const r = ok(evaluatePurchase(ctx, rappi12('necesidad')));
    expect(r.delayWeeks).toBeNull();
  });
});
