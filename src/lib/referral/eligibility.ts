import type { CustomerStatus } from '../../types';

/**
 * Referral prompts appear only for successful customers: paying, onboarded, and past a meaningful success milestone.
 * Never during evaluation. Reward terms follow DualEntry's public referral program and are subject to its eligibility rules.
 */
export function referralEligibility(c: CustomerStatus): { eligible: boolean; checks: { rule: string; pass: boolean }[] } {
  const checks = [
    { rule: 'Paying customer', pass: c.status === 'customer' },
    { rule: 'Onboarding complete', pass: c.onboardingComplete },
    { rule: 'Success milestone reached (e.g., first month-end close)', pass: !!c.successMilestone },
  ];
  return { eligible: checks.every((x) => x.pass), checks };
}

export const REFERRAL_PROGRAM_URL = 'https://www.dualentry.com/referral';

export function referralLink(accountId: string) {
  // Deterministic, clearly simulated link. Not a working referral code.
  let h = 0;
  for (const ch of accountId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `https://www.dualentry.com/referral?ref=DEMO-${h.toString(36).toUpperCase().slice(0, 6)}`;
}
