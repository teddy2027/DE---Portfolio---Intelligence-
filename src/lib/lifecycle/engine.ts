import type { Channel, CommunicationClass, JourneyId, LifecycleContext, LifecycleMessage, RuleCheck } from '../../types';
import { shortSource } from '../labels';

export interface JourneyDef {
  id: JourneyId;
  name: string;
  trigger: string; // formal trigger expression
  triggerPlain: string;
  eligibility: string;
  channel: Channel;
  communicationClass: CommunicationClass;
  metric: string;
  suppressions: string[];
}

/**
 * Communication classes:
 *  - product_service: messages about the prospect's own requested sandbox or an in-product blocker. Not promotional.
 *    Still suppressed when redundant, but a marketing opt-out does not block them.
 *  - marketing: lifecycle nudges by email. Require marketing consent and respect a frequency cap.
 */
export const JOURNEYS: JourneyDef[] = [
  {
    id: 'data_ready_unreviewed', name: 'Data ready, not yet validated',
    trigger: 'migration.completed AND validation.started = false',
    triggerPlain: 'The sandbox migration finished but the prospect has not opened validation.',
    eligibility: 'Own-data path; sandbox ready',
    channel: 'email', communicationClass: 'product_service',
    metric: 'Validation start rate within 48h of data ready',
    suppressions: ['Validation already started', 'Relevant meeting scheduled', 'Rep follow-up active on this issue'],
  },
  {
    id: 'recon_exception', name: 'Unresolved reconciliation exception',
    trigger: 'reconciliation.exception_detected AND exception.resolved = false',
    triggerPlain: 'A reconciliation has an unmatched item the prospect has not resolved.',
    eligibility: 'Any evaluation with an open reconciliation exception',
    channel: 'in_product', communicationClass: 'product_service',
    metric: 'Exception resolution rate; CPA-assist acceptance rate',
    suppressions: ['Exception already resolved', 'CPA assistance already requested', 'Rep follow-up active on this issue'],
  },
  {
    id: 'qualified_stalled', name: 'Qualified evaluation stalled',
    trigger: 'hours_since_meaningful_activity ≥ 72 AND NOT meeting.scheduled',
    triggerPlain: 'A qualified prospect has done nothing meaningful for 72 hours and has no meeting booked.',
    eligibility: 'High or moderate fit, or medium/high intent; evaluation path chosen',
    channel: 'email', communicationClass: 'marketing',
    metric: 'Qualified evaluation recovery rate (meaningful activity within 7 days)',
    suppressions: ['Meeting scheduled or requested', 'Marketing opt-out', 'Frequency cap (1 marketing email / 72h)', 'Rep follow-up active on this issue', 'Evaluation already complete'],
  },
  {
    id: 'activation_verified', name: 'First value achieved',
    trigger: 'activation.verified',
    triggerPlain: 'The prospect completed a verified accounting proof point on their own data.',
    eligibility: 'Verified activation (sample completion does not qualify)',
    channel: 'in_product', communicationClass: 'product_service',
    metric: 'Activated evaluation → Sales-accepted opportunity conversion',
    suppressions: ['Sales request already made', 'Meeting scheduled'],
  },
];

export const journeyById = (id: JourneyId) => JOURNEYS.find((j) => j.id === id)!;

function triggerMet(id: JourneyId, c: LifecycleContext): boolean {
  switch (id) {
    case 'data_ready_unreviewed': return c.path === 'own_data' && c.migrationReady && !c.validationStarted;
    case 'recon_exception': return c.reconExceptionOpen;
    case 'qualified_stalled': return c.path !== null && c.hoursSinceMeaningfulActivity >= 72; // a future meeting is handled as an explicit suppression
    case 'activation_verified': return c.activation === 'verified';
  }
}

function eligibilityChecks(id: JourneyId, c: LifecycleContext): RuleCheck[] {
  switch (id) {
    case 'data_ready_unreviewed': return [{ rule: 'Own-data sandbox path', pass: c.path === 'own_data' }, { rule: 'Sandbox data ready', pass: c.migrationReady }];
    case 'recon_exception': return [{ rule: 'Reconciliation opened with unmatched item', pass: c.reconExceptionOpen }];
    case 'qualified_stalled': return [{ rule: 'Qualified (fit or intent threshold met)', pass: c.qualified }, { rule: 'Evaluation path chosen', pass: c.path !== null }];
    case 'activation_verified': return [{ rule: 'Verified activation on own data', pass: c.activation === 'verified' }];
  }
}

