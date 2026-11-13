/**
 * Domain model for "Your DualEntry Evaluation" prototype.
 * Everything here is fictional demo data. Nothing connects to a real ERP, bank, CRM or email service.
 */

export type ScenarioId = 'quickbooks' | 'netsuite' | 'startup' | 'customer';
export type ProspectScenarioId = Exclude<ScenarioId, 'customer'>;

export type SourceSystem = 'QuickBooks Online' | 'Xero' | 'NetSuite' | 'Sage Intacct' | 'Spreadsheets / other' | 'Other';

export type GoalId = 'close' | 'reconcile' | 'consolidate' | 'ap' | 'reporting' | 'scale';

export type Timeline = 'within_30' | '1_3_months' | '3_6_months' | 'later' | 'undisclosed';

export type BuyingRole = 'decision_maker' | 'evaluator' | 'influencer' | 'undisclosed';

export type EvaluationPath = 'sample' | 'own_data';

export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'CAD' | 'MXN' | 'AUD' | 'SGD';

// ───────────────────────────── Accounts & people

export interface User {
  id: string;
  name: string;
  firstName: string;
  role: string;
  email: string; // fictional .example domain
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  currentERP: SourceSystem;
  entityCount: number;
  currencies: CurrencyCode[];
  annualRevenueBand: string; // demo only
  purchaseTimeline: Timeline;
  acquisitionSource: 'sales_invitation' | 'website_guided_evaluation' | 'referral';
  assignedSalesOwner: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
  invitedAt?: number;
}

// ───────────────────────────── Evaluation

export interface EvaluationProfile {
  currentERP: SourceSystem;
  goal: GoalId;
  timeline: Timeline;
  entityCount: number;
  currencies: CurrencyCode[];
  buyingRole: BuyingRole;
  mainBlocker: string;
}

export type MilestoneId =
  | 'goals'
  | 'data'
  | 'validate'
  | 'reconcile'
  | 'consolidate'
  | 'approval'
  | 'stakeholder';

export type MilestoneState = 'done' | 'in_progress' | 'waiting_on_me' | 'blocked' | 'todo';

export interface Milestone {
  id: MilestoneId;
  title: string;
  description: string;
  state: MilestoneState;
  route: string;
  verifiedBy: string; // which event proves completion
}

export type MigrationStage = 'not_requested' | 'requested' | 'ingesting' | 'mapping' | 'validating' | 'ready';

export interface MigrationState {
  stage: MigrationStage;
  requestedAt?: number;
  completedAt?: number;
  lastSyncAt?: number;
}

export type ExceptionSeverity = 'high' | 'medium' | 'low';
export type ExceptionDecision = 'open' | 'recommendation_accepted' | 'assistance_requested';

export interface MigrationException {
  id: string;
  severity: ExceptionSeverity;
  title: string;
  explanation: string;
  sourceDetail: { label: string; value: string }[];
  suggestedNextStep: string;
  recommendation: string;
  entity: string;
}

export interface ValidationCheck {
  id: string;
  label: string;
  detail: string;
  status: 'passed' | 'review' | 'pending';
  tooltip?: string;
}

export interface MigrationFixture {
  source: SourceSystem;
  entities: number;
  accountsReviewed: number;
  recordsImported: number;
  recordsMapped: number;
  entitiesBalanced: number; // trial balances tie to source
  historyRange: string;
  checks: ValidationCheck[];
  exceptions: MigrationException[];
}

// ───────────────────────────── Accounting

export interface JournalLine {
  account: string; // "6810 · Bank Fees"
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  entity: string;
  lines: JournalLine[];
  preparedBy: string;
  status: 'prepared' | 'posted' | 'rejected';
  approvedBy?: string;
  postedAt?: number;
}

export interface CashTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // + inflow, - outflow
  reference: string;
}

export interface ReconciliationFixture {
  entity: string;
  ledgerAccount: string;
  bankAccountLabel: string; // masked, no numbers
  period: string;
  openingBalance: number;
  matched: CashTransaction[]; // in both GL & bank
  bankOnly: CashTransaction[]; // exceptions
  proposedEntry: JournalEntry;
  exceptionExplanation: string;
  agentReasoning: string[];
}

