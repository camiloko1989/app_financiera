import { daysBetween, formatDate } from '../../dates';
import { currentSnapshot } from '../../metrics';
import { amountToCop, formatMoney } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';
import { cop } from './helpers';

/** C07 · CDT por vencer en ≤ N días. */
export const c07Cdt: AdviceRule = {
  id: 'C07',
  requires: () => [],
  evaluate: (ctx) => {
    if (ctx.snapshots.length === 0) return [];
    const snap = currentSnapshot(ctx);
    const results: AdviceResult[] = [];
    for (const a of ctx.accounts) {
      if (a.liquidity !== 'con_fecha' || !a.maturityDate) continue;
      const days = daysBetween(ctx.asOf, a.maturityDate);
      if (days < 0 || days > ctx.settings.cdtNoticeDays) continue;
      const b = snap.accounts.find((x) => x.accountId === a.id);
      const amount = b ? amountToCop(b.balance, a.currency, snap.trmCents) : 0;
      results.push({
        ruleId: 'C07',
        key: `C07:account:${a.id}:${a.maturityDate}`,
        severity: 'media',
        impactCop: Math.round(amount),
        data: { amount: Math.round(amount), date: a.maturityDate, days },
        fallbackMessage: `Tu CDT de ${formatMoney(cop(amount))} vence el ${formatDate(a.maturityDate)}.`,
      });
    }
    return results;
  },
};
