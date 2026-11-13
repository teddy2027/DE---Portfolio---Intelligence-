import type { EventCategory, EventName, ProductEvent } from '../../types';

interface EventDef { category: EventCategory; meaningful: boolean; crm: boolean; description: string }

/**
 * Event taxonomy. `meaningful` events reset the inactivity clock used by lifecycle journeys.
 * `crm` events are forwarded (simulated) to the CRM as account-level signals with allow-listed properties only.
 */
export const EVENT_CATALOG: Record<EventName, EventDef> = {
  evaluation_started: { category: 'entry', meaningful: true, crm: true, description: 'Prospect opened their evaluation' },
  evaluation_goal_selected: { category: 'entry', meaningful: true, crm: true, description: 'Primary evaluation goal confirmed' },
  qualification_updated: { category: 'entry', meaningful: false, crm: true, description: 'Profile answer changed (system, timeline, entities, role)' },
  evaluation_path_selected: { category: 'entry', meaningful: true, crm: true, description: 'Sample vs own-data path chosen' },
  migration_requested: { category: 'migration', meaningful: true, crm: true, description: 'Assisted sandbox migration requested (simulated)' },
  migration_simulation_started: { category: 'migration', meaningful: false, crm: false, description: 'Simulated migration timeline began' },
  migration_simulation_completed: { category: 'migration', meaningful: false, crm: true, description: 'Sandbox data ready for review (simulated)' },
  migration_validation_started: { category: 'migration', meaningful: true, crm: true, description: 'Prospect opened migration validation' },
  migration_exception_viewed: { category: 'migration', meaningful: true, crm: false, description: 'Prospect inspected a migration exception' },
  migration_exception_recommendation_accepted: { category: 'migration', meaningful: true, crm: false, description: 'Prospect accepted a recommended resolution (pending CPA confirmation)' },
  specialist_assistance_requested: { category: 'migration', meaningful: true, crm: true, description: 'Prospect asked for CPA / specialist help' },
  accounting_workflow_started: { category: 'activation', meaningful: true, crm: false, description: 'An accounting workflow was opened' },
  reconciliation_exception_reviewed: { category: 'activation', meaningful: true, crm: false, description: 'Unmatched bank line inspected' },
  reconciliation_source_inspected: { category: 'activation', meaningful: true, crm: false, description: 'Source transaction opened' },
  journal_entry_proposed: { category: 'activation', meaningful: false, crm: false, description: 'Agent prepared an entry for human review' },
  journal_entry_approved: { category: 'activation', meaningful: true, crm: false, description: 'Human approved and posted a prepared entry' },
  journal_entry_rejected: { category: 'activation', meaningful: true, crm: false, description: 'Human rejected a prepared entry; nothing posted' },
  reconciliation_verified: { category: 'activation', meaningful: true, crm: true, description: 'Ledger balance ties to bank after approved adjustment' },
  report_viewed: { category: 'activation', meaningful: true, crm: false, description: 'Report or entity view opened' },
  consolidation_reviewed: { category: 'activation', meaningful: true, crm: true, description: 'Consolidated view, eliminations and entities reviewed' },
  approval_workflow_decided: { category: 'activation', meaningful: true, crm: true, description: 'Approver decided on a controlled entry' },
  evaluation_first_value_achieved: { category: 'activation', meaningful: true, crm: true, description: 'Verified activation on own data' },
  sample_evaluation_completed: { category: 'activation', meaningful: true, crm: true, description: 'Workflow completed on sample data (not verified activation)' },
  stakeholder_invited: { category: 'engagement', meaningful: true, crm: true, description: 'Colleague invited to the evaluation (simulated)' },
  contextual_help_viewed: { category: 'engagement', meaningful: false, crm: false, description: 'Contextual help item opened' },
  contextual_help_accepted: { category: 'engagement', meaningful: true, crm: false, description: 'Help action taken' },
  lifecycle_message_queued: { category: 'engagement', meaningful: false, crm: false, description: 'Journey message queued (simulated; never sent)' },
  lifecycle_message_suppressed: { category: 'engagement', meaningful: false, crm: false, description: 'Journey message suppressed by a rule' },
  lifecycle_message_previewed: { category: 'engagement', meaningful: false, crm: false, description: 'Internal preview of a journey message' },
  evaluation_resumed: { category: 'engagement', meaningful: true, crm: false, description: 'Prospect returned to the evaluation' },
  evaluation_blocker_detected: { category: 'engagement', meaningful: false, crm: true, description: 'A blocker was recorded on the evaluation' },
  inactivity_simulated: { category: 'engagement', meaningful: false, crm: false, description: 'Demo control: simulated clock advanced' },
  sales_intent_declared: { category: 'sales', meaningful: true, crm: true, description: 'Prospect explicitly asked to talk to DualEntry' },
  sales_signal_generated: { category: 'sales', meaningful: false, crm: true, description: 'Prioritization changed for the account' },
  sales_meeting_requested: { category: 'sales', meaningful: true, crm: true, description: 'Consultation requested (simulated, no calendar booking)' },
  sales_meeting_scheduled: { category: 'sales', meaningful: false, crm: true, description: 'Rep marked a meeting as scheduled (simulated)' },
  sales_opportunity_accepted: { category: 'sales', meaningful: false, crm: true, description: 'Sales accepted the opportunity' },
  sales_opportunity_rejected: { category: 'sales', meaningful: false, crm: true, description: 'Sales routed account to nurture' },
  sales_followup_assigned: { category: 'sales', meaningful: false, crm: true, description: 'Follow-up assigned to an owner' },
  referral_prompt_viewed: { category: 'referral', meaningful: false, crm: false, description: 'Eligible customer saw the referral module' },
  referral_link_copied: { category: 'referral', meaningful: false, crm: false, description: 'Referral link copied' },
  referral_invitation_prepared: { category: 'referral', meaningful: false, crm: false, description: 'Referral email drafted (preview only)' },
};

/** Properties allowed to leave product analytics for the CRM. No amounts, accounts, bank details or statement values. */
export const CRM_ALLOWED_KEYS = [
  'goal', 'path', 'sourceSystem', 'entityCount', 'timeline', 'milestone', 'topic', 'proofPoint', 'stakeholderCount',
  'priority', 'rule', 'decision', 'role', 'activation', 'severity', 'workflow', 'field',
] as const;

export function toCrmPayload(e: ProductEvent) {
  const props: Record<string, string | number | boolean | null> = {};
  for (const k of CRM_ALLOWED_KEYS) if (k in e.metadata) props[k] = e.metadata[k];
  return { accountId: e.accountId, event: e.eventName, occurredAt: new Date(e.timestamp).toISOString(), properties: props };
}
