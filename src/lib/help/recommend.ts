import type { HelpItem, MilestoneId } from '../../types';
import type { ScenarioState } from '../../store/state';
import { SCENARIOS } from '../../data/scenarios';
import { activationStatus, buildMilestones, exceptionsOpen, reconFigures } from '../evaluation/engine';
import { money } from '../format';
import { shortSource } from '../labels';

interface Candidate extends HelpItem { score: number }

/**
 * Contextual help is chosen by rules over persona, goal, progress and blockers — never by a timer.
 * Returns the top 3 items with the reason each one is shown.
 */
export function recommendHelp(s: ScenarioState, screen: 'hub' | 'reconciliation' | 'validation' | 'reporting' | 'approvals' = 'hub'): HelpItem[] {
  const fx = SCENARIOS[s.scenarioId];
  const c: Candidate[] = [];
  const current: MilestoneId | undefined = buildMilestones(s).find((m) => m.id !== 'goals' && m.state !== 'done')?.id;
  const src = shortSource(s.profile.currentERP);
  const rec = reconFigures(s);

  if (s.blocker) c.push({ id: 'h-blocker', score: 100, title: 'Want a CPA to review this with you?', body: s.blocker.detail,
    action: { label: 'Request accounting assistance', kind: 'assist', topic: s.blocker.title }, reason: 'An open blocker is holding up your evaluation.' });

  if (s.path === 'own_data' && s.migration.stage === 'ready' && exceptionsOpen(s) > 0)
    c.push({ id: 'h-exception', score: current === 'validate' || screen === 'validation' ? 90 : 40, title: 'What does a migration exception mean?',
      body: 'An exception is a record or balance that did not carry over exactly. It is listed with source detail so you can decide before relying on the data. Imported, mapped and reconciled are separate checks.',
      action: { label: 'Read the explanation', kind: 'explain', topic: 'exceptions' }, reason: `${exceptionsOpen(s)} migration exception${exceptionsOpen(s) === 1 ? '' : 's'} open.` });

  if (s.path === 'own_data' && s.migration.stage === 'ready' && current === 'validate')
    c.push({ id: 'h-verify', score: 85, title: 'Need help verifying your balances?', body: `A DualEntry accountant can tie out your trial balances against ${src} with you, entity by entity.`,
      action: { label: 'Request a balance review', kind: 'assist', topic: 'Opening balance tie-out' }, reason: 'You are validating imported balances.' });

  if (s.reconciliation.status === 'adjustment_rejected')
    c.push({ id: 'h-rejected', score: 95, title: `Not sure how to resolve the ${money(Math.abs(rec.difference))} difference?`,
      body: 'You rejected the proposed adjustment, so the difference is still open. An accountant can help identify the right treatment.',
      action: { label: 'Ask an accountant', kind: 'assist', topic: 'Reconciliation difference' }, reason: 'The proposed adjustment was rejected and the difference is unresolved.' });
  else if (current === 'reconcile' || screen === 'reconciliation')
    c.push({ id: 'h-matching', score: 70, title: 'How bank and ledger lines are matched', body: 'Lines are matched on amount, date window and reference. Anything unmatched is listed as an exception with a proposed next step that a person must approve.',
      action: { label: 'Read the explanation', kind: 'explain', topic: 'matching' }, reason: 'Reconciliation is your current workflow.' });

  if (s.profile.entityCount > 1 && (current === 'consolidate' || screen === 'reporting'))
    c.push({ id: 'h-elims', score: 75, title: 'How eliminations and FX translation work', body: `Each entity reports in its own currency and is translated at the period's average rate. Intercompany fees are eliminated so the group is not counted twice.`,
      action: { label: 'Read the explanation', kind: 'explain', topic: 'eliminations' }, reason: `You have ${s.profile.entityCount} entities${s.profile.currencies.length > 1 ? ` in ${s.profile.currencies.length} currencies` : ''}.` });

  if (fx.approval.kind === 'controls' && (current === 'approval' || screen === 'approvals' || s.profile.currentERP === 'NetSuite'))
    c.push({ id: 'h-controls', score: current === 'approval' ? 80 : 55, title: 'Mapping NetSuite approval workflows to DualEntry', body: 'Approval routing is configuration, not data. A specialist can walk through each rule and its DualEntry equivalent with you.',
      action: { label: 'Review with a specialist', kind: 'assist', topic: 'Approval rule mapping' }, reason: 'Preserving controls is part of your evaluation goal.' });
  if (fx.approval.kind === 'agent_coding' && (current === 'approval' || screen === 'approvals'))
    c.push({ id: 'h-agent', score: 72, title: 'How agent-prepared entries stay under your control', body: 'Agents prepare and explain. Nothing posts until an authorized person approves, and every decision is recorded in the audit trail.',
      action: { label: 'Read the explanation', kind: 'explain', topic: 'agents' }, reason: 'You are reviewing an agent-prepared entry.' });

  if (s.profile.currentERP === 'QuickBooks Online') c.push({ id: 'h-qbo', score: 45, title: 'How QuickBooks classes and locations map to DualEntry', body: 'Classes and locations become dimensions. Unmapped values are flagged rather than dropped.',
    action: { label: 'Read the explanation', kind: 'explain', topic: 'dimensions' }, reason: 'You are moving from QuickBooks Online.' });
  if (s.profile.currentERP === 'NetSuite') c.push({ id: 'h-ns', score: 50, title: 'Subsidiaries, custom segments and DualEntry entities', body: 'NetSuite subsidiaries map to entities. Custom segments become dimensions.',
    action: { label: 'Read the explanation', kind: 'explain', topic: 'netsuite' }, reason: 'You are moving from NetSuite.' });
  if (s.profile.currentERP === 'Spreadsheets / other' || s.profile.currentERP === 'Other')
    c.push({ id: 'h-start', score: 65, title: 'What you need to get started', body: 'A chart of accounts, opening balances and bank access. A DualEntry accountant can help set up a starter chart of accounts.',
      action: { label: 'See the implementation path', kind: 'explain', topic: 'implementation' }, reason: 'You are setting up an ERP for the first time.' });

  const act = activationStatus(s);
  if (act === 'verified' && (s.profile.timeline === 'within_30' || s.profile.timeline === '1_3_months'))
    c.push({ id: 'h-plan', score: 88, title: 'Plan your implementation with a specialist', body: 'Typical implementations take 4–6 weeks depending on complexity. A specialist can scope yours from what you validated.',
      action: { label: 'Review next steps', kind: 'route', route: '/evaluation/next-steps' }, reason: 'You reached a verified proof point and plan to decide soon.' });
  if (s.path === 'sample' && act === 'sample_completed')
    c.push({ id: 'h-owndata', score: 82, title: 'Ready to see it with your own data?', body: 'Sample results show the workflow. Validating your own data shows whether it works for your books.',
      action: { label: 'Explore the assisted sandbox', kind: 'route', route: '/evaluation/path' }, reason: 'You completed a workflow on sample data.' });

  return c.sort((a, b) => b.score - a.score).slice(0, 3).map((h) => ({ id: h.id, title: h.title, body: h.body, action: h.action, reason: h.reason }));
}

