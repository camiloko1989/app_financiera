import { daysBetween } from '../dates';
import type { FinancialContext, Severity } from '../types';
import { SEVERITY_RANK, type AdviceResult, type AdviceRule } from './rule';

export interface DismissedAdvice {
  key: string;
  severity: Severity;
  dismissedAt: string;
}

export interface BlockedRule {
  ruleId: string;
  missing: string[];
}

export interface AdviceRun {
  /** consejos a mostrar, ya ordenados y recortados */
  visible: AdviceResult[];
  /** todos los que se dispararon (antes del enfriamiento y del recorte) */
  triggered: AdviceResult[];
  /** reglas sin datos suficientes: "Completa {dato} para activar este análisis" */
  blocked: BlockedRule[];
}

/** Un consejo descartado no vuelve en N días, salvo que su severidad suba. */
export function isInCooldown(a: AdviceResult, history: DismissedAdvice[], asOf: string, days: number): boolean {
  return history.some(
    (h) =>
      h.key === a.key &&
      daysBetween(h.dismissedAt, asOf) < days &&
      SEVERITY_RANK[a.severity] <= SEVERITY_RANK[h.severity],
  );
}

export function bySeverityThenImpact(a: AdviceResult, b: AdviceResult): number {
  return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.impactCop - a.impactCop;
}

export function runAdvice(ctx: FinancialContext, rules: AdviceRule[], history: DismissedAdvice[] = []): AdviceRun {
  const blocked: BlockedRule[] = [];
  const triggered: AdviceResult[] = [];

  for (const rule of rules) {
    const missing = rule.requires(ctx);
    if (missing.length > 0) {
      blocked.push({ ruleId: rule.id, missing });
      continue;
    }
    triggered.push(...rule.evaluate(ctx));
  }

  const visible = triggered
    .filter((a) => !isInCooldown(a, history, ctx.asOf, ctx.settings.adviceCooldownDays))
    .sort(bySeverityThenImpact)
    .slice(0, ctx.settings.maxVisibleAdvice);

  return { visible, triggered, blocked };
}
