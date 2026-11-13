import type { JournalEntry } from '../../types';
import { round2 } from '../format';

export function entryTotals(entry: JournalEntry) {
  const debit = round2(entry.lines.reduce((s, l) => s + l.debit, 0));
  const credit = round2(entry.lines.reduce((s, l) => s + l.credit, 0));
  return { debit, credit, balanced: debit === credit && debit > 0 };
}

/** Net effect of posted entries on one ledger account (debit positive for an asset). */
export function netEffectOnAccount(entries: JournalEntry[], account: string) {
  return round2(
    entries
      .filter((e) => e.status === 'posted')
      .flatMap((e) => e.lines)
      .filter((l) => l.account === account)
      .reduce((s, l) => s + l.debit - l.credit, 0),
  );
}
