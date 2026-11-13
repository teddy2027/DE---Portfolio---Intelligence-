import type { AccountSnapshot, FitTier, IntentTier, Priority, QualificationResult, SalesSignal } from '../../types';
import { shortSource } from '../labels';

/**
 * Transparent, deterministic prioritization. Three dimensions are scored separately and never collapsed into one number:
 *   FIT        — how closely the organization matches a commercially attractive segment
 *   INTENT     — an active project, stated timeline, explicit Sales request
 *   ACTIVATION — a verified accounting proof point inside the evaluation
 * Priority is chosen by the FIRST matching rule below (ordered), and the rule is shown to Sales.
 *
 * Segment thresholds are ASSUMPTIONS for the prototype. Real thresholds need DualEntry win/loss data.
 */

export function scoreFit(a: AccountSnapshot): { tier: FitTier; reasons: string[] } {
  const reasons: string[] = [];
  const acc = a.account;
  let points = 0;
  if (acc.entityCount >= 3) { points += 2; reasons.push(`${acc.entityCount} legal entities`); }
  else if (acc.entityCount === 2) { points += 1; reasons.push('2 legal entities'); }
  if (acc.currencies.length > 1) { points += 1; reasons.push(`${acc.currencies.length} currencies`); }
  if (acc.currentERP === 'NetSuite' || acc.currentERP === 'Sage Intacct') { points += 2; reasons.push(`Replacing ${acc.currentERP} (mid-market ERP)`); }
  else if ((acc.currentERP === 'QuickBooks Online' || acc.currentERP === 'Xero') && acc.entityCount >= 2) { points += 1; reasons.push(`Outgrowing ${shortSource(acc.currentERP)} with multiple entities`); }
  if (acc.entityCount <= 1 && acc.currencies.length <= 1) reasons.push('Single entity, single currency');
  const tier: FitTier = points >= 3 ? 'high' : points >= 1 ? 'moderate' : 'low';
  return { tier, reasons };
}

export function scoreIntent(a: AccountSnapshot): { tier: IntentTier; reasons: string[] } {
  const reasons: string[] = [];
  const t = a.account.purchaseTimeline;
  if (a.salesRequest.status !== 'none') reasons.push(a.salesRequest.status === 'scheduled' ? 'Meeting scheduled with DualEntry' : 'Explicitly requested a consultation');
  if (t === 'within_30') reasons.push('Buying within 30 days (stated)');
  if (t === '1_3_months') reasons.push('Buying within 1–3 months (stated)');
  if (t === '3_6_months') reasons.push('Buying within 3–6 months (stated)');
  if (t === 'later') reasons.push('Exploring for later (stated)');
  if (t === 'undisclosed') reasons.push('Timeline not disclosed');
  if (a.path === 'own_data') reasons.push('Requested own-data sandbox');
  if (a.stakeholders >= 2) reasons.push(`${a.stakeholders} stakeholders involved`);

  let tier: IntentTier = 'low';
  if (a.salesRequest.status !== 'none' || t === 'within_30' || t === '1_3_months') tier = 'high';
  else if (t === '3_6_months' || a.path === 'own_data' || a.stakeholders >= 2) tier = 'medium';
  return { tier, reasons };
}

export const nearTerm = (a: AccountSnapshot) => a.account.purchaseTimeline === 'within_30' || a.account.purchaseTimeline === '1_3_months';

