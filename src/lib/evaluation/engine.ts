import type { ActivationStatus, GoalId, Milestone, MilestoneId, MilestoneState, MigrationStage, ScenarioFixture } from '../../types';
import type { ScenarioState } from '../../store/state';
import { MIGRATION_STAGES } from '../../store/state';
import { SCENARIOS } from '../../data/scenarios';
import { computeReconciliation } from '../accounting/reconciliation';
import { shortSource } from '../labels';

// ───────────────────────────── Migration (time-derived so it survives refresh)

export function migrationStageAt(s: ScenarioState, now: number): MigrationStage {
  if (s.migration.stage === 'not_requested') return 'not_requested';
  if (s.migration.completedAt) return 'ready';
  const elapsed = now - (s.migration.requestedAt ?? now);
  let stage: MigrationStage = 'requested';
  for (const st of MIGRATION_STAGES) if (elapsed >= st.at) stage = st.stage;
  return stage;
}

export const dataAvailable = (s: ScenarioState) => s.path === 'sample' || (s.path === 'own_data' && s.migration.stage === 'ready');

// ───────────────────────────── Milestone sequence by goal

const GOAL_SEQUENCE: Record<GoalId, MilestoneId[]> = {
  close: ['data', 'validate', 'reconcile', 'approval', 'consolidate', 'stakeholder'],
  reconcile: ['data', 'validate', 'reconcile', 'consolidate', 'stakeholder'],
  consolidate: ['data', 'validate', 'consolidate', 'approval', 'reconcile', 'stakeholder'],
  ap: ['data', 'validate', 'approval', 'reconcile', 'stakeholder'],
  reporting: ['data', 'validate', 'consolidate', 'reconcile', 'stakeholder'],
  scale: ['data', 'reconcile', 'approval', 'stakeholder'],
};

export function milestoneSequence(s: ScenarioState): MilestoneId[] {
  let seq: MilestoneId[] = ['goals', ...GOAL_SEQUENCE[s.profile.goal]];
  if (s.profile.entityCount <= 1) seq = seq.filter((m) => m !== 'consolidate');
  if (s.path === 'sample') seq = seq.filter((m) => m !== 'validate');
  if (s.path === 'own_data' && !seq.includes('validate')) seq.splice(2, 0, 'validate');
  return seq;
}

export const highExceptionsOpen = (s: ScenarioState) =>
  SCENARIOS[s.scenarioId].migration.exceptions.filter((e) => e.severity === 'high' && s.exceptionDecisions[e.id] === 'open').length;

export const exceptionsOpen = (s: ScenarioState) => Object.values(s.exceptionDecisions).filter((d) => d === 'open').length;

export function isMilestoneDone(s: ScenarioState, id: MilestoneId): boolean {
  switch (id) {
    case 'goals': return s.profileConfirmed;
    case 'data': return dataAvailable(s);
    case 'validate': return s.validationStarted && highExceptionsOpen(s) === 0;
    case 'reconcile': return s.reconciliation.status === 'reconciled';
    case 'consolidate': return s.consolidation.completed;
    case 'approval': return s.approval.status !== 'pending';
    case 'stakeholder': return s.stakeholders.length > 1;
  }
}

function rawState(s: ScenarioState, id: MilestoneId): MilestoneState {
  if (isMilestoneDone(s, id)) return 'done';
  switch (id) {
    case 'goals': return s.started ? 'in_progress' : 'todo';
    case 'data':
      if (s.path === 'own_data' && s.migration.stage !== 'not_requested') return 'in_progress';
      return 'todo';
    case 'validate': return s.validationStarted ? 'in_progress' : dataAvailable(s) ? 'waiting_on_me' : 'todo';
    case 'reconcile':
      if (s.reconciliation.status === 'adjustment_rejected') return 'in_progress';
      if (s.reconciliation.status === 'in_review') return 'waiting_on_me';
      return 'todo';
    case 'consolidate': return s.consolidation.entitiesViewed.length || s.consolidation.consolidatedViewed ? 'in_progress' : 'todo';
    case 'approval': return dataAvailable(s) ? 'waiting_on_me' : 'todo';
    case 'stakeholder': return 'todo';
  }
}

