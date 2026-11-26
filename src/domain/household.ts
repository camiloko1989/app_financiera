// Reparto del hogar (M4) y gastos mensuales.
import { amountToCop } from './money';
import type { FinancialContext, Frequency, Member, Money } from './types';

const PER_MONTH: Record<Frequency, number> = {
  mensual: 1,
  quincenal: 2,
  bimestral: 1 / 2,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
};

export function currentTrm(ctx: FinancialContext): number {
  const last = ctx.snapshots.at(-1);
  if (!last) throw new Error('Se necesita al menos un snapshot para conocer la TRM');
  return last.trmCents;
}

/** Valor mensual en COP de un monto con frecuencia. */
export function monthlyCop(money: Money, frequency: Frequency, trmCents: number): number {
  return amountToCop(money.amount, money.currency, trmCents) * PER_MONTH[frequency];
}

export function primaryMember(ctx: FinancialContext): Member {
  const m = ctx.members.find((x) => x.isPrimary) ?? ctx.members[0];
  if (!m) throw new Error('El hogar no tiene miembros');
  return m;
}

export function memberMonthlyIncome(ctx: FinancialContext, memberId: number): number {
  const trm = currentTrm(ctx);
  return ctx.incomes
    .filter((i) => i.memberId === memberId)
    .reduce((s, i) => s + monthlyCop(i.amount, i.frequency, trm), 0);
}

/** Σ obligaciones compartidas del mes (COP). */
export function sharedMonthly(ctx: FinancialContext): number {
  const trm = currentTrm(ctx);
  return ctx.obligations
    .filter((o) => o.shared)
    .reduce((s, o) => s + monthlyCop(o.amount, o.frequency, trm), 0);
}

/**
 * Gastos personales mensuales de un miembro: obligaciones no compartidas que paga,
 * gastos prorrateados suyos y, para el miembro principal, las provisiones / 12.
 * Las líneas de ahorro (vacaciones, inversiones) se modelan como metas, no como obligaciones.
 */
export function personalMonthly(ctx: FinancialContext, memberId: number): number {
  const trm = currentTrm(ctx);
  const obligations = ctx.obligations
    .filter((o) => !o.shared && o.payerMemberId === memberId)
    .reduce((s, o) => s + monthlyCop(o.amount, o.frequency, trm), 0);
  const prorated = ctx.proratedExpenses
    .filter((p) => p.ownerMemberId === memberId)
    .reduce((s, p) => s + p.cost / p.durationMonths, 0);
  const provisions =
    primaryMember(ctx).id === memberId
      ? ctx.provisions.reduce((s, p) => s + p.annualAmount / 12, 0)
      : 0;
  return obligations + prorated + provisions;
}

/**
 * Proporción de reparto en porcentajes enteros (RF-4.1).
 * Automática: ingreso del miembro / ingreso del hogar, redondeada al entero;
 * el último miembro recibe el resto para que sume 100.
 */
export function splitPercents(ctx: FinancialContext): Map<number, number> {
  const result = new Map<number, number>();
  const members = ctx.members;
  if (members.length === 0) return result;

  if (ctx.settings.splitMode === 'manual' && ctx.settings.splitManual) {
    for (const m of members) result.set(m.id, ctx.settings.splitManual[m.id] ?? 0);
    return result;
  }

  const incomes = members.map((m) => memberMonthlyIncome(ctx, m.id));
  const total = incomes.reduce((a, b) => a + b, 0);
  let assigned = 0;
  members.forEach((m, i) => {
    if (i === members.length - 1) {
      result.set(m.id, 100 - assigned);
    } else {
      const pct = total > 0 ? Math.round((incomes[i] / total) * 100) : Math.round(100 / members.length);
      result.set(m.id, pct);
      assigned += pct;
    }
  });
  return result;
}

export interface MemberSplit {
  memberId: number;
  name: string;
  percent: number;
  income: number;
  /** lo que paga directamente en gastos compartidos */
  paid: number;
  /** lo que le corresponde (RF-4.2) */
  share: number;
  /** paid − share: positivo = le deben (RF-4.3) */
  balance: number;
  /** share + gastos personales (RF-4.4) */
  personalBudget: number;
}

export interface HouseholdSplit {
  totalShared: number;
  members: MemberSplit[];
}

export function householdSplit(ctx: FinancialContext): HouseholdSplit {
  const trm = currentTrm(ctx);
  const totalShared = Math.round(sharedMonthly(ctx));
  const percents = splitPercents(ctx);
  let assigned = 0;

  const members = ctx.members.map((m, i): MemberSplit => {
    const percent = percents.get(m.id) ?? 0;
    const isLast = i === ctx.members.length - 1;
    const share = isLast ? totalShared - assigned : Math.round((totalShared * percent) / 100);
    assigned += share;
    const paid = Math.round(
      ctx.obligations
        .filter((o) => o.shared && o.payerMemberId === m.id)
        .reduce((s, o) => s + monthlyCop(o.amount, o.frequency, trm), 0),
    );
    return {
      memberId: m.id,
      name: m.name,
      percent,
      income: Math.round(memberMonthlyIncome(ctx, m.id)),
      paid,
      share,
      balance: paid - share,
      personalBudget: Math.round(share + personalMonthly(ctx, m.id)),
    };
  });

  return { totalShared, members };
}

/** Lo que le toca al miembro principal en compartidos + sus personales (base "mi parte" y GFM). */
export function primaryMonthlyBudget(ctx: FinancialContext): number {
  const primary = primaryMember(ctx);
  return householdSplit(ctx).members.find((m) => m.memberId === primary.id)?.personalBudget ?? 0;
}

/** Gasto total del hogar (GTH): compartidos + personales de todos los miembros. */
export function householdMonthlySpending(ctx: FinancialContext): number {
  return Math.round(
    sharedMonthly(ctx) + ctx.members.reduce((s, m) => s + personalMonthly(ctx, m.id), 0),
  );
}