export function qualify(a: AccountSnapshot, now: number): QualificationResult {
  const fit = scoreFit(a);
  const intent = scoreIntent(a);
  const activation = a.activation;
  const signals: SalesSignal[] = [];
  const sig = (signalType: SalesSignal['signalType'], evidence: string) =>
    signals.push({ id: `${a.account.id}-${signalType}`, accountId: a.account.id, signalType, evidence, timestamp: now });

  if (a.salesRequest.status !== 'none') sig('explicit_request', `Requested ${a.salesRequest.topic ?? 'a consultation'}`);
  if (nearTerm(a)) sig('near_term_timeline', 'Purchase timeline within 90 days');
  if (activation === 'verified') sig('verified_activation', a.completedProofPoints.join('; ') || 'Verified accounting proof point');
  if (a.stakeholders >= 2) sig('multi_stakeholder', `${a.stakeholders} stakeholders`);
  if (a.blocker) sig('blocker', a.blocker.title);
  if (activation === 'sample_completed' || (a.path === 'sample' && activation !== 'verified')) sig('sample_exploration', 'Exploring sample data');

  const hoursIdle = a.lastMeaningfulActivity ? (now - a.lastMeaningfulActivity) / 3_600_000 : Infinity;
  if (hoursIdle >= 72 && a.salesRequest.status === 'none' && a.path) sig('stalled', `No meaningful activity for ${Math.floor(hoursIdle)}h`);

  let priority: Priority;
  let rule: string;
  let why: string;
  let action: string;
  const proof = a.completedProofPoints.length ? a.completedProofPoints.join('; ').toLowerCase() : 'no proof point yet';
  const topicFor = a.account.entityCount > 1 ? 'multi-entity consolidation' : 'implementation scope';

  if (a.salesRequest.status !== 'none') {
    priority = 'route_now';
    rule = 'R1 · Explicit Sales request → immediate routing, regardless of sandbox engagement';
    why = `Asked for ${a.salesRequest.topic?.toLowerCase() ?? 'a consultation'}; ${intent.reasons.filter((r) => r.includes('stated'))[0]?.toLowerCase() ?? 'timeline not stated'}; ${proof}.`;
    action = a.salesRequest.status === 'scheduled' ? 'Prepare for the scheduled meeting using the evaluation summary.' : `Respond within one business day and confirm a time for: ${a.salesRequest.topic ?? 'consultation'}.`;
  } else if (fit.tier === 'high' && a.blocker) {
    priority = 'specialist';
    rule = 'R2 · High fit + meaningful accounting blocker → specialist intervention, not a generic Sales pitch';
    why = `High-fit ${shortSource(a.account.currentERP)} evaluation blocked: ${a.blocker.title.toLowerCase()}.`;
    action = `Assign a solutions CPA to resolve “${a.blocker.title}” before any commercial follow-up.`;
  } else if (fit.tier === 'high' && nearTerm(a)) {
    priority = 'high';
    rule = 'R3 · High fit + purchase within 90 days → high priority';
    why = `${fit.reasons.slice(0, 2).join(', ')}; buying within 90 days; ${proof}.`;
    action = activation === 'verified'
      ? `Offer a technical review focused on ${topicFor}; reference the completed proof points.`
      : 'Help them reach a first proof point: offer a guided reconciliation session with a CPA.';
  } else if (fit.tier === 'high' && activation === 'verified' && a.stakeholders >= 2) {
    priority = 'high';
    rule = 'R4 · High fit + verified activation + multiple stakeholders → high priority';
    why = `${proof}; ${a.stakeholders} stakeholders engaged.`;
    action = `Propose a commercial conversation with the decision maker focused on ${topicFor}.`;
  } else if (fit.tier === 'high') {
    priority = 'monitor';
    rule = 'R5 · High fit, no near-term timeline or activation yet → monitor and assist';
    why = `${fit.reasons.slice(0, 2).join(', ')}; ${intent.reasons[0]?.toLowerCase() ?? 'no timeline'}; ${proof}.`;
    action = 'Let in-product guidance lead. Owner reviews weekly; reach out only on a new signal.';
  } else if (intent.tier === 'low' && (a.path === 'sample' || activation === 'sample_completed')) {
    priority = 'nurture';
    rule = 'R6 · Low intent + sample-data exploration → nurture, not an urgent Sales alert';
    why = `${intent.reasons[0] ?? 'No stated timeline'}; exploring sample data.`;
    action = 'Keep in product-led nurture. Share the implementation guide; no Sales outreach.';
  } else {
    priority = intent.tier === 'low' ? 'nurture' : 'monitor';
    rule = 'R7 · Default → monitor or nurture by intent';
    why = `${fit.reasons[0] ?? 'Limited fit signals'}; ${intent.reasons[0]?.toLowerCase() ?? 'no timeline'}.`;
    action = intent.tier === 'low' ? 'Nurture with relevant content.' : 'Monitor for a proof point or Sales request.';
  }

  return { fit: fit.tier, fitReasons: fit.reasons, intent: intent.tier, intentReasons: intent.reasons, activation, priority, rule, why, recommendedAction: action, signals };
}
