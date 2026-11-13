import { beforeEach, describe, expect, it } from 'vitest';
import { useDemoStore } from '../store/useDemoStore';
import { SCENARIOS } from '../data/scenarios';
import { computeReconciliation } from '../lib/accounting/reconciliation';
import { consolidate } from '../lib/accounting/consolidation';
import { entryTotals } from '../lib/accounting/journal';
import { activationStatus, buildMilestones, buildTasks, nextAction } from '../lib/evaluation/engine';
import { liveSnapshot, fixtureSnapshots } from '../lib/qualification/snapshots';
import { qualify } from '../lib/qualification/model';
import { buildLifecycleContext } from '../lib/lifecycle/context';
import { evaluateJourney } from '../lib/lifecycle/engine';
import { referralEligibility } from '../lib/referral/eligibility';
import { toCrmPayload } from '../lib/analytics/catalog';

const S = () => useDemoStore.getState();
const active = () => S().scenarios[S().activeScenario];

/** Drive the QuickBooks journey the way a prospect would in the UI. */
function qbToReconReady() {
  S().switchScenario('quickbooks');
  S().startEvaluation();
  S().confirmProfile();
  S().selectPath('own_data');
  S().requestMigration();
  S().completeMigration();
  S().openReconciliation();
}

beforeEach(() => {
  localStorage.clear();
  S().resetDemo();
  S().switchScenario('quickbooks');
});

describe('accounting fixtures are internally consistent', () => {
  it('QuickBooks reconciliation: GL $125,950, bank $125,450, $500 difference', () => {
    const r = computeReconciliation(SCENARIOS.quickbooks.reconciliation, []);
    expect(r.ledgerBalance).toBe(125950);
    expect(r.bankBalance).toBe(125450);
    expect(r.difference).toBe(500);
  });
  it('every proposed entry balances and every difference equals its bank-only line', () => {
    for (const id of ['quickbooks', 'netsuite', 'startup'] as const) {
      const fx = SCENARIOS[id];
      expect(entryTotals(fx.reconciliation.proposedEntry).balanced).toBe(true);
      expect(entryTotals(fx.approval.entry).balanced).toBe(true);
      const r = computeReconciliation(fx.reconciliation, []);
      expect(r.difference).toBe(-fx.reconciliation.bankOnly.reduce((s, t) => s + t.amount, 0));
    }
  });
  it('intercompany eliminations net to zero when all entities are included', () => {
    for (const id of ['quickbooks', 'netsuite'] as const) {
      const fx = SCENARIOS[id].consolidation;
      const c = consolidate(fx, fx.entities.map((e) => e.id));
      expect(c.eliminationsBalance).toBe(true);
      expect(c.consolidated.icIncome).toBe(0);
      expect(c.consolidated.icExpense).toBe(0);
    }
  });
});

describe('TEST 1 — QuickBooks persona completes reconciliation and activates', () => {
  it('approval posts the entry, ledger ties to bank, task completes, activation verified, Sales updates', () => {
    qbToReconReady();
    expect(activationStatus(active())).toBe('in_progress');
    const beforeTask = buildTasks(active()).find((t) => t.id === 'task-reconcile')!;
    expect(beforeTask.column).toBe('waiting_on_me');

    expect(S().approveEntry()).toBe(true);
    const s = active();
    const posted = s.ledgerEntries.find((e) => e.id === 'JE-2026-1031')!;
    expect(posted.status).toBe('posted');
    expect(computeReconciliation(SCENARIOS.quickbooks.reconciliation, s.ledgerEntries).ledgerBalance).toBe(125450);
    expect(s.reconciliation.status).toBe('reconciled');
    expect(activationStatus(s)).toBe('verified');
    expect(buildTasks(s).find((t) => t.id === 'task-reconcile')!.column).toBe('done');
    const names = S().events.map((e) => e.eventName);
    expect(names).toContain('journal_entry_approved');
    expect(names).toContain('reconciliation_verified');
    expect(names).toContain('evaluation_first_value_achieved');
    expect(nextAction(s).id).not.toBe('reconcile');
    // approving twice must not double-post
    expect(S().approveEntry()).toBe(false);
    expect(active().ledgerEntries.filter((e) => e.id === 'JE-2026-1031')).toHaveLength(1);
  });
});