export type ReconciliationStatus = 'not_started' | 'in_review' | 'adjustment_rejected' | 'reconciled';

export interface ReconciliationState {
  status: ReconciliationStatus;
  exceptionReviewed: boolean;
  sourceInspected: boolean;
  entryReviewed: boolean;
  decision: 'none' | 'approved' | 'rejected';
  decidedAt?: number;
  rejectionReason?: string;
}

export interface EntityStatement {
  id: string;
  name: string;
  shortName: string;
  country: string;
  currency: CurrencyCode;
  fxRate: number; // avg rate to USD for the period
  lines: { revenue: number; cogs: number; salesMarketing: number; rnd: number; ga: number; icIncome: number; icExpense: number };
}

export interface ConsolidationFixture {
  period: string;
  entities: EntityStatement[];
  eliminationNote: string;
}

export interface ConsolidationState {
  entitiesViewed: string[];
  consolidatedViewed: boolean;
  eliminationsInspected: boolean;
  completed: boolean;
}

export interface ApprovalFixture {
  title: string;
  kind: 'controls' | 'agent_coding';
  entry: JournalEntry;
  amount: number;
  policy: string;
  requiredApproverRole: string;
  preparer: string;
  supportingDocs: { name: string; detail: string }[];
  agentReasoning: string[];
  confidenceNote: string;
}

export interface ApprovalState {
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  decidedAt?: number;
  comment?: string;
  docsInspected: boolean;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
}

// ───────────────────────────── Help, blockers, assistance

export interface Blocker {
  id: string;
  title: string;
  detail: string;
  relatedMilestone: MilestoneId;
}

export interface AssistanceRequest {
  id: string;
  topic: string;
  context: string;
  createdAt: number;
  status: 'submitted';
}

export interface HelpItem {
  id: string;
  title: string;
  body: string;
  action: { label: string; kind: 'assist' | 'route' | 'explain'; route?: string; topic?: string };
  reason: string; // why it is shown
}

// ───────────────────────────── Sales

export interface SalesRequest {
  status: 'none' | 'requested' | 'scheduled';
  topic?: string;
  keyQuestion?: string;
  requestedAt?: number;
  preferredWindow?: string;
}

export type FitTier = 'high' | 'moderate' | 'low';
export type IntentTier = 'high' | 'medium' | 'low';
export type ActivationStatus = 'not_started' | 'in_progress' | 'sample_completed' | 'verified';
export type Priority = 'route_now' | 'high' | 'specialist' | 'monitor' | 'nurture';

export interface SalesSignal {
  id: string;
  accountId: string;
  signalType: 'explicit_request' | 'near_term_timeline' | 'verified_activation' | 'multi_stakeholder' | 'blocker' | 'stalled' | 'sample_exploration';
  evidence: string;
  timestamp: number;
}

export interface Disposition {
  status: 'open' | 'sales_accepted' | 'needs_nurture';
  followUp?: { owner: string; due: string; note: string };
  updatedAt?: number;
}

export interface AccountSnapshot {
  account: Account;
  primaryUseCase: string;
  evaluationState: string;
  path: EvaluationPath | null;
  stakeholders: number;
  lastMeaningfulActivity: number | null;
  activation: ActivationStatus;
  blocker: Blocker | null;
  salesRequest: SalesRequest;
  completedProofPoints: string[];
  live: boolean; // derived from live demo state vs seeded fixture
  recentEvents: ProductEvent[];
}

export interface QualificationResult {
  fit: FitTier;
  fitReasons: string[];
  intent: IntentTier;
  intentReasons: string[];
  activation: ActivationStatus;
  priority: Priority;
  rule: string;
  why: string;
  recommendedAction: string;
  signals: SalesSignal[];
}

// ───────────────────────────── Lifecycle

export type JourneyId = 'data_ready_unreviewed' | 'recon_exception' | 'qualified_stalled' | 'activation_verified';
export type CommunicationClass = 'product_service' | 'marketing';
export type Channel = 'email' | 'in_product';