export function milestoneState(s: ScenarioState, id: MilestoneId): MilestoneState {
  const st = rawState(s, id);
  if (st !== 'done' && s.blocker?.relatedMilestone === id) return 'blocked';
  return st;
}

export function milestoneCopy(fx: ScenarioFixture, s: ScenarioState, id: MilestoneId): { title: string; description: string; route: string; verifiedBy: string } {
  const src = shortSource(s.profile.currentERP);
  const multi = s.profile.entityCount > 1;
  switch (id) {
    case 'goals': return { title: 'Confirm what you want to evaluate', description: 'Goal, current system and timeline.', route: '/evaluation/profile', verifiedBy: 'evaluation_goal_selected' };
    case 'data':
      return s.path === 'sample'
        ? { title: 'Open the sample workspace', description: 'Explore preconfigured, fictional data.', route: '/evaluation/data', verifiedBy: 'evaluation_path_selected' }
        : { title: `Prepare your ${src} data`, description: 'CPA-assisted migration into your evaluation sandbox.', route: '/evaluation/data', verifiedBy: 'migration_simulation_completed' };
    case 'validate': return { title: 'Validate imported balances', description: 'Review checks and resolve high-severity exceptions.', route: '/evaluation/data/validation', verifiedBy: 'migration_validation_started + high exceptions addressed' };
    case 'reconcile': return { title: 'Complete your first reconciliation', description: `${fx.reconciliation.ledgerAccount} · ${fx.reconciliation.period}`, route: '/evaluation/reconciliation', verifiedBy: 'reconciliation_verified' };
    case 'consolidate': return { title: multi ? 'Review consolidated reporting' : 'Review your income statement', description: multi ? `${s.profile.entityCount} entities, eliminations and FX` : 'Single-entity reporting', route: '/evaluation/reporting', verifiedBy: 'consolidation_reviewed' };
    case 'approval':
      return fx.approval.kind === 'controls'
        ? { title: 'Validate an approval control', description: `${fx.approval.requiredApproverRole} approval with audit trail`, route: '/evaluation/approvals', verifiedBy: 'approval_workflow_decided' }
        : { title: 'Review an agent-prepared entry', description: 'AI-prepared coding with human approval', route: '/evaluation/approvals', verifiedBy: 'approval_workflow_decided' };
    case 'stakeholder': return { title: s.scenarioId === 'startup' ? 'Invite your CEO or outside accountant' : 'Invite your CFO to the evaluation', description: 'Evaluations with the decision maker involved move faster.', route: '/evaluation/invite', verifiedBy: 'stakeholder_invited' };
  }
}

export function buildMilestones(s: ScenarioState): Milestone[] {
  const fx = SCENARIOS[s.scenarioId];
  return milestoneSequence(s).map((id) => ({ id, state: milestoneState(s, id), ...milestoneCopy(fx, s, id) }));
}

// ───────────────────────────── Activation

/**
 * Verified activation = a posted, balanced, human-approved accounting outcome on the prospect's own (migrated) data:
 *   reconciliation reconciled (ledger ties to bank) OR a controlled entry approved.
 * The same outcome on sample data is "sample_completed", never "verified".
 */
export function proofPoints(s: ScenarioState): string[] {
  const out: string[] = [];
  if (s.validationStarted && highExceptionsOpen(s) === 0 && s.path === 'own_data') out.push('Migration validation reviewed');
  if (s.reconciliation.status === 'reconciled') out.push('Reconciliation completed with approved adjustment');
  if (s.approval.status === 'approved') out.push('Controlled entry approved with audit trail');
  if (s.approval.status === 'rejected' || s.approval.status === 'returned') out.push('Approval control exercised (entry not posted)');
  if (s.consolidation.completed) out.push('Consolidated reporting reviewed');
  return out;
}

