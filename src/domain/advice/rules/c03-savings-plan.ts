import { currentSnapshot, previousSnapshot } from '../../metrics';
import { formatMoney, formatSignedMoney } from '../../money';
import { inferSpending } from '../../spending';
import type { AdviceRule } from '../rule';
import { cop, MISSING, primaryIncome } from './helpers';

/** C03 · Ahorro real por debajo del plan. */
export const c03SavingsPlan: AdviceRule = {
  id: 'C03',
  requires: (ctx) => {
    const missing: string[] = [];
    if (ctx.snapshots.length < 2) missing.push(MISSING.previousSnapshot);
    if (ctx.plannedSavings === undefined) missing.push(MISSING.plannedSavings);
    if (ctx.snapshots.length > 0 && primaryIncome(ctx) <= 0) missing.push(MISSING.income);
    return missing;
  },
  evaluate: (ctx) => {
    const plan = ctx.plannedSavings ?? 0;
    const prev = previousSnapshot(ctx);
    if (!prev || plan <= 0) return [];
    const { realSavings } = inferSpending({
      previous: prev,
      current: currentSnapshot(ctx),
      accounts: ctx.accounts,
      debts: ctx.debts,
      periodIncome: primaryIncome(ctx),
    });
    if (realSavings >= ctx.settings.savingsVsPlanMin * plan) return [];
    const diff = plan - realSavings;
    return [
      {
        ruleId: 'C03',
        key: 'C03',
        severity: 'media',
        impactCop: Math.round(diff),
        data: { plan: Math.round(plan), real: Math.round(realSavings), diff: Math.round(diff) },
        fallbackMessage: `Esperábamos ${formatSignedMoney(cop(plan))} y fue ${formatSignedMoney(cop(realSavings))}. Hay ${formatMoney(cop(diff))} sin explicar.`,
      },
    ];
  },
};
