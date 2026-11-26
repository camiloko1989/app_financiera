import { formatDate } from '../../dates';
import { goalProgress } from '../../goals';
import { formatMoney } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';
import { cop } from './helpers';

/** C08 · Meta atrasada: fecha proyectada > fecha objetivo. */
export const c08GoalBehind: AdviceRule = {
  id: 'C08',
  requires: () => [],
  evaluate: (ctx) => {
    const results: AdviceResult[] = [];
    for (const goal of ctx.goals) {
      if (goal.kind !== 'acumular' || goal.isEmergencyFund || !goal.targetDate) continue;
      const p = goalProgress(ctx, goal);
      if (p.kind !== 'acumular' || p.status !== 'atrasada') continue;
      const remaining = p.target - p.progress;
      const required = Math.round(p.requiredMonthly ?? 0);
      const message = p.projectedDate
        ? `A este ritmo llegas a ${goal.name} en ${formatDate(p.projectedDate, { day: false })} (${p.monthsLate} meses tarde).`
        : `${goal.name} no tiene aporte mensual: necesitas ${formatMoney(cop(required))}/mes para llegar en ${formatDate(goal.targetDate, { day: false })}.`;
      results.push({
        ruleId: 'C08',
        key: `C08:goal:${goal.id}`,
        severity: 'media',
        impactCop: Math.round(remaining),
        data: {
          goal: goal.name,
          projectedDate: p.projectedDate ?? '',
          targetDate: goal.targetDate,
          monthsLate: p.monthsLate,
          requiredMonthly: required,
        },
        fallbackMessage: message,
      });
    }
    return results;
  },
};
