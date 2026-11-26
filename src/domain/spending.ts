// Gasto inferido entre dos snapshots (docs/diseno-funcional.md §4.1).
import { amountToCop } from './money';
import type { Account, Debt, Snapshot } from './types';

export interface InferredSpending {
  netWorthDelta: number;
  fxEffect: number;
  investmentReturn: number;
  realSavings: number;
  periodIncome: number;
  inferredSpending: number;
  budgetedSpending?: number;
  /** gasto inferido − presupuestado; positivo = se pasó */
  deviation?: number;
}

/**
 * Solo se comparan las cuentas y deudas presentes en ambos snapshots: una cuenta
 * recién registrada no es ahorro y una archivada no es gasto.
 *
 * - efecto_cambiario = Σ saldo_USD_{t−1} × (TRM_t − TRM_{t−1})   (deudas en USD restan)
 * - rend_inversiones = Σ (saldo_t − saldo_{t−1} − aporte) × TRM_t  [solo cuentas volátiles]
 */
export function inferSpending(input: {
  previous: Snapshot;
  current: Snapshot;
  accounts: Account[];
  debts: Debt[];
  periodIncome: number;
  budgetedSpending?: number;
}): InferredSpending {
  const { previous: prev, current: curr, periodIncome, budgetedSpending } = input;
  const accs = new Map(input.accounts.map((a) => [a.id, a]));
  const dts = new Map(input.debts.map((d) => [d.id, d]));
  const prevAcc = new Map(prev.accounts.map((b) => [b.accountId, b]));
  const prevDebt = new Map(prev.debts.map((b) => [b.debtId, b]));
  const dTrm = curr.trmCents - prev.trmCents;

  let netWorthDelta = 0;
  let fxEffect = 0;
  let investmentReturn = 0;

  for (const b of curr.accounts) {
    const a = accs.get(b.accountId);
    const p = prevAcc.get(b.accountId);
    if (!a || !p) continue;
    netWorthDelta +=
      amountToCop(b.balance, a.currency, curr.trmCents) - amountToCop(p.balance, a.currency, prev.trmCents);
    if (a.currency === 'USD') fxEffect += amountToCop(p.balance, 'USD', dTrm);
    if (a.liquidity === 'volatil') {
      investmentReturn += amountToCop(b.balance - p.balance - (b.contribution ?? 0), a.currency, curr.trmCents);
    }
  }

  for (const b of curr.debts) {
    const d = dts.get(b.debtId);
    const p = prevDebt.get(b.debtId);
    if (!d || !p) continue;
    const sign = d.direction === 'me_deben' ? 1 : -1;
    netWorthDelta +=
      sign *
      (amountToCop(b.balance, d.currency, curr.trmCents) - amountToCop(p.balance, d.currency, prev.trmCents));
    if (d.currency === 'USD') fxEffect += sign * amountToCop(p.balance, 'USD', dTrm);
  }

  const realSavings = netWorthDelta - fxEffect - investmentReturn;
  const inferredSpending = periodIncome - realSavings;

  return {
    netWorthDelta,
    fxEffect,
    investmentReturn,
    realSavings,
    periodIncome,
    inferredSpending,
    budgetedSpending,
    deviation: budgetedSpending === undefined ? undefined : inferredSpending - budgetedSpending,
  };
}