export function activationStatus(s: ScenarioState): ActivationStatus {
  const achieved = s.reconciliation.status === 'reconciled' || s.approval.status === 'approved';
  if (achieved) return s.path === 'own_data' ? 'verified' : 'sample_completed';
  const anyStarted = s.reconciliation.status !== 'not_started' || s.consolidation.entitiesViewed.length > 0 ||
    s.consolidation.consolidatedViewed || s.approval.docsInspected || s.validationStarted;
  return anyStarted ? 'in_progress' : 'not_started';
}

// ───────────────────────────── Next recommended action (exactly one)

export interface NextAction {
  id: string;
  title: string;
  body: string;
  cta: string;
  route?: string;
  kind: 'route' | 'assist' | 'wait';
}

export function nextAction(s: ScenarioState): NextAction {
  const fx = SCENARIOS[s.scenarioId];
  if (!s.profileConfirmed) return { id: 'profile', title: 'Confirm what you want to evaluate', body: 'Three quick questions so the evaluation focuses on your workflows.', cta: 'Continue', route: '/evaluation/profile', kind: 'route' };
  if (!s.path) return { id: 'path', title: 'Choose how to evaluate', body: 'Explore sample data now, or validate your own data with DualEntry.', cta: 'Choose a path', route: '/evaluation/path', kind: 'route' };
  if (s.blocker) return { id: 'blocker', title: s.blocker.title, body: 'This is holding up your evaluation. A DualEntry accountant can review it with you.', cta: 'Request accounting assistance', kind: 'assist' };
  if (s.path === 'own_data' && s.migration.stage === 'not_requested')
    return { id: 'migrate', title: `Request your ${shortSource(s.profile.currentERP)} sandbox`, body: 'A DualEntry team member prepares your data in an evaluation sandbox. You review everything before deciding.', cta: 'Review migration request', route: '/evaluation/data', kind: 'route' };
  if (s.path === 'own_data' && s.migration.stage !== 'ready')
    return { id: 'migrating', title: 'Your data is being prepared', body: 'You will be notified when it is ready for review. You can explore the sample workspace meanwhile.', cta: 'View migration status', route: '/evaluation/data', kind: 'wait' };

  const ms = buildMilestones(s).filter((m) => m.id !== 'goals' && m.state !== 'done');
  const m = ms[0];
  if (!m) {
    return s.salesRequest.status === 'none'
      ? { id: 'handoff', title: 'Discuss next steps with DualEntry', body: 'You have validated the workflows you set out to evaluate.', cta: 'Review next steps', route: '/evaluation/next-steps', kind: 'route' }
      : { id: 'done', title: 'Your evaluation summary is with DualEntry', body: 'Keep exploring while your request is reviewed.', cta: 'Explore general ledger', route: '/evaluation/ledger', kind: 'route' };
  }
  const bodies: Record<MilestoneId, string> = {
    goals: '',
    data: '',
    validate: `${fx.migration.recordsImported.toLocaleString()} records are imported. Confirm balances tie to ${shortSource(s.profile.currentERP)} before relying on them.`,
    reconcile: s.reconciliation.status === 'adjustment_rejected'
      ? 'The proposed adjustment was rejected, so the difference is still open. Reopen it or ask an accountant.'
      : `${fx.reconciliation.ledgerAccount} has one unmatched bank line for ${fx.reconciliation.period}. Review it and approve or reject the proposed entry.`,
    consolidate: `See how ${s.profile.entityCount} entities roll up, including FX translation and intercompany eliminations.`,
    approval: `${fx.approval.preparer} prepared an entry that requires ${fx.approval.requiredApproverRole} approval. Inspect the support and decide.`,
    stakeholder: 'Bring in the person who signs off on the decision. They will see your progress, not your raw data.',
  };
  const ctas: Record<MilestoneId, string> = { goals: '', data: 'Open', validate: 'Review validation', reconcile: 'Open reconciliation', consolidate: 'Open consolidated report', approval: 'Review entry', stakeholder: 'Invite a colleague' };
  return { id: m.id, title: m.title, body: bodies[m.id], cta: ctas[m.id], route: m.route, kind: 'route' };
}