describe('TEST 2 — NetSuite persona sees controls and multi-entity steps', () => {
  it('milestones include consolidation, approval control and migration validation', () => {
    S().switchScenario('netsuite');
    S().confirmProfile();
    S().selectPath('own_data');
    const ids = buildMilestones(active()).map((m) => m.id);
    expect(ids).toEqual(['goals', 'data', 'validate', 'consolidate', 'approval', 'reconcile', 'stakeholder']);
    expect(SCENARIOS.netsuite.approval.kind).toBe('controls');
    expect(SCENARIOS.netsuite.consolidation.entities).toHaveLength(8);
    expect(SCENARIOS.netsuite.migration.exceptions.some((e) => e.title.toLowerCase().includes('approval rules'))).toBe(true);
  });
  it('startup persona has no consolidation or validation step on the sample path', () => {
    S().switchScenario('startup');
    S().confirmProfile();
    S().selectPath('sample');
    const ids = buildMilestones(active()).map((m) => m.id);
    expect(ids).not.toContain('consolidate');
    expect(ids).not.toContain('validate');
  });
});

describe('TEST 3 — rejecting a proposed adjustment does not change the ledger', () => {
  it('ledger stays at $125,950 and the entry is not posted', () => {
    qbToReconReady();
    S().rejectEntry('Fee should be charged back by the bank');
    const s = active();
    expect(s.ledgerEntries).toHaveLength(0);
    expect(computeReconciliation(SCENARIOS.quickbooks.reconciliation, s.ledgerEntries).ledgerBalance).toBe(125950);
    expect(s.reconciliation.status).toBe('adjustment_rejected');
    expect(activationStatus(s)).toBe('in_progress');
    expect(buildTasks(s).find((t) => t.id === 'task-reconcile')!.column).toBe('in_progress');
    expect(S().events.map((e) => e.eventName)).toContain('journal_entry_rejected');
    expect(S().events.map((e) => e.eventName)).not.toContain('reconciliation_verified');
    // a rejected decision cannot also be approved without reopening
    S().rejectEntry('again');
    expect(active().auditTrail.filter((a) => a.action.startsWith('Rejected'))).toHaveLength(1);
  });
});

describe('TEST 4 — activated prospect with near-term timeline gets an explainable high-priority signal', () => {
  it('QuickBooks prospect: high fit + 1–3 months + verified activation → High priority with reasons', () => {
    qbToReconReady();
    S().approveEntry();
    const q = qualify(liveSnapshot('quickbooks', active(), S().events, Date.now()), Date.now());
    expect(q.fit).toBe('high');
    expect(q.intent).toBe('high');
    expect(q.activation).toBe('verified');
    expect(q.priority).toBe('high');
    expect(q.rule).toMatch(/^R3/);
    expect(q.why.toLowerCase()).toContain('reconciliation completed');
    expect(q.signals.map((s) => s.signalType)).toContain('verified_activation');
    expect(S().events.some((e) => e.eventName === 'sales_signal_generated')).toBe(true);
  });
  it('explicit Sales request routes immediately regardless of activation', () => {
    S().switchScenario('startup');
    S().requestSalesMeeting({ topic: 'Implementation path', keyQuestion: 'What does setup need?', preferredWindow: 'Next week' });
    const q = qualify(liveSnapshot('startup', active(), S().events, Date.now()), Date.now());
    expect(q.priority).toBe('route_now');
  });
  it('high fit + blocker → specialist intervention; low intent sample → nurture', () => {
    S().switchScenario('netsuite');
    S().simulateBlocker();
    expect(qualify(liveSnapshot('netsuite', active(), S().events, Date.now()), Date.now()).priority).toBe('specialist');
    S().switchScenario('startup');
    S().confirmProfile();
    S().selectPath('sample');
    expect(qualify(liveSnapshot('startup', active(), S().events, Date.now()), Date.now()).priority).toBe('nurture');
  });
  it('seeded accounts cover all five required states', () => {
    const p = fixtureSnapshots(Date.now()).map((a) => qualify(a, Date.now()).priority);
    expect(p).toEqual(['route_now', 'high', 'specialist', 'nurture']);
  });
});

