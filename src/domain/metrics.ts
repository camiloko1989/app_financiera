// Métricas (docs/diseno-funcional.md §4).
import {
  currentTrm,
  householdMonthlySpending,
  memberMonthlyIncome,
  primaryMember,
  primaryMonthlyBudget,
} from './household';
import { amountToCop } from './money';
import type { Account, Debt, FinancialContext, Snapshot } from './types';

const byId = <T extends { id: number }>(items: T[]) => new Map(items.map((x) => [x.id, x]));

export interface NetWorth {
  assets: number;
  liabilities: number;
  netWorth: number;
}

/** Patrimonio de un snapshot con su propia TRM. */
export function netWorthOf(snapshot: Snapshot, accounts: Account[], debts: Debt[]): NetWorth {
  const accs = byId(accounts);
  const dts = byId(debts);
  let assets = 0;
  let liabilities = 0;
  for (const b of snapshot.accounts) {
    const a = accs.get(b.accountId);
    if (a) assets += amountToCop(b.balance, a.currency, snapshot.trmCents);
  }
  for (const b of snapshot.debts) {
    const d = dts.get(b.debtId);
    if (!d) continue;
    const value = amountToCop(b.balance, d.currency, snapshot.trmCents);
    if (d.direction === 'me_deben') assets += value;
    else liabilities += value;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function currentSnapshot(ctx: FinancialContext): Snapshot {
  const s = ctx.snapshots.at(-1);
  if (!s) throw new Error('Se necesita al menos un snapshot');
  return s;
}

export function previousSnapshot(ctx: FinancialContext): Snapshot | undefined {
  return ctx.snapshots.at(-2);
}

const belongsToPrimary = (ownerMemberId: number | null | undefined, primaryId: number) =>
  ownerMemberId == null || ownerMemberId === primaryId;

/** Σ saldos de tarjetas de crédito del miembro principal (o sin dueño), en COP. */
export function creditCardDebt(ctx: FinancialContext): number {
  const snap = currentSnapshot(ctx);
  const dts = byId(ctx.debts);
  const primaryId = primaryMember(ctx).id;
  return snap.debts.reduce((s, b) => {
    const d = dts.get(b.debtId);
    if (!d || d.kind !== 'tarjeta_credito' || d.direction !== 'debo') return s;
    if (!belongsToPrimary(d.ownerMemberId, primaryId)) return s;
    return s + amountToCop(b.balance, d.currency, snap.trmCents);
  }, 0);
}

/**
 * Liquidez disponible = Σ cuentas `inmediata` que cuentan como liquidez
 * − tarjetas de crédito − obligaciones pendientes del mes.
 */
export function availableLiquidity(ctx: FinancialContext): number {
  const snap = currentSnapshot(ctx);
  const accs = byId(ctx.accounts);
  const cash = snap.accounts.reduce((s, b) => {
    const a = accs.get(b.accountId);
    if (!a || a.liquidity !== 'inmediata' || !a.countsAsLiquidity) return s;
    return s + amountToCop(b.balance, a.currency, snap.trmCents);
  }, 0);
  return cash - creditCardDebt(ctx) - (ctx.pendingObligations ?? 0);
}

/** Base mensual del fondo de emergencia según los ajustes (GTH o "mi parte"). */
export function emergencyBaseMonthly(ctx: FinancialContext): number {
  return ctx.settings.emergencyBase === 'hogar'
    ? householdMonthlySpending(ctx)
    : primaryMonthlyBudget(ctx);
}

export function emergencyTarget(ctx: FinancialContext): number {
  return Math.round(ctx.settings.emergencyMinMonths * emergencyBaseMonthly(ctx));
}

/** Meses de colchón = liquidez / base. null si no hay gastos registrados. */
export function cushionMonths(ctx: FinancialContext, liquidity = availableLiquidity(ctx)): number | null {
  const base = emergencyBaseMonthly(ctx);
  return base > 0 ? liquidity / base : null;
}

/** Gastos fijos mensuales que le corresponden al miembro principal (GFM). */
export function fixedMonthlyExpenses(ctx: FinancialContext): number {
  return primaryMonthlyBudget(ctx);
}

/** Carga de deuda = Σ cuotas (deudas `debo` del principal) / ingreso mensual del principal. */
export function debtLoad(ctx: FinancialContext): { installments: number; income: number; ratio: number } | null {
  const primaryId = primaryMember(ctx).id;
  const trm = currentTrm(ctx);
  const income = memberMonthlyIncome(ctx, primaryId);
  if (income <= 0) return null;
  const installments = ctx.debts
    .filter((d) => d.direction === 'debo' && d.installment && belongsToPrimary(d.ownerMemberId, primaryId))
    .reduce((s, d) => s + amountToCop(d.installment ?? 0, d.currency, trm), 0);
  return { installments, income, ratio: installments / income };
}

/** Σ saldos USD del snapshot actual (centavos), para la tarjeta de Inicio. */
export function usdHoldings(ctx: FinancialContext): number {
  const snap = currentSnapshot(ctx);
  const accs = byId(ctx.accounts);
  return snap.accounts.reduce((s, b) => (accs.get(b.accountId)?.currency === 'USD' ? s + b.balance : s), 0);
}
