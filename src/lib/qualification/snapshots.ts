import type { AccountSnapshot, ProductEvent, ProspectScenarioId } from '../../types';
import type { ScenarioState } from '../../store/state';
import { SCENARIOS } from '../../data/scenarios';
import { activationStatus, evaluationStateLabel, proofPoints } from '../evaluation/engine';
import { goalLabel } from '../labels';

/** Build the Sales-facing snapshot of a LIVE demo account from the same state the prospect's UI uses. */
export function liveSnapshot(id: ProspectScenarioId, s: ScenarioState, events: ProductEvent[], now: number): AccountSnapshot {
  const fx = SCENARIOS[id];
  const accountEvents = events.filter((e) => e.accountId === fx.account.id);
  const meaningful = accountEvents.filter((e) => e.meaningful);
  const offsetMs = s.lifecycle.clockOffsetHours * 3_600_000;
  // The simulated clock moves "now" forward; we express it by moving last activity backwards for consistency.
  const last = meaningful.length ? Math.max(...meaningful.map((e) => e.timestamp)) - offsetMs : null;
  return {
    account: {
      ...fx.account,
      currentERP: s.profile.currentERP,
      entityCount: s.profile.entityCount,
      currencies: s.profile.currencies,
      purchaseTimeline: s.profile.timeline,
    },
    primaryUseCase: goalLabel(s.profile.goal),
    evaluationState: evaluationStateLabel(s),
    path: s.path,
    stakeholders: s.stakeholders.length,
    lastMeaningfulActivity: last ?? (s.started ? now - offsetMs : null),
    activation: activationStatus(s),
    blocker: s.blocker,
    salesRequest: s.salesRequest,
    completedProofPoints: proofPoints(s),
    live: true,
    recentEvents: accountEvents.slice(-8).reverse(),
  };
}

const H = 3_600_000;
const ev = (accountId: string, eventName: ProductEvent['eventName'], hoursAgo: number, now: number, metadata: ProductEvent['metadata'] = {}): ProductEvent => ({
  eventId: `fx-${accountId}-${eventName}-${hoursAgo}`, eventName, category: 'activation', accountId, userId: 'fixture', timestamp: now - hoursAgo * H,
  sourceScreen: 'seeded', metadata, demoMode: true, meaningful: true, crmForwarded: true,
});

/** Seeded comparison accounts (not driven by the live prototype). */
export function fixtureSnapshots(now: number): AccountSnapshot[] {
  return [
    {
      account: { id: 'acct_cobalt', name: 'Cobalt Health Partners', industry: 'Healthcare services', currentERP: 'NetSuite', entityCount: 4, currencies: ['USD', 'CAD'], annualRevenueBand: '$80M–$150M (demo)', purchaseTimeline: '1_3_months', acquisitionSource: 'website_guided_evaluation', assignedSalesOwner: 'Priya Raman' },
      primaryUseCase: 'Streamline month-end close', evaluationState: 'Invited, not started', path: null, stakeholders: 1,
      lastMeaningfulActivity: now - 5 * H, activation: 'not_started', blocker: null,
      salesRequest: { status: 'requested', topic: 'Pricing and implementation timeline', requestedAt: now - 5 * H },
      completedProofPoints: [], live: false,
      recentEvents: [ev('acct_cobalt', 'sales_meeting_requested', 5, now, { topic: 'Pricing and implementation timeline' }), ev('acct_cobalt', 'evaluation_goal_selected', 6, now, { goal: 'close' })],
    },
    {
      account: { id: 'acct_halcyon', name: 'Halcyon Logistics', industry: 'Freight & logistics', currentERP: 'Sage Intacct', entityCount: 5, currencies: ['USD', 'MXN'], annualRevenueBand: '$100M–$200M (demo)', purchaseTimeline: '3_6_months', acquisitionSource: 'sales_invitation', assignedSalesOwner: 'Jordan Ellis' },
      primaryUseCase: 'Consolidate multiple entities', evaluationState: 'Activated (own data)', path: 'own_data', stakeholders: 3,
      lastMeaningfulActivity: now - 20 * H, activation: 'verified', blocker: null, salesRequest: { status: 'none' },
      completedProofPoints: ['Migration validation reviewed', 'Reconciliation completed with approved adjustment', 'Consolidated reporting reviewed'], live: false,
      recentEvents: [ev('acct_halcyon', 'stakeholder_invited', 20, now, { role: 'CFO' }), ev('acct_halcyon', 'consolidation_reviewed', 26, now), ev('acct_halcyon', 'reconciliation_verified', 30, now)],
    },
    {
      account: { id: 'acct_larchmont', name: 'Larchmont Retail Group', industry: 'Specialty retail', currentERP: 'Sage Intacct', entityCount: 6, currencies: ['USD', 'CAD'], annualRevenueBand: '$150M–$300M (demo)', purchaseTimeline: '3_6_months', acquisitionSource: 'sales_invitation', assignedSalesOwner: 'Priya Raman' },
      primaryUseCase: 'Streamline month-end close', evaluationState: 'Blocked', path: 'own_data', stakeholders: 2,
      lastMeaningfulActivity: now - 96 * H, activation: 'in_progress',
      blocker: { id: 'blk-lr', title: 'Inventory costing method parity unconfirmed', detail: 'Weighted-average vs FIFO costing produces different COGS in the sandbox.', relatedMilestone: 'validate' },
      salesRequest: { status: 'none' }, completedProofPoints: [], live: false,
      recentEvents: [ev('acct_larchmont', 'migration_exception_viewed', 96, now, { severity: 'high' }), ev('acct_larchmont', 'migration_validation_started', 98, now)],
    },
    {
      account: { id: 'acct_bramble', name: 'Bramble & Co.', industry: 'Consumer brand', currentERP: 'Xero', entityCount: 2, currencies: ['USD'], annualRevenueBand: '$5M–$10M (demo)', purchaseTimeline: 'undisclosed', acquisitionSource: 'website_guided_evaluation', assignedSalesOwner: 'Marcus Webb' },
      primaryUseCase: 'Improve financial reporting', evaluationState: 'Exploring sample data', path: 'sample', stakeholders: 1,
      lastMeaningfulActivity: now - 50 * H, activation: 'in_progress', blocker: null, salesRequest: { status: 'none' }, completedProofPoints: [], live: false,
      recentEvents: [ev('acct_bramble', 'report_viewed', 50, now)],
    },
  ];
}
