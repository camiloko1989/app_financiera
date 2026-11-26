import { availableLiquidity, cushionMonths, emergencyBaseMonthly, emergencyTarget } from '../../metrics';
import { formatDecimal, formatMoney } from '../../money';
import type { AdviceRule } from '../rule';
import { cop, MISSING } from './helpers';

/** C01 · Fondo de emergencia: meses de colchón < mínimo. */
export const c01EmergencyFund: AdviceRule = {
  id: 'C01',
  requires: (ctx) => {
    if (ctx.snapshots.length === 0) return [MISSING.snapshot];
    return emergencyBaseMonthly(ctx) > 0 ? [] : [MISSING.expenses];
  },
  evaluate: (ctx) => {
    const months = cushionMonths(ctx);
    const min = ctx.settings.emergencyMinMonths;
    if (months === null || months >= min) return [];
    const missing = Math.max(0, emergencyTarget(ctx) - availableLiquidity(ctx));
    return [
      {
        ruleId: 'C01',
        key: 'C01',
        severity: months < ctx.settings.emergencyHighSeverityMonths ? 'alta' : 'media',
        impactCop: Math.round(missing),
        data: { months: Number(months.toFixed(2)), min, missingCop: Math.round(missing) },
        fallbackMessage: `Tu liquidez cubre ${formatDecimal(months)} meses. Tu mínimo es ${min}: te faltan ${formatMoney(cop(missing))}.`,
      },
    ];
  },
};
