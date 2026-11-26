import type { FinancialContext, Severity } from '../types';

export interface AdviceResult {
  ruleId: string; // 'C01'...'C09'
  /** identifica el consejo para el enfriamiento (p. ej. 'C02:debt:3') */
  key: string;
  severity: Severity;
  /** para ordenar */
  impactCop: number;
  /** valores para la plantilla y el LLM */
  data: Record<string, number | string>;
  /** mensaje modelo (sin LLM) */
  fallbackMessage: string;
}

export interface AdviceRule {
  id: string;
  /** datos que faltan para evaluar la regla; si hay alguno no se dispara (RF-1.3) */
  requires(ctx: FinancialContext): string[];
  evaluate(ctx: FinancialContext): AdviceResult[];
}

export const SEVERITY_RANK: Record<Severity, number> = { alta: 3, media: 2, baja: 1 };
