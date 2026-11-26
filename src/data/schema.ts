// Esquema SQLite (docs/arquitectura.md §5).
// Dinero como enteros: COP en pesos, USD en centavos (A5). Fechas en texto ISO 8601.
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const id = () => integer('id').primaryKey({ autoIncrement: true });
const createdAt = () =>
  text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

export const CURRENCIES = ['COP', 'USD'] as const;
export const INCOME_PROFILES = ['empleado', 'contratista', 'independiente'] as const;
export const INCOME_KINDS = ['fijo', 'variable'] as const;
export const FREQUENCIES = ['mensual', 'quincenal', 'bimestral', 'trimestral', 'semestral', 'anual'] as const;
export const LIQUIDITY = ['inmediata', 'con_fecha', 'volatil'] as const;
export const DEBT_KINDS = ['tarjeta_credito', 'hipoteca', 'credito_consumo', 'informal'] as const;
export const DEBT_DIRECTIONS = ['debo', 'me_deben'] as const;
export const RATE_UNITS = ['EM', 'EA'] as const;
export const GOAL_KINDS = ['acumular', 'aporte_recurrente'] as const;
export const SEVERITIES = ['alta', 'media', 'baja'] as const;
export const ADVICE_STATUS = ['nuevo', 'visto', 'descartado', 'resuelto'] as const;
export const PURCHASE_KINDS = ['necesidad', 'gusto'] as const;

export const member = sqliteTable('member', {
  id: id(),
  name: text('name').notNull(),
  incomeProfile: text('income_profile', { enum: INCOME_PROFILES }).notNull(),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
});

export const income = sqliteTable('income', {
  id: id(),
  memberId: integer('member_id')
    .notNull()
    .references(() => member.id, { onDelete: 'cascade' }),
  concept: text('concept'),
  amount: integer('amount').notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull(),
  kind: text('kind', { enum: INCOME_KINDS }).notNull(),
  frequency: text('frequency', { enum: FREQUENCIES }).notNull().default('mensual'),
});

export const account = sqliteTable('account', {
  id: id(),
  name: text('name').notNull(),
  institution: text('institution'),
  currency: text('currency', { enum: CURRENCIES }).notNull(),
  liquidity: text('liquidity', { enum: LIQUIDITY }).notNull(),
  // null = cuenta compartida del hogar
  ownerMemberId: integer('owner_member_id').references(() => member.id),
  isInvestment: integer('is_investment', { mode: 'boolean' }).notNull().default(false),
  maturityDate: text('maturity_date'),
  countsAsLiquidity: integer('counts_as_liquidity', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const snapshot = sqliteTable('snapshot', {
  id: id(),
  date: text('date').notNull(),
  // COP por USD, en centavos de peso (p. ej. 3.712,45 → 371245)
  trmCents: integer('trm_cents').notNull(),
  createdAt: createdAt(),
  editedAt: text('edited_at'),
  note: text('note'),
});

export const accountBalance = sqliteTable(
  'account_balance',
  {
    snapshotId: integer('snapshot_id')
      .notNull()
      .references(() => snapshot.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => account.id),
    balance: integer('balance').notNull(),
    // aporte del periodo (solo cuentas volátiles)
    contribution: integer('contribution'),
  },
  (t) => [primaryKey({ columns: [t.snapshotId, t.accountId] })],
);

export const debt = sqliteTable('debt', {
  id: id(),
  name: text('name').notNull(),
  kind: text('kind', { enum: DEBT_KINDS }).notNull(),
  direction: text('direction', { enum: DEBT_DIRECTIONS }).notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull().default('COP'),
  // tasa en puntos básicos (2,10% → 210) en la unidad que dio el usuario
  rateBps: integer('rate_bps'),
  rateUnit: text('rate_unit', { enum: RATE_UNITS }),
  installment: integer('installment'),
  termMonths: integer('term_months'),
  ownerMemberId: integer('owner_member_id').references(() => member.id),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const debtBalance = sqliteTable(
  'debt_balance',
  {
    snapshotId: integer('snapshot_id')
      .notNull()
      .references(() => snapshot.id, { onDelete: 'cascade' }),
    debtId: integer('debt_id')
      .notNull()
      .references(() => debt.id),
    balance: integer('balance').notNull(),
  },
  (t) => [primaryKey({ columns: [t.snapshotId, t.debtId] })],
);

export const obligation = sqliteTable('obligation', {
  id: id(),
  concept: text('concept').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull().default('COP'),
  frequency: text('frequency', { enum: FREQUENCIES }).notNull().default('mensual'),
  payerMemberId: integer('payer_member_id')
    .notNull()
    .references(() => member.id),
  paymentMethod: text('payment_method'),
  shared: integer('shared', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const proratedExpense = sqliteTable('prorated_expense', {
  id: id(),
  concept: text('concept').notNull(),
  cost: integer('cost').notNull(),
  durationMonths: integer('duration_months').notNull(),
  ownerMemberId: integer('owner_member_id')
    .notNull()
    .references(() => member.id),
  startDate: text('start_date'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const provision = sqliteTable('provision', {
  id: id(),
  concept: text('concept').notNull(),
  annualAmount: integer('annual_amount').notNull(),
  dueDate: text('due_date').notNull(),
  savedAmount: integer('saved_amount').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const goal = sqliteTable('goal', {
  id: id(),
  name: text('name').notNull(),
  kind: text('kind', { enum: GOAL_KINDS }).notNull(),
  targetAmount: integer('target_amount'),
  targetDate: text('target_date'),
  monthlyContribution: integer('monthly_contribution'),
  priority: integer('priority').notNull(),
  manualProgress: integer('manual_progress'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const goalAccount = sqliteTable(
  'goal_account',
  {
    goalId: integer('goal_id')
      .notNull()
      .references(() => goal.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.accountId] })],
);

export const advice = sqliteTable(
  'advice',
  {
    id: id(),
    ruleId: text('rule_id').notNull(),
    snapshotId: integer('snapshot_id').references(() => snapshot.id, { onDelete: 'set null' }),
    severity: text('severity', { enum: SEVERITIES }).notNull(),
    impactCop: integer('impact_cop').notNull().default(0),
    dataJson: text('data_json').notNull(),
    message: text('message').notNull(),
    status: text('status', { enum: ADVICE_STATUS }).notNull().default('nuevo'),
    createdAt: createdAt(),
    dismissedAt: text('dismissed_at'),
  },
  (t) => [index('advice_rule_status_idx').on(t.ruleId, t.status)],
);

export const purchaseQuery = sqliteTable('purchase_query', {
  id: id(),
  description: text('description'),
  price: integer('price').notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull(),
  // 'contado' o el id de la deuda (tarjeta o crédito) como texto
  paymentMethod: text('payment_method').notNull(),
  installments: integer('installments'),
  kind: text('kind', { enum: PURCHASE_KINDS }).notNull(),
  resultJson: text('result_json').notNull(),
  createdAt: createdAt(),
});

export const setting = sqliteTable('setting', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
});
