import type { JournalEntry, ReconciliationFixture } from '../../types';
import { round2 } from '../format';
import { netEffectOnAccount } from './journal';

export interface ReconciliationFigures {
  openingBalance: number;
  matchedTotal: number;
  /** General ledger balance including any POSTED adjustments for this cash account. */
  ledgerBalance: number;
  /** Ledger balance before any adjustment posted in the evaluation. */
  ledgerBalanceBefore: number;
  bankBalance: number;
  difference: number; // ledger − bank
  matchedCount: number;
  unmatchedCount: number;
  reconciled: boolean;
}

export function computeReconciliation(fx: ReconciliationFixture, postedEntries: JournalEntry[]): ReconciliationFigures {
  const matchedTotal = round2(fx.matched.reduce((s, t) => s + t.amount, 0));
  const bankOnlyTotal = round2(fx.bankOnly.reduce((s, t) => s + t.amount, 0));
  const ledgerBalanceBefore = round2(fx.openingBalance + matchedTotal);
  const adjustments = netEffectOnAccount(postedEntries, fx.ledgerAccount);
  const ledgerBalance = round2(ledgerBalanceBefore + adjustments);
  const bankBalance = round2(fx.openingBalance + matchedTotal + bankOnlyTotal);
  const difference = round2(ledgerBalance - bankBalance);
  const unmatchedCount = difference === 0 ? 0 : fx.bankOnly.length;
  return {
    openingBalance: fx.openingBalance,
    matchedTotal,
    ledgerBalance,
    ledgerBalanceBefore,
    bankBalance,
    difference,
    matchedCount: fx.matched.length + (difference === 0 ? fx.bankOnly.length : 0),
    unmatchedCount,
    reconciled: difference === 0,
  };
}
