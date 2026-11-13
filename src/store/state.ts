import type {
  ApprovalState, AssistanceRequest, AuditEntry, Blocker, ConsolidationState, CustomerStatus, Disposition, EvaluationPath,
  EvaluationProfile, ExceptionDecision, JourneyId, JournalEntry, LifecycleMessage, MigrationState, ReconciliationState,
  ReferralInvite, SalesRequest, ScenarioId, Stakeholder,
} from '../types';
import { SCENARIOS } from '../data/scenarios';

/** All mutable demo state for one scenario (one prospect account). */
export interface ScenarioState {
  scenarioId: ScenarioId;
  started: boolean;
  startedAt?: number;
  profile: EvaluationProfile;
  profileConfirmed: boolean;
  path: EvaluationPath | null;
  migration: MigrationState;
  validationStarted: boolean;
  viewedExceptions: string[];
  exceptionDecisions: Record<string, ExceptionDecision>;
  reconciliation: ReconciliationState;
  ledgerEntries: JournalEntry[]; // entries POSTED during the evaluation
  consolidation: ConsolidationState;
  approval: ApprovalState;
  auditTrail: AuditEntry[];
  stakeholders: Stakeholder[];
  assistance: AssistanceRequest[];
  salesRequest: SalesRequest;
  blocker: Blocker | null;
  lifecycle: {
    clockOffsetHours: number;
    marketingOptIn: boolean;
    repFollowUpActiveOn: JourneyId | null;
    messages: LifecycleMessage[];
  };
  disposition: Disposition;
  customer: CustomerStatus;
  referrals: ReferralInvite[];
  firstValueAt?: number;
  lastPriority?: string;
}

/** Simulated migration timeline (compresses an assisted ~24h migration into seconds for the demo). */
export const MIGRATION_STAGES = [
  { stage: 'requested', label: 'Request received', at: 0 },
  { stage: 'ingesting', label: 'Data ingestion', at: 2500 },
  { stage: 'mapping', label: 'Entity & account mapping', at: 5500 },
  { stage: 'validating', label: 'Initial validation', at: 8500 },
  { stage: 'ready', label: 'Ready for review', at: 11000 },
] as const;

export function seedScenario(id: ScenarioId): ScenarioState {
  const fx = SCENARIOS[id];
  const base: ScenarioState = {
    scenarioId: id,
    started: false,
    profile: { ...fx.defaultProfile, currencies: [...fx.defaultProfile.currencies] },
    profileConfirmed: false,
    path: null,
    migration: { stage: 'not_requested' },
    validationStarted: false,
    viewedExceptions: [],
    exceptionDecisions: Object.fromEntries(fx.migration.exceptions.map((e) => [e.id, 'open' as ExceptionDecision])),
    reconciliation: { status: 'not_started', exceptionReviewed: false, sourceInspected: false, entryReviewed: false, decision: 'none' },
    ledgerEntries: [],
    consolidation: { entitiesViewed: [], consolidatedViewed: false, eliminationsInspected: false, completed: false },
    approval: { status: 'pending', docsInspected: false },
    auditTrail: [],
    stakeholders: fx.initialStakeholders.map((s) => ({ ...s })),
    assistance: [],
    salesRequest: { status: 'none' },
    blocker: null,
    lifecycle: { clockOffsetHours: 0, marketingOptIn: true, repFollowUpActiveOn: null, messages: [] },
    disposition: { status: 'open' },
    customer: { status: 'prospect', onboardingComplete: false, successMilestone: null },
    referrals: [],
  };

  if (id === 'customer') {
    const done = Date.now() - 1000 * 60 * 60 * 24 * 6;
    return {
      ...base,
      started: true,
      startedAt: done,
      profileConfirmed: true,
      path: 'own_data',
      migration: { stage: 'ready', requestedAt: done, completedAt: done, lastSyncAt: done },
      validationStarted: true,
      reconciliation: { status: 'reconciled', exceptionReviewed: true, sourceInspected: true, entryReviewed: true, decision: 'approved', decidedAt: done },
      ledgerEntries: [{ ...fx.reconciliation.proposedEntry, status: 'posted', approvedBy: 'Sarah Mitchell', postedAt: done }],
      consolidation: { entitiesViewed: ['ns-us', 'ns-uk'], consolidatedViewed: true, eliminationsInspected: true, completed: true },
      customer: { status: 'customer', onboardingComplete: true, successMilestone: 'October 2026 month-end close completed in DualEntry' },
      stakeholders: [
        ...base.stakeholders,
        { id: 'sh_cfo', name: 'Daniel Okoro', email: 'daniel@northstarlabs.example', role: 'CFO', status: 'active' },
        { id: 'sh_ctrl', name: 'Mei Tanaka', email: 'mei@northstarlabs.example', role: 'Controller', status: 'active' },
      ],
      referrals: [
        { id: 'ref_1', name: 'Rafael Ortiz', email: 'rafael@quillandco.example', company: 'Quill & Co.', status: 'evaluating', createdAt: done },
      ],
    };
  }
  return base;
}
