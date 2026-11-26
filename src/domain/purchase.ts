// "¿Lo compro?" (M8): evaluación determinista y semáforo.
import { daysBetween } from './dates';
import { priorityGoal } from './goals';
import { availableLiquidity, cushionMonths } from './metrics';
import { currentTrm } from './household';
import { formatDecimal, formatMoney, formatPercent, toCop } from './money';
import { installment, monthlyRate } from './rates';
import type { FinancialContext, Money, Provision, PurchaseKind } from './types';

export const WEEKS_PER_MONTH = 4.33;

export type PaymentMethod =
  | { method: 'contado' }
  | { method: 'credito'; debtId: number; installments: number };

export interface PurchaseInput {
  description?: string;
  price: Money;
  payment: PaymentMethod;
  kind: PurchaseKind;
}

export type TrafficLight = 'rojo' | 'amarillo' | 'verde';

export type PurchaseReason =
  | { code: 'colchon'; cushionAfter: number; minMonths: number; belowMin: boolean }
  | { code: 'provision_cercana'; concept: string; dueDate: string; missing: number }
  | { code: 'intereses'; interest: number; share: number; installments: number }
  | { code: 'retraso_meta'; goalName: string; weeks: number };

export interface PurchaseResult {
  status: 'ok';
  light: TrafficLight;
  priceCop: number;
  liquidityAfter: number;
  cushionAfter: number | null;
  /** cuota mensual (sin redondear) si es a crédito */
  installmentAmount: number | null;
  interest: number;
  interestShare: number;
  delayWeeks: number | null;
  priorityGoalName: string | null;
  nearProvisions: Provision[];
  reasons: PurchaseReason[];
  /** cuánto se ahorra pagando de contado, si aplica */
  cashSavings: number | null;
  texts: { title: string; reasons: string[]; alternative: string | null };
}

export type PurchaseEvaluation = PurchaseResult | { status: 'falta_tasa'; debtId: number };

const TITLES: Record<TrafficLight, string> = {
  rojo: 'Mejor no por ahora',
  amarillo: 'Puedes, con cuidado',
  verde: 'Adelante',
};

export function evaluatePurchase(ctx: FinancialContext, input: PurchaseInput): PurchaseEvaluation {
  const s = ctx.settings;
  const priceCop = toCop(input.price, currentTrm(ctx));

  let interest = 0;
  let installmentAmount: number | null = null;
  let n = 0;
  if (input.payment.method === 'credito') {
    const { debtId } = input.payment;
    const debt = ctx.debts.find((d) => d.id === debtId);
    if (!debt || debt.rateBps === undefined || !debt.rateUnit) return { status: 'falta_tasa', debtId };
    n = input.payment.installments;
    const i = monthlyRate(debt.rateBps, debt.rateUnit);
    installmentAmount = installment(priceCop, i, n);
    interest = installmentAmount * n - priceCop;
  }
  const interestShare = priceCop > 0 ? interest / priceCop : 0;

  // D6: de contado reduce la liquidez; a crédito solo aumenta la deuda.
  const liquidity = availableLiquidity(ctx);
  const liquidityAfter = input.payment.method === 'contado' ? liquidity - priceCop : liquidity;
  const cushionAfter = cushionMonths(ctx, liquidityAfter);
  const belowMin = cushionAfter !== null && cushionAfter < s.emergencyMinMonths;

  const goal = priorityGoal(ctx);
  const delayWeeks =
    goal?.monthlyContribution && goal.monthlyContribution > 0
      ? (priceCop / goal.monthlyContribution) * WEEKS_PER_MONTH
      : null;

  const nearProvisions = ctx.provisions.filter((p) => {
    const days = daysBetween(ctx.asOf, p.dueDate);
    return days >= 0 && days <= s.purchaseProvisionWindowDays && p.savedAmount < p.annualAmount;
  });

  const expensiveTreat =
    input.kind === 'gusto' && input.payment.method === 'credito' && interestShare > s.purchaseRedInterestShare;
  const longDelay = delayWeeks !== null && delayWeeks > s.purchaseYellowDelayWeeks;

  const light: TrafficLight =
    belowMin || nearProvisions.length > 0 || expensiveTreat
      ? 'rojo'
      : longDelay || interest > 0
        ? 'amarillo'
        : 'verde';

  const reasons: PurchaseReason[] = [];
  if (cushionAfter !== null) {
    reasons.push({ code: 'colchon', cushionAfter, minMonths: s.emergencyMinMonths, belowMin });
  }
  for (const p of nearProvisions) {
    reasons.push({
      code: 'provision_cercana',
      concept: p.concept,
      dueDate: p.dueDate,
      missing: p.annualAmount - p.savedAmount,
    });
  }
  if (interest > 0) reasons.push({ code: 'intereses', interest, share: interestShare, installments: n });
  if (delayWeeks !== null && goal) reasons.push({ code: 'retraso_meta', goalName: goal.name, weeks: delayWeeks });

  const cashSavings = interest > 0 ? interest : null;

  return {
    status: 'ok',
    light,
    priceCop,
    liquidityAfter,
    cushionAfter,
    installmentAmount,
    interest,
    interestShare,
    delayWeeks,
    priorityGoalName: goal?.name ?? null,
    nearProvisions,
    reasons,
    cashSavings,
    texts: {
      title: TITLES[light],
      reasons: reasons.map(reasonText),
      alternative:
        cashSavings !== null ? `De contado te ahorras ${formatMoney({ amount: Math.round(cashSavings), currency: 'COP' })}.` : null,
    },
  };
}

export function reasonText(r: PurchaseReason): string {
  switch (r.code) {
    case 'colchon':
      return `Tu colchón quedaría en ${formatDecimal(r.cushionAfter)} de ${r.minMonths} meses.`;
    case 'provision_cercana':
      return `Se viene ${r.concept} el ${r.dueDate} y te faltan ${formatMoney({ amount: r.missing, currency: 'COP' })}.`;
    case 'intereses':
      return `A ${r.installments} cuotas pagarías ~${formatMoney({ amount: Math.round(r.interest), currency: 'COP' })} de intereses (${formatPercent(r.share)} del precio).`;
    case 'retraso_meta':
      return `Retrasa tu meta ${r.goalName} ~${Math.round(r.weeks)} semanas.`;
  }
}
