import { daysBetween, monthsBetween } from '../../dates';
import { formatMoney } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';
import { cop } from './helpers';

/** C05 · Provisión atrasada: apartado < (meses transcurridos / 12) × monto anual. */
export const c05Provision: AdviceRule = {
  id: 'C05',
  requires: () => [],
  evaluate: (ctx) => {
    const results: AdviceResult[] = [];
    for (const p of ctx.provisions) {
      const daysLeft = daysBetween(ctx.asOf, p.dueDate);
      if (daysLeft < 0) continue;
      const elapsed = Math.min(12, Math.max(0, 12 - monthsBetween(ctx.asOf, p.dueDate)));
      const expected = (elapsed / 12) * p.annualAmount;
      if (p.savedAmount >= expected) continue;
      results.push({
        ruleId: 'C05',
        key: `C05:provision:${p.id}`,
        severity: daysLeft <= ctx.settings.provisionNoticeDays ? 'alta' : 'media',
        impactCop: Math.round(expected - p.savedAmount),
        data: {
          provision: p.concept,
          expected: Math.round(expected),
          saved: p.savedAmount,
          daysLeft,
        },
        fallbackMessage: `Para ${p.concept} deberías llevar ${formatMoney(cop(expected))} y llevas ${formatMoney(cop(p.savedAmount))}.`,
      });
    }
    return results;
  },
};
