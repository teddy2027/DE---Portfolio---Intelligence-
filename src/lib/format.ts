import type { CurrencyCode } from '../types';

const SYMBOL: Record<CurrencyCode, string> = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', MXN: 'MX$', AUD: 'A$', SGD: 'S$' };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function money(n: number, currency: CurrencyCode = 'USD', opts: { sign?: boolean; decimals?: number } = {}) {
  const decimals = opts.decimals ?? 2;
  const abs = Math.abs(round2(n)).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sym = SYMBOL[currency];
  if (n < 0) return `−${sym}${abs}`;
  if (opts.sign && n > 0) return `+${sym}${abs}`;
  return `${sym}${abs}`;
}

/** Accounting style: negatives in parentheses */
export function acct(n: number, currency: CurrencyCode = 'USD', decimals = 0) {
  const abs = Math.abs(round2(n)).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sym = SYMBOL[currency];
  return n < 0 ? `(${sym}${abs})` : `${sym}${abs}`;
}

export const num = (n: number) => n.toLocaleString('en-US');

export function timeAgo(from: number, now: number) {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

export const clockTime = (t: number) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const shortDateTime = (t: number) =>
  new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
