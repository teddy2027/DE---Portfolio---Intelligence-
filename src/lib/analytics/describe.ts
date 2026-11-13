import type { ProductEvent } from '../../types';

const LABELS: Partial<Record<ProductEvent['eventName'], string>> = {
  evaluation_started: 'Started the evaluation',
  evaluation_goal_selected: 'Confirmed evaluation goal',
  qualification_updated: 'Updated evaluation details',
  evaluation_path_selected: 'Chose how to evaluate',
  migration_requested: 'Requested sandbox migration',
  migration_simulation_completed: 'Sandbox data ready for review',
  migration_validation_started: 'Opened migration validation',
  migration_exception_viewed: 'Inspected a migration exception',
  migration_exception_recommendation_accepted: 'Accepted a recommendation (pending CPA confirmation)',
  specialist_assistance_requested: 'Requested accounting assistance',
  accounting_workflow_started: 'Opened an accounting workflow',
  reconciliation_exception_reviewed: 'Reviewed an unmatched bank line',
  reconciliation_source_inspected: 'Inspected the source transaction',
  journal_entry_proposed: 'Agent prepared an entry for review',
  journal_entry_approved: 'Approved and posted a prepared entry',
  journal_entry_rejected: 'Rejected a prepared entry (not posted)',
  reconciliation_verified: 'Reconciliation verified: ledger ties to bank',
  report_viewed: 'Viewed a report',
  consolidation_reviewed: 'Reviewed consolidated reporting',
  approval_workflow_decided: 'Decided on a controlled entry',
  evaluation_first_value_achieved: 'First value achieved on own data',
  sample_evaluation_completed: 'Completed a workflow on sample data',
  stakeholder_invited: 'Invited a colleague',
  sales_intent_declared: 'Asked to discuss next steps',
  sales_meeting_requested: 'Requested a consultation',
  sales_meeting_scheduled: 'Meeting scheduled',
  evaluation_blocker_detected: 'Blocker recorded',
  sales_signal_generated: 'Sales priority updated',
  lifecycle_message_queued: 'Lifecycle message queued (simulated)',
  lifecycle_message_suppressed: 'Lifecycle message suppressed',
};

export const describeEvent = (e: ProductEvent) => LABELS[e.eventName] ?? e.eventName.replace(/_/g, ' ');
export const isTimelineEvent = (e: ProductEvent) => !!LABELS[e.eventName] && !['qualification_updated', 'report_viewed', 'sales_signal_generated', 'lifecycle_message_queued', 'lifecycle_message_suppressed'].includes(e.eventName);
