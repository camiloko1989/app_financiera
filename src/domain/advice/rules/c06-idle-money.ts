import { fixedMonthlyExpenses } from '../../metrics';
import { amountToCop, formatMoney } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';
import { cop, MISSING } from './helpers';

/** C06 · Plata quieta: más de N × GFM en una cuenta sin rendimiento durante 2+ snapshots. */
export const c06IdleMoney: AdviceRule = {
  id: 'C06',
  requires: (ctx) => {
    if (ctx.snapshots.length === 0) return [MISSING.snapshot];
    return fixedMonthlyExpenses(ctx) > 0 ? [] : [MISSING.expenses];
  },
  evaluate: (ctx) => {
    if (ctx.snapshots.length < 2) return [];
    const limit = ctx.settings.idleMoneyMultiple * fixedMonthlyExpenses(ctx);
    const lastTwo = ctx.snapshots.slice(-2);
    const results: AdviceResult[] = [];

    for (const a of ctx.accounts) {
      if (a.isInvestment || a.liquidity !== 'inmediata') continue;
      const values = lastTwo.map((s) => {
        const b = s.accounts.find((x) => x.accountId === a.id);
        return b ? amountToCop(b.balance, a.currency, s.trmCents) : 0;
      });
      if (!values.every((v) => v > limit)) continue;
      const amount = values[1];
      results.push({
        ruleId: 'C06',
        key: `C06:account:${a.id}`,
        severity: 'baja',
        impactCop: Math.round(amount - limit),
        data: { account: a.name, amount: Math.round(amount), limit: Math.round(limit) },
        fallbackMessage: `Tienes ${formatMoney(cop(amount))} en ${a.name} sin rendir.`,
      });
    }
    return results;
  },
};
