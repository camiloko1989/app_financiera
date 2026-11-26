import { amountToCop } from '../../money';
import type { AdviceResult, AdviceRule } from '../rule';

/** C09 · Deuda informal sin movimiento: mismo saldo en N+ snapshots. */
export const c09InformalDebt: AdviceRule = {
  id: 'C09',
  requires: () => [],
  evaluate: (ctx) => {
    const n = ctx.settings.informalDebtStaleSnapshots;
    if (ctx.snapshots.length < n) return [];
    const recent = ctx.snapshots.slice(-n);
    const results: AdviceResult[] = [];
    for (const d of ctx.debts) {
      if (d.kind !== 'informal') continue;
      const balances = recent.map((s) => s.debts.find((x) => x.debtId === d.id)?.balance);
      const first = balances[0];
      if (first === undefined || first <= 0 || !balances.every((b) => b === first)) continue;
      const amount = amountToCop(first, d.currency, recent[n - 1].trmCents);
      results.push({
        ruleId: 'C09',
        key: `C09:debt:${d.id}`,
        severity: 'baja',
        impactCop: Math.round(amount),
        data: { debt: d.name, balance: Math.round(amount), snapshots: n },
        fallbackMessage: `${d.name} no ha cambiado en ${n} meses.`,
      });
    }
    return results;
  },
};
