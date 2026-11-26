import { debtLoad } from '../../metrics';
import type { AdviceRule } from '../rule';
import { MISSING, primaryIncome } from './helpers';

/** C04 · Carga de deuda: cuotas / ingreso > máximo. */
export const c04DebtLoad: AdviceRule = {
  id: 'C04',
  requires: (ctx) => {
    if (ctx.snapshots.length === 0) return [MISSING.snapshot];
    return primaryIncome(ctx) > 0 ? [] : [MISSING.income];
  },
  evaluate: (ctx) => {
    const load = debtLoad(ctx);
    const max = ctx.settings.debtLoadMax;
    if (!load || load.ratio <= max) return [];
    const pct = Math.round(load.ratio * 100);
    return [
      {
        ruleId: 'C04',
        key: 'C04',
        severity: 'media',
        impactCop: Math.round(load.installments - max * load.income),
        data: { pct, installments: Math.round(load.installments), income: Math.round(load.income) },
        fallbackMessage: `Tus cuotas se llevan el ${pct}% del ingreso.`,
      },
    ];
  },
};