export const HELP_ARTICLES: Record<string, { title: string; paragraphs: string[] }> = {
  exceptions: { title: 'What a migration exception means', paragraphs: [
    'Imported means a record arrived. Mapped means it has a home in DualEntry (account, entity, dimension). Reconciled means balances tie to the source. These are separate checks, and a record can pass one without the others.',
    'An exception lists the source detail, a likely cause and a suggested next step. Accepting a recommendation records your intent; it is applied after a DualEntry accountant confirms it.',
  ] },
  matching: { title: 'How bank and ledger lines are matched', paragraphs: [
    'Lines are matched on amount, a date window and references. Matches are shown so you can inspect them.',
    'Unmatched lines become exceptions. Where the cause is clear, an agent prepares a proposed entry. It is labelled “Prepared for review” and does not post until a person approves it.',
  ] },
  eliminations: { title: 'Eliminations and FX translation', paragraphs: [
    'Each entity keeps its books in its functional currency. For the consolidated income statement, results are translated to USD at the period average rate.',
    'Intercompany charges appear as income in one entity and expense in another. Eliminating both sides prevents the group from counting its own internal fees as revenue.',
  ] },
  agents: { title: 'Agents and human control', paragraphs: [
    'Agents prepare work: they match, code and draft entries, and explain why. They do not post sensitive accounting changes on their own.',
    'An authorized approver decides. Approval, rejection and returns are recorded with who, what and when.',
  ] },
  dimensions: { title: 'QuickBooks classes and locations', paragraphs: ['Classes and locations become DualEntry dimensions, so reporting by department or location carries over. Values with no target are flagged during validation.'] },
  netsuite: { title: 'NetSuite subsidiaries and segments', paragraphs: ['Each subsidiary maps to a DualEntry entity, keeping its hierarchy. Custom segments become dimensions. Workflow configuration such as approval routing is recreated, not migrated as data.'] },
  implementation: { title: 'What implementation involves', paragraphs: [
    'DualEntry describes data migration in about 24 hours and typical implementation in 4–6 weeks. Actual timing depends on data quality, entities and integrations.',
    'For a single-entity company, the main inputs are a chart of accounts, opening balances and bank connections. A DualEntry accountant can help with each.',
  ] },
};
