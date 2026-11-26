import type { AdviceRule } from '../rule';
import { c01EmergencyFund } from './c01-emergency-fund';
import { c02CreditCard } from './c02-credit-card';
import { c03SavingsPlan } from './c03-savings-plan';
import { c04DebtLoad } from './c04-debt-load';
import { c05Provision } from './c05-provision';
import { c06IdleMoney } from './c06-idle-money';
import { c07Cdt } from './c07-cdt';
import { c08GoalBehind } from './c08-goal-behind';
import { c09InformalDebt } from './c09-informal-debt';

export const ALL_RULES: AdviceRule[] = [
  c01EmergencyFund,
  c02CreditCard,
  c03SavingsPlan,
  c04DebtLoad,
  c05Provision,
  c06IdleMoney,
  c07Cdt,
  c08GoalBehind,
  c09InformalDebt,
];

export {
  c01EmergencyFund,
  c02CreditCard,
  c03SavingsPlan,
  c04DebtLoad,
  c05Provision,
  c06IdleMoney,
  c07Cdt,
  c08GoalBehind,
  c09InformalDebt,
};