export interface LifecycleContext {
  accountId: string;
  firstName: string;
  companyName: string;
  persona: ProspectScenarioId;
  path: EvaluationPath | null;
  migrationReady: boolean;
  validationStarted: boolean;
  reconExceptionOpen: boolean;
  reconAssistanceRequested: boolean;
  activation: ActivationStatus;
  hoursSinceMeaningfulActivity: number;
  meetingScheduled: boolean;
  salesRequested: boolean;
  marketingOptIn: boolean;
  repFollowUpActiveOn: JourneyId | null;
  qualified: boolean;
  intent: IntentTier;
  nextIncompleteTask: string | null;
  marketingSentWithinCap: boolean;
  sourceSystem: SourceSystem;
  recordsImported: number;
  exceptionsOpen: number;
  differenceLabel: string;
  nextWorkflow: string;
}

export interface RuleCheck {
  rule: string;
  pass: boolean;
}

export interface LifecycleMessage {
  id: string;
  accountId: string;
  journeyId: JourneyId;
  trigger: string;
  channel: Channel;
  communicationClass: CommunicationClass;
  subject: string;
  body: string;
  cta: string;
  eligibility: RuleCheck[];
  suppressionReasons: string[];
  deliveryStatus: 'queued_simulated' | 'suppressed' | 'not_triggered';
  selectionReason: string;
  createdAt: number;
}

// ───────────────────────────── Events

export type EventName =
  | 'evaluation_started' | 'evaluation_goal_selected' | 'qualification_updated' | 'evaluation_path_selected'
  | 'migration_requested' | 'migration_simulation_started' | 'migration_simulation_completed'
  | 'migration_validation_started' | 'migration_exception_viewed' | 'migration_exception_recommendation_accepted'
  | 'specialist_assistance_requested'
  | 'accounting_workflow_started' | 'reconciliation_exception_reviewed' | 'reconciliation_source_inspected'
  | 'journal_entry_proposed' | 'journal_entry_approved' | 'journal_entry_rejected' | 'reconciliation_verified'
  | 'report_viewed' | 'consolidation_reviewed' | 'approval_workflow_decided' | 'evaluation_first_value_achieved'
  | 'sample_evaluation_completed' | 'stakeholder_invited'
  | 'contextual_help_viewed' | 'contextual_help_accepted'
  | 'lifecycle_message_queued' | 'lifecycle_message_suppressed' | 'lifecycle_message_previewed' | 'evaluation_resumed'
  | 'evaluation_blocker_detected' | 'inactivity_simulated'
  | 'sales_intent_declared' | 'sales_signal_generated' | 'sales_meeting_requested' | 'sales_meeting_scheduled'
  | 'sales_opportunity_accepted' | 'sales_opportunity_rejected' | 'sales_followup_assigned'
  | 'referral_prompt_viewed' | 'referral_link_copied' | 'referral_invitation_prepared';

export type EventCategory = 'entry' | 'migration' | 'activation' | 'engagement' | 'sales' | 'referral';

export interface ProductEvent {
  eventId: string;
  eventName: EventName;
  category: EventCategory;
  accountId: string;
  userId: string;
  timestamp: number;
  sourceScreen: string;
  metadata: Record<string, string | number | boolean | null>;
  demoMode: true;
  meaningful: boolean; // counts toward "last meaningful activity"
  crmForwarded: boolean; // safe, account-level signal forwarded to CRM (simulated)
}

// ───────────────────────────── Referral

export interface CustomerStatus {
  status: 'prospect' | 'customer';
  onboardingComplete: boolean;
  successMilestone: string | null;
}

export interface ReferralInvite {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'prepared' | 'invited' | 'evaluating' | 'customer';
  createdAt: number;
}

// ───────────────────────────── Scenario fixture

export interface ScenarioFixture {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  personaSummary: string;
  user: User;
  account: Account;
  defaultProfile: EvaluationProfile;
  recommendedPath: EvaluationPath;
  messaging: { headline: string; subhead: string };
  sampleCompanyName: string;
  migration: MigrationFixture;
  reconciliation: ReconciliationFixture;
  consolidation: ConsolidationFixture;
  approval: ApprovalFixture;
  blockerTemplate: Blocker;
  initialStakeholders: Stakeholder[];
}
