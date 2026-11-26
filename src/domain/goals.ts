// Metas (M6): avance, proyección y estado.
import { addMonths, isAfter, monthsBetween } from './dates';
import { availableLiquidity, currentSnapshot, emergencyTarget } from './metrics';
import { amountToCop } from './money';
import type { FinancialContext, Goal } from './types';

export type AccumulateStatus = 'cumplida' | 'bajo_minimo' | 'atrasada' | 'en_camino';
export type RecurringStatus = 'cumplido' | 'pendiente';

export interface AccumulateProgress {
  kind: 'acumular';
  goal: Goal;
  target: number;
  progress: number;
  /** 0–1 */
  fraction: number;
  /** null si no hay aporte mensual y no está cumplida */
  projectedDate: string | null;
  monthsLate: number;
  /** aporte mensual necesario para llegar a tiempo */
  requiredMonthly: number | null;
  status: AccumulateStatus;
}

export interface RecurringProgress {
  kind: 'aporte_recurrente';
  goal: Goal;
  monthly: number;
  contributed: number;
  /** % de periodos cumplidos en el historial (0–1), null sin historial */
  completionRate: number | null;
  status: RecurringStatus;
}

export type GoalProgress = AccumulateProgress | RecurringProgress;

export function goalTarget(ctx: FinancialContext, goal: Goal): number {
  return goal.isEmergencyFund ? emergencyTarget(ctx) : (goal.targetAmount ?? 0);
}

export function goalBalance(ctx: FinancialContext, goal: Goal): number {
  if (goal.manualProgress !== undefined) return goal.manualProgress;
  // El fondo de emergencia avanza con la liquidez disponible (Metas: "$15,2M de $39,6M").
  if (goal.isEmergencyFund) return ctx.snapshots.length ? Math.max(0, availableLiquidity(ctx)) : 0;
  const ids = new Set(goal.accountIds ?? []);
  if (ids.size === 0 || ctx.snapshots.length === 0) return 0;
  const snap = currentSnapshot(ctx);
  const accs = new Map(ctx.accounts.map((a) => [a.id, a]));
  return snap.accounts.reduce((s, b) => {
    const a = accs.get(b.accountId);
    return a && ids.has(a.id) ? s + amountToCop(b.balance, a.currency, snap.trmCents) : s;
  }, 0);
}

export function goalProgress(ctx: FinancialContext, goal: Goal): GoalProgress {
  if (goal.kind === 'aporte_recurrente') {
    const monthly = goal.monthlyContribution ?? 0;
    const contributed = goal.contributedThisPeriod ?? 0;
    const history = goal.contributionHistory ?? [];
    return {
      kind: 'aporte_recurrente',
      goal,
      monthly,
      contributed,
      completionRate: history.length ? history.filter((h) => h >= monthly).length / history.length : null,
      status: monthly > 0 && contributed >= monthly ? 'cumplido' : 'pendiente',
    };
  }

  const target = goalTarget(ctx, goal);
  const progress = goalBalance(ctx, goal);
  const remaining = Math.max(0, target - progress);
  const monthly = goal.monthlyContribution ?? 0;
  const met = target > 0 && remaining === 0;

  const projectedDate = met
    ? ctx.asOf
    : monthly > 0
      ? addMonths(ctx.asOf, Math.ceil(remaining / monthly))
      : null;

  let monthsLate = 0;
  let requiredMonthly: number | null = null;
  let late = false;
  if (goal.targetDate && !met) {
    const monthsLeft = monthsBetween(ctx.asOf, goal.targetDate);
    requiredMonthly = remaining / Math.max(1, monthsLeft);
    if (projectedDate === null) late = true;
    else if (isAfter(projectedDate, goal.targetDate)) {
      late = true;
      monthsLate = monthsBetween(goal.targetDate, projectedDate);
    }
  }

  const status: AccumulateStatus = met
    ? 'cumplida'
    : goal.isEmergencyFund
      ? 'bajo_minimo'
      : late
        ? 'atrasada'
        : 'en_camino';

  return {
    kind: 'acumular',
    goal,
    target,
    progress,
    fraction: target > 0 ? Math.min(1, progress / target) : 0,
    projectedDate,
    monthsLate,
    requiredMonthly,
    status,
  };
}

export function isGoalMet(ctx: FinancialContext, goal: Goal): boolean {
  const p = goalProgress(ctx, goal);
  return p.kind === 'acumular' ? p.status === 'cumplida' : p.status === 'cumplido';
}

/** Metas en orden de prioridad (1 primero). */
export function goalsByPriority(ctx: FinancialContext): Goal[] {
  return [...ctx.goals].sort((a, b) => a.priority - b.priority);
}

/** Meta prioritaria: la configurada o la de mayor prioridad sin cumplir (regla de prioridad, M6). */
export function priorityGoal(ctx: FinancialContext): Goal | undefined {
  const { priorityGoalId } = ctx.settings;
  if (priorityGoalId != null) return ctx.goals.find((g) => g.id === priorityGoalId);
  return goalsByPriority(ctx).find((g) => !isGoalMet(ctx, g));
}
