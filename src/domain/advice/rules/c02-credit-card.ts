import { amountToCop, formatMoney, formatPercent } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';
import { belongsToPrimary, cop, MISSING, primaryIncome } from './helpers';

/** C02 · Tarjeta creciendo: sube en 2 snapshots seguidos o supera el umbral del ingreso. */
export const c02CreditCard: AdviceRule = {
  id: 'C02',
  requires: (ctx) => {
    if (ctx.snapshots.length === 0) return [MISSING.snapshot];
    return primaryIncome(ctx) > 0 ? [] : [MISSING.income];
  },
  evaluate: (ctx) => {
    const income = primaryIncome(ctx);
    const threshold = ctx.settings.creditCardIncomeThreshold;
    const recent = ctx.snapshots.slice(-3);
    const results: AdviceResult[] = [];

    for (const debt of ctx.debts) {
      if (debt.kind !== 'tarjeta_credito' || debt.direction !== 'debo') continue;
      if (!belongsToPrimary(ctx, debt.ownerMemberId)) continue;

      const series = recent.map((s) => {
        const b = s.debts.find((x) => x.debtId === debt.id);
        return b ? amountToCop(b.balance, debt.currency, s.trmCents) : undefined;
      });
      const current = series.at(-1);
      if (current === undefined) continue;

      const [s0, s1] = series;
      const growing =
        series.length === 3 && s0 !== undefined && s1 !== undefined && s0 < s1 && s1 < current;
      const overIncome = current > threshold * income;
      if (!growing && !overIncome) continue;

      const from = growing ? s0 : series.at(-2);
      const message =
        from !== undefined
          ? `${debt.name} pasó de ${formatMoney(cop(from))} a ${formatMoney(cop(current))}. ¿La estás pagando completa?`
          : `${debt.name} tiene ${formatMoney(cop(current))}, más del ${formatPercent(threshold)} de tu ingreso. ¿La estás pagando completa?`;

      results.push({
        ruleId: 'C02',
        key: `C02:debt:${debt.id}`,
        severity: 'alta',
        impactCop: Math.round(current),
        data: {
          card: debt.name,
          from: from === undefined ? '' : Math.round(from),
          to: Math.round(current),
          incomeShare: Number((current / income).toFixed(4)),
        },
        fallbackMessage: message,
      });
    }
    return results;
  },
};