describe('TEST 5 — inactive prospect with a scheduled meeting gets no duplicate nudge', () => {
  it('stalled journey queues without a meeting, and is suppressed once a meeting is scheduled', () => {
    S().switchScenario('netsuite');
    S().confirmProfile();
    S().selectPath('own_data');
    S().simulateInactivity(72);
    const queued = S().runJourney('netsuite', 'qualified_stalled');
    expect(queued.deliveryStatus).toBe('queued_simulated');
    expect(queued.communicationClass).toBe('marketing');

    S().resetScenario('netsuite');
    S().switchScenario('netsuite');
    S().confirmProfile();
    S().selectPath('own_data');
    S().markMeetingScheduled('netsuite');
    S().simulateInactivity(72);
    const msg = S().runJourney('netsuite', 'qualified_stalled');
    expect(msg.deliveryStatus).not.toBe('queued_simulated');
    expect(S().events.map((e) => e.eventName)).toContain('lifecycle_message_suppressed');
  });
  it('frequency cap and marketing opt-out suppress; opt-out does not block product-service messages', () => {
    S().switchScenario('netsuite');
    S().confirmProfile();
    S().selectPath('own_data');
    S().simulateInactivity(72);
    expect(S().runJourney('netsuite', 'qualified_stalled').deliveryStatus).toBe('queued_simulated');
    const second = S().runJourney('netsuite', 'qualified_stalled');
    expect(second.deliveryStatus).toBe('suppressed');
    expect(second.suppressionReasons.join(' ')).toMatch(/Frequency cap/);

    S().setLifecycleFlags('netsuite', { marketingOptIn: false });
    S().requestMigration();
    S().completeMigration();
    const ctx = buildLifecycleContext('netsuite', active(), S().events);
    expect(evaluateJourney('data_ready_unreviewed', ctx, Date.now()).deliveryStatus).toBe('queued_simulated');
  });
  it('completed action suppresses its journey', () => {
    qbToReconReady();
    S().startValidation();
    const ctx = buildLifecycleContext('quickbooks', active(), S().events);
    expect(evaluateJourney('data_ready_unreviewed', ctx, Date.now()).deliveryStatus).toBe('not_triggered');
  });
});

describe('TEST 6 — non-customers never see the referral prompt', () => {
  it('prospects are ineligible; post-purchase customer is eligible', () => {
    for (const id of ['quickbooks', 'netsuite', 'startup'] as const) {
      expect(referralEligibility(S().scenarios[id].customer).eligible).toBe(false);
    }
    // even a fully activated prospect is ineligible
    qbToReconReady();
    S().approveEntry();
    expect(referralEligibility(active().customer).eligible).toBe(false);
    S().copyReferralLink();
    expect(S().events.map((e) => e.eventName)).not.toContain('referral_link_copied');

    S().switchScenario('customer');
    expect(referralEligibility(active().customer).eligible).toBe(true);
    S().copyReferralLink();
    expect(S().events.map((e) => e.eventName)).toContain('referral_link_copied');
  });
});

describe('TEST 7 — switching personas yields a coherent, separate journey', () => {
  it('progress in one persona does not leak into another, and reset restores seeds', () => {
    qbToReconReady();
    S().approveEntry();
    S().switchScenario('netsuite');
    const ns = active();
    expect(ns.reconciliation.status).toBe('not_started');
    expect(ns.ledgerEntries).toHaveLength(0);
    expect(activationStatus(ns)).toBe('not_started');
    expect(nextAction(ns).id).toBe('profile');
    expect(ns.profile.currentERP).toBe('NetSuite');
    // QuickBooks progress preserved
    expect(activationStatus(S().scenarios.quickbooks)).toBe('verified');
    S().resetDemo();
    expect(activationStatus(S().scenarios.quickbooks)).toBe('not_started');
    expect(S().events).toHaveLength(0);
  });
  it('changing path resets dataset-bound progress (no verified activation on a different dataset)', () => {
    qbToReconReady();
    S().approveEntry();
    S().selectPath('sample');
    expect(active().ledgerEntries).toHaveLength(0);
    expect(activationStatus(active())).toBe('not_started');
  });
  it('no task appears in two columns', () => {
    qbToReconReady();
    const ids = buildTasks(active()).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('privacy — CRM payloads exclude financial detail', () => {
  it('no amounts, entry IDs or account numbers leave for the CRM', () => {
    qbToReconReady();
    S().approveEntry();
    const payloads = S().events.filter((e) => e.crmForwarded).map(toCrmPayload);
    const text = JSON.stringify(payloads);
    expect(text).not.toMatch(/JE-2026|125,?950|125,?450|"amount"|1010/);
  });
});
