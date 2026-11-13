import type { ConsolidationFixture, EntityStatement } from '../../types';
import { round2 } from '../format';

export interface IncomeStatement {
  revenue: number;
  icIncome: number;
  cogs: number;
  grossProfit: number;
  salesMarketing: number;
  rnd: number;
  ga: number;
  icExpense: number;
  totalOpex: number;
  operatingIncome: number;
}

function build(l: EntityStatement['lines'], rate = 1): IncomeStatement {
  const r = (n: number) => round2(n * rate);
  const revenue = r(l.revenue);
  const icIncome = r(l.icIncome);
  const cogs = r(l.cogs);
  const grossProfit = round2(revenue + icIncome - cogs);
  const salesMarketing = r(l.salesMarketing);
  const rnd = r(l.rnd);
  const ga = r(l.ga);
  const icExpense = r(l.icExpense);
  const totalOpex = round2(salesMarketing + rnd + ga + icExpense);
  return { revenue, icIncome, cogs, grossProfit, salesMarketing, rnd, ga, icExpense, totalOpex, operatingIncome: round2(grossProfit - totalOpex) };
}

export const entityLocal = (e: EntityStatement) => build(e.lines, 1);
export const entityUSD = (e: EntityStatement) => build(e.lines, e.fxRate);

function sum(list: IncomeStatement[]): IncomeStatement {
  const keys = Object.keys(list[0] ?? build({ revenue: 0, cogs: 0, salesMarketing: 0, rnd: 0, ga: 0, icIncome: 0, icExpense: 0 })) as (keyof IncomeStatement)[];
  const out = {} as IncomeStatement;
  keys.forEach((k) => (out[k] = round2(list.reduce((s, x) => s + x[k], 0))));
  return out;
}

export interface Consolidated {
  combined: IncomeStatement; // simple sum in USD
  eliminationIncome: number;
  eliminationExpense: number;
  consolidated: IncomeStatement; // after eliminations
  eliminationsBalance: boolean;
  includedIds: string[];
}

/**
 * Sum included entities in USD, then eliminate intercompany management fees.
 * Eliminations are only complete when both sides of every pair are included.
 */
export function consolidate(fx: ConsolidationFixture, includedIds: string[]): Consolidated {
  const included = fx.entities.filter((e) => includedIds.includes(e.id));
  const combined = sum(included.map(entityUSD));
  const eliminationIncome = combined.icIncome;
  const eliminationExpense = combined.icExpense;
  const elim = Math.min(eliminationIncome, eliminationExpense);
  const consolidated: IncomeStatement = {
    ...combined,
    icIncome: round2(combined.icIncome - elim),
    icExpense: round2(combined.icExpense - elim),
  };
  consolidated.grossProfit = round2(consolidated.revenue + consolidated.icIncome - consolidated.cogs);
  consolidated.totalOpex = round2(consolidated.salesMarketing + consolidated.rnd + consolidated.ga + consolidated.icExpense);
  consolidated.operatingIncome = round2(consolidated.grossProfit - consolidated.totalOpex);
  return {
    combined,
    eliminationIncome,
    eliminationExpense,
    consolidated,
    eliminationsBalance: round2(eliminationIncome - eliminationExpense) === 0,
    includedIds: included.map((e) => e.id),
  };
}
