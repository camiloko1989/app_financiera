// Datos de prueba basados en el Anexo A del diseño funcional (configuración de referencia, nov 2026).
// Los saldos de cuentas y deudas no están en el anexo: son inventados pero coherentes con él.
import {
  DEFAULT_SETTINGS,
  type Account,
  type Debt,
  type FinancialContext,
  type Goal,
  type Obligation,
  type Settings,
  type Snapshot,
} from '@/domain/types';

export const CAMILO = 1;
export const CATA = 2;

export const ACC = { davivienda: 1, nequi: 2, efectivo: 3, wise: 4, trii: 5, cdt: 6, bancolombiaCata: 7 };
export const DEBT = { rappi: 1, nu: 2, hipoteca: 3, madre: 4, acreedores: 5 };
export const GOAL = { fondo: 1, japon: 2, hipoteca: 3, inversiones: 4 };

export const accounts: Account[] = [
  { id: ACC.davivienda, name: 'Davivienda', currency: 'COP', liquidity: 'inmediata', ownerMemberId: CAMILO, isInvestment: false, countsAsLiquidity: true },
  { id: ACC.nequi, name: 'Nequi', currency: 'COP', liquidity: 'inmediata', ownerMemberId: CAMILO, isInvestment: false, countsAsLiquidity: true },
  { id: ACC.efectivo, name: 'Efectivo', currency: 'COP', liquidity: 'inmediata', ownerMemberId: CAMILO, isInvestment: false, countsAsLiquidity: true },
  { id: ACC.wise, name: 'Wise', currency: 'USD', liquidity: 'inmediata', ownerMemberId: CAMILO, isInvestment: false, countsAsLiquidity: true },
  { id: ACC.trii, name: 'Trii', currency: 'COP', liquidity: 'volatil', ownerMemberId: CAMILO, isInvestment: true, countsAsLiquidity: false },
  { id: ACC.cdt, name: 'CDT', currency: 'COP', liquidity: 'con_fecha', ownerMemberId: CAMILO, isInvestment: true, maturityDate: '2026-12-15', countsAsLiquidity: false },
  // D4: las cuentas de Cata no cuentan como liquidez por defecto
  { id: ACC.bancolombiaCata, name: 'Bancolombia Cata', currency: 'COP', liquidity: 'inmediata', ownerMemberId: CATA, isInvestment: false, countsAsLiquidity: false },
];

export const debts: Debt[] = [
  { id: DEBT.rappi, name: 'TC Rappi', kind: 'tarjeta_credito', direction: 'debo', currency: 'COP', rateBps: 210, rateUnit: 'EM', ownerMemberId: CAMILO },
  { id: DEBT.nu, name: 'TC Nu', kind: 'tarjeta_credito', direction: 'debo', currency: 'COP', rateBps: 212, rateUnit: 'EM', ownerMemberId: CAMILO },
  { id: DEBT.hipoteca, name: 'Hipoteca', kind: 'hipoteca', direction: 'debo', currency: 'COP', installment: 3_050_000, ownerMemberId: CAMILO },
  { id: DEBT.madre, name: 'Deuda Madre', kind: 'informal', direction: 'debo', currency: 'COP', ownerMemberId: CAMILO },
  { id: DEBT.acreedores, name: 'Acreedores', kind: 'informal', direction: 'me_deben', currency: 'COP', ownerMemberId: CAMILO },
];

// Compartidos: 7.160.000 (Camilo paga 4.490.000, Cata 2.670.000).
// Personales: Camilo 2.255.000 (1.982.500 obligaciones + 22.500 Piloskin + 250.000 provisión de renta) · Cata 485.000.
export const obligations: Obligation[] = [
  { id: 1, concept: 'Cuota hipotecaria', amount: { amount: 3_050_000, currency: 'COP' }, frequency: 'mensual', payerMemberId: CAMILO, shared: true },
  { id: 2, concept: 'Administración y servicios', amount: { amount: 1_440_000, currency: 'COP' }, frequency: 'mensual', payerMemberId: CAMILO, shared: true },
  { id: 3, concept: 'Salidas', amount: { amount: 1_500_000, currency: 'COP' }, frequency: 'mensual', payerMemberId: CATA, shared: true },
  { id: 4, concept: 'Mercado', amount: { amount: 1_170_000, currency: 'COP' }, frequency: 'mensual', payerMemberId: CATA, shared: true },
  { id: 5, concept: 'Personales Camilo', amount: { amount: 1_982_500, currency: 'COP' }, frequency: 'mensual', payerMemberId: CAMILO, shared: false },
  { id: 6, concept: 'Personales Cata', amount: { amount: 485_000, currency: 'COP' }, frequency: 'mensual', payerMemberId: CATA, shared: false },
];

