// Tipos del dominio (docs/arquitectura.md §4.1). Sin dependencias de React ni de la base de datos.
//
// Convenciones de unidades:
// - Dinero en enteros: COP en pesos, USD en centavos (A5).
// - TRM en centavos de peso por USD (3.712,45 → 371245).
// - Tasas en puntos básicos (2,10% → 210) en la unidad que dio el usuario (EM o EA).
// - Fechas ISO 'YYYY-MM-DD'.

export type Currency = 'COP' | 'USD';
export type Money = { amount: number; currency: Currency };

export type Liquidity = 'inmediata' | 'con_fecha' | 'volatil';
export type Frequency = 'mensual' | 'quincenal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
export type DebtKind = 'tarjeta_credito' | 'hipoteca' | 'credito_consumo' | 'informal';
export type DebtDirection = 'debo' | 'me_deben';
export type RateUnit = 'EM' | 'EA';
export type GoalKind = 'acumular' | 'aporte_recurrente';
export type Severity = 'alta' | 'media' | 'baja';
export type PurchaseKind = 'necesidad' | 'gusto';
export type EmergencyBase = 'hogar' | 'mi_parte';

export interface Member {
  id: number;
  name: string;
  isPrimary: boolean;
}

export interface Income {
  memberId: number;
  amount: Money;
  frequency: Frequency;
}

export interface Account {
  id: number;
  name: string;
  currency: Currency;
  liquidity: Liquidity;
  ownerMemberId: number | null;
  isInvestment: boolean;
  maturityDate?: string;
  countsAsLiquidity: boolean;
}

export interface Debt {
  id: number;
  name: string;
  kind: DebtKind;
  direction: DebtDirection;
  currency: Currency;
  rateBps?: number;
  rateUnit?: RateUnit;
  /** cuota mensual en la moneda de la deuda */
  installment?: number;
  ownerMemberId?: number | null;
}

export interface AccountBalance {
  accountId: number;
  balance: number;
  /** aporte del periodo (solo cuentas volátiles) */
  contribution?: number;
}

export interface DebtBalance {
  debtId: number;
  balance: number;
}

export interface Snapshot {
  id: number;
  date: string;
  trmCents: number;
  accounts: AccountBalance[];
  debts: DebtBalance[];
}

export interface Obligation {
  id: number;
  concept: string;
  amount: Money;
  frequency: Frequency;
  payerMemberId: number;
  shared: boolean;
}

export interface ProratedExpense {
  id: number;
  concept: string;
  cost: number;
  durationMonths: number;
  ownerMemberId: number;
}

export interface Provision {
  id: number;
  concept: string;
  annualAmount: number;
  /** próxima fecha de pago */
  dueDate: string;
  savedAmount: number;
}

export interface Goal {
  id: number;
  name: string;
  kind: GoalKind;
  /** 1 = la más importante */
  priority: number;
  targetAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
  manualProgress?: number;
  accountIds?: number[];
  /** la meta del fondo de emergencia toma su objetivo de los ajustes */
  isEmergencyFund?: boolean;
  /** aporte_recurrente: lo aportado en el periodo actual */
  contributedThisPeriod?: number;
  /** aporte_recurrente: lo aportado en cada periodo anterior */
  contributionHistory?: number[];
}

export interface Settings {
  emergencyMinMonths: number;
  emergencyBase: EmergencyBase;
  emergencyHighSeverityMonths: number;
  splitMode: 'automatico' | 'manual';
  /** porcentajes por miembro cuando splitMode = 'manual' */
  splitManual?: Record<number, number>;
  creditCardIncomeThreshold: number; // C02, fracción
  savingsVsPlanMin: number; // C03, fracción
  debtLoadMax: number; // C04, fracción
  provisionNoticeDays: number; // C05
  idleMoneyMultiple: number; // C06
  cdtNoticeDays: number; // C07
  informalDebtStaleSnapshots: number; // C09
  maxVisibleAdvice: number;
  adviceCooldownDays: number;
  purchaseRedInterestShare: number; // M8, fracción del precio
  purchaseYellowDelayWeeks: number; // M8
  purchaseProvisionWindowDays: number; // M8
  /** null = automática: la de mayor prioridad sin cumplir */
  priorityGoalId: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  emergencyMinMonths: 4,
  emergencyBase: 'hogar',
  emergencyHighSeverityMonths: 2,
  splitMode: 'automatico',
  creditCardIncomeThreshold: 0.3,
  savingsVsPlanMin: 0.7,
  debtLoadMax: 0.4,
  provisionNoticeDays: 60,
  idleMoneyMultiple: 2,
  cdtNoticeDays: 15,
  informalDebtStaleSnapshots: 3,
  maxVisibleAdvice: 3,
  adviceCooldownDays: 60,
  purchaseRedInterestShare: 0.1,
  purchaseYellowDelayWeeks: 4,
  purchaseProvisionWindowDays: 30,
  priorityGoalId: null,
};

/** Contexto inmutable que arma la capa application. */
export interface FinancialContext {
  asOf: string;
  settings: Settings;
  members: Member[];
  incomes: Income[];
  accounts: Account[];
  debts: Debt[];
  obligations: Obligation[];
  proratedExpenses: ProratedExpense[];
  provisions: Provision[];
  goals: Goal[];
  /** snapshots en orden cronológico; el último es el actual */
  snapshots: Snapshot[];
  /** obligaciones del mes que aún no se han pagado (COP); por ahora la da application */
  pendingObligations?: number;
  /** ahorro planeado del periodo (COP), para C03 */
  plannedSavings?: number;
}
