import type { LifecycleContext, ProductEvent, ProspectScenarioId } from '../../types';
import type { ScenarioState } from '../../store/state';
import { SCENARIOS } from '../../data/scenarios';
import { activationStatus, buildMilestones, exceptionsOpen, reconFigures } from '../evaluation/engine';
import { liveSnapshot } from '../qualification/snapshots';
import { qualify } from '../qualification/model';
import { money } from '../format';

const H = 3_600_000;

export const simulatedNow = (s: ScenarioState, now = Date.now()) => now + s.lifecycle.clockOffsetHours * H;

export function buildLifecycleContext(id: ProspectScenarioId, s: ScenarioState, events: ProductEvent[], now = Date.now()): LifecycleContext {
  const fx = SCENARIOS[id];
  const snap = liveSnapshot(id, s, events, now);
  const q = qualify(snap, now);
  const simNow = simulatedNow(s, now);
  const meaningful = events.filter((e) => e.accountId === fx.account.id && e.meaningful);
  const last = meaningful.length ? Math.max(...meaningful.map((e) => e.timestamp)) : s.startedAt ?? now;
  const rec = reconFigures(s);
  const next = buildMilestones(s).find((m) => m.id !== 'goals' && m.state !== 'done');
  const nextWorkflow = buildMilestones(s).find((m) => m.state !== 'done' && m.id !== 'goals' && m.id !== 'stakeholder');
  return {
    accountId: fx.account.id,
    firstName: fx.user.firstName,
    companyName: fx.account.name,
    persona: id,
    path: s.path,
    migrationReady: s.migration.stage === 'ready',
    validationStarted: s.validationStarted,
    reconExceptionOpen: s.reconciliation.status !== 'not_started' && !rec.reconciled,
    reconAssistanceRequested: s.assistance.some((a) => a.topic.toLowerCase().includes('reconciliation')),
    activation: activationStatus(s),
    hoursSinceMeaningfulActivity: Math.max(0, (simNow - last) / H),
    meetingScheduled: s.salesRequest.status === 'scheduled',
    salesRequested: s.salesRequest.status === 'requested',
    marketingOptIn: s.lifecycle.marketingOptIn,
    repFollowUpActiveOn: s.lifecycle.repFollowUpActiveOn,
    qualified: q.fit !== 'low' || q.intent !== 'low',
    intent: q.intent,
    nextIncompleteTask: next?.title ?? null,
    marketingSentWithinCap: s.lifecycle.messages.some((m) => m.communicationClass === 'marketing' && m.deliveryStatus === 'queued_simulated' && simNow - m.createdAt < 72 * H),
    sourceSystem: s.profile.currentERP,
    recordsImported: fx.migration.recordsImported,
    exceptionsOpen: exceptionsOpen(s),
    differenceLabel: `A ${money(Math.abs(rec.difference))} difference`,
    nextWorkflow: nextWorkflow?.title ?? (s.profile.entityCount > 1 ? 'Review consolidated reporting' : 'Review your implementation path'),
  };
}