export const goals: Goal[] = [
  { id: GOAL.fondo, name: 'Fondo de emergencia', kind: 'acumular', priority: 1, isEmergencyFund: true },
  { id: GOAL.japon, name: 'Viaje a Japón', kind: 'acumular', priority: 2, targetAmount: 30_000_000, targetDate: '2027-10-31', monthlyContribution: 500_000, accountIds: [] },
  { id: GOAL.hipoteca, name: 'Abonos extra a la hipoteca', kind: 'aporte_recurrente', priority: 3, monthlyContribution: 450_000 },
  { id: GOAL.inversiones, name: 'Aporte a inversiones', kind: 'aporte_recurrente', priority: 4, monthlyContribution: 500_000 },
];

export const snapshotNov: Snapshot = {
  id: 1,
  date: '2026-11-08',
  trmCents: 365_000,
  accounts: [
    { accountId: ACC.davivienda, balance: 600_000 },
    { accountId: ACC.nequi, balance: 800_000 },
    { accountId: ACC.efectivo, balance: 50_000 },
    { accountId: ACC.wise, balance: 350_000 }, // US$3.500,00
    { accountId: ACC.trii, balance: 6_800_000 },
    { accountId: ACC.cdt, balance: 5_000_000 },
    { accountId: ACC.bancolombiaCata, balance: 2_000_000 },
  ],
  debts: [
    { debtId: DEBT.rappi, balance: 1_000_000 },
    { debtId: DEBT.nu, balance: 900_000 },
    { debtId: DEBT.hipoteca, balance: 150_500_000 },
    { debtId: DEBT.madre, balance: 5_000_000 },
    { debtId: DEBT.acreedores, balance: 500_000 },
  ],
};

export const snapshotDic: Snapshot = {
  id: 2,
  date: '2026-12-08',
  trmCents: 370_000,
  accounts: [
    { accountId: ACC.davivienda, balance: 650_000 },
    { accountId: ACC.nequi, balance: 911_000 },
    { accountId: ACC.efectivo, balance: 50_000 },
    { accountId: ACC.wise, balance: 379_000 }, // US$3.790,00
    { accountId: ACC.trii, balance: 7_180_000, contribution: 500_000 },
    { accountId: ACC.cdt, balance: 5_000_000 },
    { accountId: ACC.bancolombiaCata, balance: 2_000_000 },
  ],
  debts: [
    { debtId: DEBT.rappi, balance: 1_200_000 },
    { debtId: DEBT.nu, balance: 800_000 },
    { debtId: DEBT.hipoteca, balance: 150_000_000 },
    { debtId: DEBT.madre, balance: 5_000_000 },
    { debtId: DEBT.acreedores, balance: 500_000 },
  ],
};

export function makeContext(overrides: Partial<FinancialContext> = {}, settings: Partial<Settings> = {}): FinancialContext {
  return {
    asOf: '2026-12-08',
    settings: { ...DEFAULT_SETTINGS, ...settings },
    members: [
      { id: CAMILO, name: 'Camilo', isPrimary: true },
      { id: CATA, name: 'Cata', isPrimary: false },
    ],
    incomes: [
      { memberId: CAMILO, amount: { amount: 8_790_000, currency: 'COP' }, frequency: 'mensual' },
      { memberId: CATA, amount: { amount: 5_100_000, currency: 'COP' }, frequency: 'mensual' },
      { memberId: CATA, amount: { amount: 500_000, currency: 'COP' }, frequency: 'mensual' },
    ],
    accounts,
    debts,
    obligations,
    proratedExpenses: [{ id: 1, concept: 'Piloskin', cost: 90_000, durationMonths: 4, ownerMemberId: CAMILO }],
    provisions: [{ id: 1, concept: 'Impuesto de renta', annualAmount: 3_000_000, dueDate: '2027-08-10', savedAmount: 1_000_000 }],
    goals,
    snapshots: [snapshotNov, snapshotDic],
    ...overrides,
  };
}
