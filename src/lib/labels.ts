import type { GoalId, Timeline, BuyingRole, SourceSystem, ActivationStatus, Priority, FitTier, IntentTier } from '../types';

export const SOURCE_SYSTEMS: SourceSystem[] = ['QuickBooks Online', 'Xero', 'NetSuite', 'Sage Intacct', 'Spreadsheets / other', 'Other'];

export const GOALS: { id: GoalId; label: string; short: string }[] = [
  { id: 'close', label: 'Streamline month-end close', short: 'Month-end close' },
  { id: 'reconcile', label: 'Reconcile accounts faster', short: 'Reconciliation' },
  { id: 'consolidate', label: 'Consolidate multiple entities', short: 'Multi-entity consolidation' },
  { id: 'ap', label: 'Automate accounts payable', short: 'Accounts payable' },
  { id: 'reporting', label: 'Improve financial reporting', short: 'Financial reporting' },
  { id: 'scale', label: 'Prepare finance operations to scale', short: 'Scalable finance operations' },
];
export const goalLabel = (g: GoalId) => GOALS.find((x) => x.id === g)!.label;
export const goalShort = (g: GoalId) => GOALS.find((x) => x.id === g)!.short;

export const GOAL_HEADLINE: Record<GoalId, string> = {
  close: "Let's validate your month-end close workflow.",
  reconcile: "Let's validate how DualEntry reconciles your accounts.",
  consolidate: "Let's validate your multi-entity consolidation.",
  ap: "Let's validate your payables workflow.",
  reporting: "Let's validate your financial reporting.",
  scale: "Let's map out the finance foundation for your next stage.",
};

export const TIMELINES: { id: Timeline; label: string }[] = [
  { id: 'within_30', label: 'Actively evaluating / within 30 days' },
  { id: '1_3_months', label: '1–3 months' },
  { id: '3_6_months', label: '3–6 months' },
  { id: 'later', label: 'Exploring for later' },
  { id: 'undisclosed', label: 'Prefer not to say' },
];
export const timelineLabel = (t: Timeline) => TIMELINES.find((x) => x.id === t)!.label;

export const ROLES: { id: BuyingRole; label: string }[] = [
  { id: 'decision_maker', label: 'I make or co-own the decision' },
  { id: 'evaluator', label: 'I lead the evaluation for a decision maker' },
  { id: 'influencer', label: 'I am contributing input' },
  { id: 'undisclosed', label: 'Prefer not to say' },
];

export const ACTIVATION_LABEL: Record<ActivationStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  sample_completed: 'Sample evaluation completed',
  verified: 'Verified activation',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  route_now: 'Route now',
  high: 'High priority',
  specialist: 'Specialist intervention',
  monitor: 'Monitor',
  nurture: 'Nurture',
};
export const PRIORITY_ORDER: Priority[] = ['route_now', 'high', 'specialist', 'monitor', 'nurture'];

export const FIT_LABEL: Record<FitTier, string> = { high: 'High fit', moderate: 'Moderate fit', low: 'Low fit' };
export const INTENT_LABEL: Record<IntentTier, string> = { high: 'High intent', medium: 'Medium intent', low: 'Low intent' };

/** Short source system label for compact UI */
export const shortSource = (s: SourceSystem) => (s === 'QuickBooks Online' ? 'QuickBooks' : s === 'Spreadsheets / other' ? 'Spreadsheets' : s);