// ───────────────────────────── Tasks (derived; never manually ticked)

export type TaskColumn = 'todo' | 'in_progress' | 'waiting_on_me' | 'done';
export interface EvalTask {
  id: string;
  title: string;
  detail: string;
  column: TaskColumn;
  assignee: string;
  source: 'Evaluation' | 'Agent' | 'DualEntry team' | 'Migration';
  route?: string;
  blocked?: boolean;
  verifiedBy?: string;
}

export function buildTasks(s: ScenarioState): EvalTask[] {
  const fx = SCENARIOS[s.scenarioId];
  const tasks: EvalTask[] = [];
  for (const m of buildMilestones(s)) {
    if (m.id === 'goals') continue;
    const col: TaskColumn = m.state === 'blocked' ? 'in_progress' : m.state === 'done' ? 'done' : m.state === 'waiting_on_me' ? 'waiting_on_me' : m.state === 'in_progress' ? 'in_progress' : 'todo';
    const agent = m.id === 'reconcile' || m.id === 'approval';
    tasks.push({
      id: `task-${m.id}`, title: m.title, detail: m.description, column: col,
      assignee: m.id === 'data' && s.path === 'own_data' && col === 'in_progress' ? 'DualEntry implementation team' : 'You',
      source: agent ? 'Agent' : m.id === 'data' || m.id === 'validate' ? 'Migration' : 'Evaluation',
      route: m.route, blocked: m.state === 'blocked', verifiedBy: m.state === 'done' ? m.verifiedBy : undefined,
    });
  }
  if (s.path === 'own_data' && s.validationStarted) {
    for (const e of fx.migration.exceptions) {
      const d = s.exceptionDecisions[e.id];
      if (d === 'assistance_requested') tasks.push({ id: `task-ex-${e.id}`, title: e.title, detail: 'With a DualEntry accountant', column: 'in_progress', assignee: 'DualEntry CPA team', source: 'DualEntry team', route: '/evaluation/data/validation' });
    }
  }
  for (const a of s.assistance) {
    tasks.push({ id: `task-${a.id}`, title: `Assistance: ${a.topic}`, detail: 'Request submitted (simulated)', column: 'in_progress', assignee: 'DualEntry CPA team', source: 'DualEntry team' });
  }
  return tasks;
}

export function evaluationProgress(s: ScenarioState) {
  const ms = buildMilestones(s);
  const done = ms.filter((m) => m.state === 'done').length;
  return { done, total: ms.length, pct: Math.round((done / ms.length) * 100) };
}

/** Recon figures for a scenario, honoring posted adjustments. */
export const reconFigures = (s: ScenarioState) => computeReconciliation(SCENARIOS[s.scenarioId].reconciliation, s.ledgerEntries);

/** Name shown for the dataset: sample path never shows the prospect's company as if it were their data. */
export function datasetName(s: ScenarioState, name: string) {
  const fx = SCENARIOS[s.scenarioId];
  if (s.path !== 'sample') return name;
  return name.replace(fx.account.name, fx.sampleCompanyName.replace(' (sample)', ''));
}

export function evaluationStateLabel(s: ScenarioState): string {
  if (s.customer.status === 'customer') return 'Customer';
  if (!s.started) return 'Invited, not started';
  if (!s.path) return 'Profiling';
  if (s.blocker) return 'Blocked';
  if (s.path === 'own_data' && s.migration.stage !== 'ready') return 'Sandbox in preparation';
  const a = activationStatus(s);
  if (a === 'verified') return 'Activated (own data)';
  if (a === 'sample_completed') return 'Sample evaluation completed';
  return s.path === 'sample' ? 'Exploring sample data' : 'Validating own data';
}
