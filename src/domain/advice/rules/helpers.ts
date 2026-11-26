import { memberMonthlyIncome, primaryMember } from '../../household';
import type { FinancialContext } from '../../types';

export const MISSING = {
  snapshot: 'tu primer cierre de mes',
  previousSnapshot: 'un segundo cierre de mes',
  income: 'tus ingresos',
  expenses: 'tus gastos (obligaciones)',
  plannedSavings: 'tu ahorro planeado',
} as const;

export const primaryIncome = (ctx: FinancialContext) => memberMonthlyIncome(ctx, primaryMember(ctx).id);

export const belongsToPrimary = (ctx: FinancialContext, owner: number | null | undefined) =>
  owner == null || owner === primaryMember(ctx).id;

export const cop = (amount: number) => ({ amount: Math.round(amount), currency: 'COP' as const });