function suppressionReasons(id: JourneyId, c: LifecycleContext, cls: CommunicationClass): string[] {
  const r: string[] = [];
  if (c.repFollowUpActiveOn === id) r.push('An assigned representative has an active follow-up on this same issue.');
  if (cls === 'marketing' && !c.marketingOptIn) r.push('Prospect opted out of marketing email.');
  switch (id) {
    case 'data_ready_unreviewed':
      if (c.validationStarted) r.push('Validation already started; the action is complete.');
      if (c.meetingScheduled) r.push('A relevant meeting is already scheduled; the rep will cover data review.');
      break;
    case 'recon_exception':
      if (!c.reconExceptionOpen) r.push('Exception already resolved.');
      if (c.reconAssistanceRequested) r.push('CPA assistance already requested for this exception.');
      break;
    case 'qualified_stalled':
      if (c.meetingScheduled || c.salesRequested) r.push('A meeting is scheduled or requested; a nudge would duplicate the rep’s follow-up.');
      if (c.marketingSentWithinCap) r.push('Frequency cap: another journey email was queued within the last 72 hours.');
      if (!c.nextIncompleteTask) r.push('No incomplete evaluation task to reference.');
      break;
    case 'activation_verified':
      if (c.salesRequested || c.meetingScheduled) r.push('Commercial conversation already in progress.');
      break;
  }
  return r;
}

function content(id: JourneyId, c: LifecycleContext): { subject: string; body: string; cta: string; why: string } {
  const src = shortSource(c.sourceSystem);
  switch (id) {
    case 'data_ready_unreviewed':
      return {
        subject: `${c.companyName} sandbox: ${c.recordsImported.toLocaleString()} ${src} records ready for balance review`,
        body: `Hi ${c.firstName}, your ${src} data is loaded in your DualEntry evaluation sandbox. Before exploring workflows, confirm your opening balances tie to ${src}. ${c.exceptionsOpen} item${c.exceptionsOpen === 1 ? ' is' : 's are'} flagged for review, each with the source detail and a suggested next step. A DualEntry accountant can walk through any of them with you.`,
        cta: 'Review imported balances (about 10 minutes)',
        why: 'Data readiness is the step before any proof point. Prospects who never open validation cannot reach activation.',
      };
    case 'recon_exception':
      return {
        subject: 'One item is holding up your reconciliation',
        body: `${c.differenceLabel} between ledger and bank is still unresolved. The proposed adjustment and its source are ready to review. If the explanation doesn't match what you expect, ask a DualEntry accountant to look at it with you.`,
        cta: 'Review the difference · Ask an accountant',
        why: 'Shown in product at the moment of friction, with human help, instead of an email the prospect would read out of context.',
      };
    case 'qualified_stalled':
      return {
        subject: `Picking up where you left off: ${c.nextIncompleteTask?.toLowerCase() ?? 'your evaluation'}`,
        body: `Hi ${c.firstName}, your evaluation is paused at “${c.nextIncompleteTask ?? 'next step'}”. It usually takes about 15 minutes, and it is the step that shows whether DualEntry handles your ${c.persona === 'netsuite' ? 'controls and entities' : 'workflow'} the way you need. If something is in the way, reply and a DualEntry accountant will help.`,
        cta: `Resume: ${c.nextIncompleteTask ?? 'evaluation'}`,
        why: 'References the specific incomplete task rather than a generic reminder. Sent only to qualified prospects without a meeting booked.',
      };
    case 'activation_verified':
      return c.intent === 'high'
        ? {
            subject: 'Your reconciliation is complete. Here’s what to validate next.',
            body: `You’ve approved an adjustment and validated the updated balance on your own data. Given your timeline, the most useful next step is a working session on ${c.nextWorkflow.toLowerCase()} and your implementation plan.`,
            cta: 'Review next steps with DualEntry',
            why: 'High stated intent: recommend a commercial conversation anchored in what was just proven.',
          }
        : {
            subject: 'Your reconciliation is complete. Here’s what to validate next.',
            body: `You’ve validated your first workflow. Next, ${c.nextWorkflow.toLowerCase()} is the most relevant workflow for your goal.`,
            cta: `Continue: ${c.nextWorkflow}`,
            why: 'Intent is not yet high, so recommend the next product workflow instead of a sales conversation.',
          };
  }
}

export function evaluateJourney(id: JourneyId, c: LifecycleContext, now: number): LifecycleMessage {
  const def = journeyById(id);
  const met = triggerMet(id, c);
  const eligibility = eligibilityChecks(id, c);
  const eligible = eligibility.every((e) => e.pass);
  const suppression = met && eligible ? suppressionReasons(id, c, def.communicationClass) : [];
  const body = content(id, c);
  let deliveryStatus: LifecycleMessage['deliveryStatus'];
  let selectionReason: string;
  if (!met) { deliveryStatus = 'not_triggered'; selectionReason = `Trigger not met: ${def.triggerPlain}`; }
  else if (!eligible) { deliveryStatus = 'not_triggered'; selectionReason = `Not eligible: ${eligibility.filter((e) => !e.pass).map((e) => e.rule).join(', ')}.`; }
  else if (suppression.length) { deliveryStatus = 'suppressed'; selectionReason = suppression[0]; }
  else { deliveryStatus = 'queued_simulated'; selectionReason = body.why; }
  return {
    id: `msg-${id}-${now}`, accountId: c.accountId, journeyId: id, trigger: def.trigger, channel: def.channel,
    communicationClass: def.communicationClass, subject: body.subject, body: body.body, cta: body.cta,
    eligibility, suppressionReasons: suppression, deliveryStatus, selectionReason, createdAt: now,
  };
}
