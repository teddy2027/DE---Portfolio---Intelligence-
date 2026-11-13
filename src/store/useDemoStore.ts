import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Disposition, EvaluationPath, EvaluationProfile, EventName, ExceptionDecision, JourneyId, LifecycleMessage, ProductEvent,
  ProspectScenarioId, ScenarioId, Stakeholder,
} from '../types';
import { SCENARIOS, ALL_SCENARIOS, PROSPECT_SCENARIOS } from '../data/scenarios';
import { seedScenario, type ScenarioState } from './state';
import { EVENT_CATALOG } from '../lib/analytics/catalog';
import { activationStatus, reconFigures } from '../lib/evaluation/engine';
import { liveSnapshot } from '../lib/qualification/snapshots';
import { qualify } from '../lib/qualification/model';
import { evaluateJourney } from '../lib/lifecycle/engine';
import { buildLifecycleContext, simulatedNow } from '../lib/lifecycle/context';
import { entryTotals } from '../lib/accounting/journal';
import { referralEligibility } from '../lib/referral/eligibility';

export type SimulatedAccountEvent = 'declare_near_term' | 'complete_reconciliation' | 'invite_cfo' | 'raise_blocker' | 'request_meeting' | 'go_inactive';

export interface DemoStore {
  activeScenario: ScenarioId;
  scenarios: Record<ScenarioId, ScenarioState>;
  events: ProductEvent[];
  fixtureDispositions: Record<string, Disposition>;
  inspectorOpen: boolean;
  announcement: string;

  // demo controls
  switchScenario: (id: ScenarioId) => void;
  resetDemo: () => void;
  resetScenario: (id: ScenarioId) => void;
  setInspectorOpen: (open: boolean) => void;
  announce: (msg: string) => void;
  simulateBlocker: () => void;
  resolveBlocker: () => void;
  simulateInactivity: (hours?: number, id?: ProspectScenarioId) => void;

  // entry & profiling
  startEvaluation: () => void;
  resumeEvaluation: () => void;
  updateProfile: (patch: Partial<EvaluationProfile>, source?: string) => void;
  confirmProfile: () => void;
  selectPath: (path: EvaluationPath) => void;

  // migration
  requestMigration: () => void;
  completeMigration: (id?: ScenarioId) => void;
  startValidation: () => void;
  viewException: (exceptionId: string) => void;
  decideException: (exceptionId: string, decision: ExceptionDecision) => void;

  // reconciliation
  openReconciliation: () => void;
  reviewReconException: () => void;
  inspectSource: () => void;
  reviewEntry: () => void;
  approveEntry: () => boolean;
  rejectEntry: (reason: string) => void;
  reopenEntry: () => void;

  // reporting
  viewEntity: (entityId: string) => void;
  viewConsolidated: () => void;
  inspectEliminations: () => void;

  // approvals
  inspectApprovalDocs: () => void;
  decideApproval: (decision: 'approved' | 'rejected' | 'returned', comment?: string) => void;

  // collaboration, help, sales
  inviteStakeholder: (p: Omit<Stakeholder, 'id' | 'status' | 'invitedAt'>, source?: string) => void;
  requestAssistance: (topic: string, context: string, source?: string) => void;
  trackHelp: (kind: 'viewed' | 'accepted', helpId: string, source: string) => void;
  requestSalesMeeting: (p: { topic: string; keyQuestion: string; preferredWindow: string }) => void;
  saveAndContinue: () => void;

  // lifecycle
  setLifecycleFlags: (id: ProspectScenarioId, patch: Partial<Pick<ScenarioState['lifecycle'], 'marketingOptIn' | 'repFollowUpActiveOn'>>) => void;
  runJourney: (id: ProspectScenarioId, journeyId: JourneyId) => LifecycleMessage;
  previewMessage: (id: ProspectScenarioId, journeyId: JourneyId) => void;

  // sales
  setDisposition: (accountId: string, status: Disposition['status']) => void;
  assignFollowUp: (accountId: string, followUp: NonNullable<Disposition['followUp']>) => void;
  markMeetingScheduled: (id: ProspectScenarioId) => void;
  simulateAccountEvent: (id: ProspectScenarioId, kind: SimulatedAccountEvent) => void;

  // referral
  viewReferralPrompt: () => void;
  copyReferralLink: () => void;
  prepareReferralInvite: (p: { name: string; email: string; company: string }) => void;
}

const seedAll = () => Object.fromEntries(ALL_SCENARIOS.map((id) => [id, seedScenario(id)])) as Record<ScenarioId, ScenarioState>;
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const isProspect = (id: ScenarioId): id is ProspectScenarioId => (PROSPECT_SCENARIOS as readonly string[]).includes(id);
const scenarioByAccount = (accountId: string) => ALL_SCENARIOS.find((id) => SCENARIOS[id].account.id === accountId);

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => {
      /** Emit a product event for a scenario's account. */
      const track = (id: ScenarioId, eventName: EventName, sourceScreen: string, metadata: ProductEvent['metadata'] = {}) => {
        const fx = SCENARIOS[id];
        const def = EVENT_CATALOG[eventName];
        const e: ProductEvent = {
          eventId: uid('evt'), eventName, category: def.category, accountId: fx.account.id, userId: fx.user.id,
          timestamp: Date.now(), sourceScreen, metadata, demoMode: true, meaningful: def.meaningful, crmForwarded: def.crm,
        };
        set((st) => ({ events: [...st.events, e].slice(-400) }));
      };

      /** Re-evaluate Sales priority for a live account and log a signal when it changes. */
      const reprioritize = (id: ScenarioId) => {
        if (!isProspect(id)) return;
        const st = get();
        const s = st.scenarios[id];
        const q = qualify(liveSnapshot(id, s, st.events, Date.now()), Date.now());
        if (s.lastPriority !== q.priority) {
          set((x) => ({ scenarios: { ...x.scenarios, [id]: { ...x.scenarios[id], lastPriority: q.priority } } }));
          if (s.started || s.lastPriority) track(id, 'sales_signal_generated', 'qualification-engine', { priority: q.priority, rule: q.rule.split(' · ')[0] });
        }
      };

      /** Clone-mutate-commit for one scenario's state, then re-prioritize. */
      const mut = (id: ScenarioId, fn: (d: ScenarioState) => void) => {
        const draft = structuredClone(get().scenarios[id]);
        fn(draft);
        set((st) => ({ scenarios: { ...st.scenarios, [id]: draft } }));
      };

      const active = () => get().activeScenario;
      const cur = () => get().scenarios[get().activeScenario];

      const finishActivation = (id: ScenarioId, workflow: string) => {
        const s = get().scenarios[id];
        if (s.firstValueAt) return;
        const status = activationStatus(s);
        if (status === 'verified' || status === 'sample_completed') {
          mut(id, (d) => { d.firstValueAt = Date.now(); });
          track(id, status === 'verified' ? 'evaluation_first_value_achieved' : 'sample_evaluation_completed', workflow, { workflow, activation: status, path: s.path ?? 'none' });
        }
      };

      // ── Reconciliation core (used by UI and by Sales-side simulation)
      const approveFor = (id: ScenarioId, screen: string): boolean => {
        const s = get().scenarios[id];
        const fx = SCENARIOS[id].reconciliation;
        if (s.reconciliation.decision === 'approved') return false;
        if (!entryTotals(fx.proposedEntry).balanced) return false; // never post an unbalanced entry
        const user = SCENARIOS[id].user;
        mut(id, (d) => {
          d.ledgerEntries.push({ ...fx.proposedEntry, status: 'posted', approvedBy: user.name, postedAt: Date.now() });
          d.reconciliation = { ...d.reconciliation, decision: 'approved', decidedAt: Date.now(), rejectionReason: undefined, entryReviewed: true, exceptionReviewed: true };
          d.reconciliation.status = reconFigures(d).reconciled ? 'reconciled' : 'in_review';
          d.auditTrail.push({ id: uid('aud'), at: Date.now(), actor: user.name, action: `Approved and posted ${fx.proposedEntry.id}` });
        });
        track(id, 'journal_entry_approved', screen, { workflow: 'reconciliation', decision: 'approved', entryId: fx.proposedEntry.id });
        if (get().scenarios[id].reconciliation.status === 'reconciled') {
          track(id, 'reconciliation_verified', screen, { workflow: 'reconciliation', proofPoint: 'reconciliation', path: get().scenarios[id].path ?? 'none' });
        }
        finishActivation(id, screen);
        reprioritize(id);
        return true;
      };

      return {
        activeScenario: 'quickbooks',
        scenarios: seedAll(),
        events: [],
        fixtureDispositions: {},
        inspectorOpen: false,
        announcement: '',

        switchScenario: (id) => {
          set({ activeScenario: id });
          const s = get().scenarios[id];
          if (s.started && isProspect(id)) track(id, 'evaluation_resumed', 'scenario-switcher');
          get().announce(`Scenario switched to ${SCENARIOS[id].label}`);
        },
        resetDemo: () => {
          set({ scenarios: seedAll(), events: [], fixtureDispositions: {} });
          get().announce('Demo reset');
        },
        resetScenario: (id) => {
          const accountId = SCENARIOS[id].account.id;
          set((st) => ({ scenarios: { ...st.scenarios, [id]: seedScenario(id) }, events: st.events.filter((e) => e.accountId !== accountId) }));
          get().announce(`${SCENARIOS[id].label} scenario reset`);
        },
        setInspectorOpen: (open) => set({ inspectorOpen: open }),
        announce: (msg) => set((st) => ({ announcement: st.announcement.endsWith(' ') ? msg : `${msg} ` })),
        simulateBlocker: () => {
          const id = active();
          if (!isProspect(id)) return;
          mut(id, (d) => { d.blocker = { ...SCENARIOS[id].blockerTemplate }; });
          track(id, 'evaluation_blocker_detected', 'demo-controls', { milestone: SCENARIOS[id].blockerTemplate.relatedMilestone });
          reprioritize(id);
          get().announce('Blocker simulated');
        },
        resolveBlocker: () => {
          const id = active();
          mut(id, (d) => { d.blocker = null; });
          reprioritize(id);
          get().announce('Blocker resolved (simulated CPA resolution)');
        },
        simulateInactivity: (hours = 72, sid) => {
          const id = sid ?? active();
          if (!isProspect(id)) return;
          mut(id, (d) => { d.lifecycle.clockOffsetHours += hours; });
          track(id, 'inactivity_simulated', 'demo-controls', { hours });
          reprioritize(id);
          get().announce(`Simulated ${hours} hours of inactivity`);
        },

        startEvaluation: () => {
          const id = active();
          if (!cur().started) {
            mut(id, (d) => { d.started = true; d.startedAt = Date.now(); });
            track(id, 'evaluation_started', 'welcome', { source: SCENARIOS[id].account.acquisitionSource });
            reprioritize(id);
          }
        },
        resumeEvaluation: () => track(active(), 'evaluation_resumed', 'welcome'),
        updateProfile: (patch, source = 'profile') => {
          const id = active();
          const before = cur().profile;
          mut(id, (d) => { d.profile = { ...d.profile, ...patch }; });
          for (const [field, value] of Object.entries(patch)) {
            if (JSON.stringify(before[field as keyof EvaluationProfile]) === JSON.stringify(value)) continue;
            if (field === 'goal') track(id, 'evaluation_goal_selected', source, { goal: String(value) });
            else track(id, 'qualification_updated', source, { field, ...(field === 'timeline' ? { timeline: String(value) } : {}), ...(field === 'entityCount' ? { entityCount: Number(value) } : {}), ...(field === 'currentERP' ? { sourceSystem: String(value) } : {}) });
          }
          reprioritize(id);
        },
        confirmProfile: () => {
          const id = active();
          const s = cur();
          mut(id, (d) => { d.profileConfirmed = true; d.started = true; d.startedAt ??= Date.now(); });
          if (!s.profileConfirmed) track(id, 'evaluation_goal_selected', 'profile', { goal: s.profile.goal, sourceSystem: s.profile.currentERP, timeline: s.profile.timeline, entityCount: s.profile.entityCount });
          reprioritize(id);
        },
        selectPath: (path) => {
          const id = active();
          const s = cur();
          if (s.path === path) return;
          const fresh = seedScenario(id);
          mut(id, (d) => {
            if (d.path && d.path !== path) {
              // Switching datasets resets dataset-bound workflow progress so nothing contradicts.
              d.reconciliation = fresh.reconciliation; d.ledgerEntries = []; d.consolidation = fresh.consolidation;
              d.approval = fresh.approval; d.firstValueAt = undefined;
            }
            d.path = path;
          });
          track(id, 'evaluation_path_selected', 'path', { path });
          reprioritize(id);
        },

        requestMigration: () => {
          const id = active();
          if (cur().migration.stage !== 'not_requested') return;
          mut(id, (d) => { d.migration = { stage: 'requested', requestedAt: Date.now() }; });
          track(id, 'migration_requested', 'data-readiness', { sourceSystem: cur().profile.currentERP, entityCount: cur().profile.entityCount });
          track(id, 'migration_simulation_started', 'data-readiness', { simulated: true });
          reprioritize(id);
        },
        completeMigration: (sid) => {
          const id = sid ?? active();
          const s = get().scenarios[id];
          if (s.migration.stage === 'ready' || s.migration.stage === 'not_requested') return;
          mut(id, (d) => { d.migration = { ...d.migration, stage: 'ready', completedAt: Date.now(), lastSyncAt: Date.now() }; });
          track(id, 'migration_simulation_completed', 'data-readiness', { simulated: true, records: SCENARIOS[id].migration.recordsImported });
          if (id === active()) get().announce('Your data is ready for review');
        },
        startValidation: () => {
          const id = active();
          if (cur().validationStarted) return;
          mut(id, (d) => { d.validationStarted = true; });
          track(id, 'migration_validation_started', 'validation', { milestone: 'validate' });
          reprioritize(id);
        },
        viewException: (exId) => {
          const id = active();
          if (cur().viewedExceptions.includes(exId)) return;
          const ex = SCENARIOS[id].migration.exceptions.find((e) => e.id === exId);
          mut(id, (d) => { d.viewedExceptions.push(exId); });
          track(id, 'migration_exception_viewed', 'validation', { exceptionId: exId, severity: ex?.severity ?? 'unknown' });
        },
        decideException: (exId, decision) => {
          const id = active();
          const ex = SCENARIOS[id].migration.exceptions.find((e) => e.id === exId);
          mut(id, (d) => { d.exceptionDecisions[exId] = decision; });
          if (decision === 'recommendation_accepted') track(id, 'migration_exception_recommendation_accepted', 'validation', { exceptionId: exId, severity: ex?.severity ?? '' });
          if (decision === 'assistance_requested') track(id, 'specialist_assistance_requested', 'validation', { topic: 'Migration exception', severity: ex?.severity ?? '' });
          reprioritize(id);
        },

        openReconciliation: () => {
          const id = active();
          if (cur().reconciliation.status !== 'not_started') return;
          const fx = SCENARIOS[id].reconciliation;
          mut(id, (d) => { d.reconciliation.status = 'in_review'; });
          track(id, 'accounting_workflow_started', 'reconciliation', { workflow: 'reconciliation' });
          track(id, 'journal_entry_proposed', 'reconciliation', { workflow: 'reconciliation', entryId: fx.proposedEntry.id, preparedBy: fx.proposedEntry.preparedBy });
          reprioritize(id);
        },
        reviewReconException: () => {
          const id = active();
          if (cur().reconciliation.exceptionReviewed) return;
          mut(id, (d) => { d.reconciliation.exceptionReviewed = true; });
          track(id, 'reconciliation_exception_reviewed', 'reconciliation', { workflow: 'reconciliation' });
        },
        inspectSource: () => {
          const id = active();
          if (!cur().reconciliation.sourceInspected) track(id, 'reconciliation_source_inspected', 'reconciliation', { workflow: 'reconciliation' });
          mut(id, (d) => { d.reconciliation.sourceInspected = true; d.reconciliation.exceptionReviewed = true; });
        },
        reviewEntry: () => mut(active(), (d) => { d.reconciliation.entryReviewed = true; }),
        approveEntry: () => {
          const ok = approveFor(active(), 'reconciliation');
          if (ok) get().announce('Adjustment approved and posted. Reconciliation complete.');
          return ok;
        },
        rejectEntry: (reason) => {
          const id = active();
          const s = cur();
          if (s.reconciliation.decision !== 'none') return;
          const fx = SCENARIOS[id].reconciliation;
          mut(id, (d) => {
            d.reconciliation = { ...d.reconciliation, status: 'adjustment_rejected', decision: 'rejected', decidedAt: Date.now(), rejectionReason: reason };
            d.auditTrail.push({ id: uid('aud'), at: Date.now(), actor: SCENARIOS[id].user.name, action: `Rejected ${fx.proposedEntry.id}: ${reason}` });
          });
          track(id, 'journal_entry_rejected', 'reconciliation', { workflow: 'reconciliation', decision: 'rejected', entryId: fx.proposedEntry.id });
          reprioritize(id);
          get().announce('Adjustment rejected. Nothing was posted; the difference remains open.');
        },
        reopenEntry: () => {
          const id = active();
          if (cur().reconciliation.decision !== 'rejected') return;
          mut(id, (d) => { d.reconciliation = { ...d.reconciliation, status: 'in_review', decision: 'none', rejectionReason: undefined }; });
        },

        viewEntity: (entityId) => {
          const id = active();
          if (!cur().consolidation.entitiesViewed.includes(entityId)) {
            mut(id, (d) => { d.consolidation.entitiesViewed.push(entityId); });
            track(id, 'report_viewed', 'reporting', { report: 'income_statement', view: 'entity', entityId });
          }
          checkConsolidation(id);
        },
        viewConsolidated: () => {
          const id = active();
          if (!cur().consolidation.consolidatedViewed) {
            mut(id, (d) => { d.consolidation.consolidatedViewed = true; });
            track(id, 'report_viewed', 'reporting', { report: 'income_statement', view: 'consolidated' });
          }
          checkConsolidation(id);
        },
        inspectEliminations: () => {
          const id = active();
          if (!cur().consolidation.eliminationsInspected) {
            mut(id, (d) => { d.consolidation.eliminationsInspected = true; });
            track(id, 'report_viewed', 'reporting', { report: 'eliminations' });
          }
          checkConsolidation(id);
        },

        inspectApprovalDocs: () => {
          const id = active();
          if (cur().approval.docsInspected) return;
          mut(id, (d) => {
            d.approval.docsInspected = true;
            d.auditTrail.push({ id: uid('aud'), at: Date.now(), actor: SCENARIOS[id].user.name, action: 'Opened supporting documentation' });
          });
          track(id, 'accounting_workflow_started', 'approvals', { workflow: 'approval' });
        },
        decideApproval: (decision, comment) => {
          const id = active();
          const s = cur();
          if (s.approval.status !== 'pending') return;
          const fx = SCENARIOS[id].approval;
          const user = SCENARIOS[id].user;
          mut(id, (d) => {
            d.approval = { ...d.approval, status: decision, decidedAt: Date.now(), comment };
            if (decision === 'approved') d.ledgerEntries.push({ ...fx.entry, status: 'posted', approvedBy: user.name, postedAt: Date.now() });
            d.auditTrail.push({ id: uid('aud'), at: Date.now(), actor: user.name, action: `${decision === 'approved' ? 'Approved and posted' : decision === 'rejected' ? 'Rejected' : 'Returned to preparer'} ${fx.entry.id}${comment ? `: “${comment}”` : ''}` });
          });
          track(id, 'approval_workflow_decided', 'approvals', { workflow: 'approval', decision, proofPoint: 'controls' });
          if (decision === 'approved') finishActivation(id, 'approvals');
          reprioritize(id);
          get().announce(decision === 'approved' ? 'Entry approved and posted' : 'Decision recorded. Entry not posted.');
        },

        inviteStakeholder: (p, source = 'invite') => {
          const id = active();
          mut(id, (d) => { d.stakeholders.push({ ...p, id: uid('sh'), status: 'invited', invitedAt: Date.now() }); });
          track(id, 'stakeholder_invited', source, { role: p.role, stakeholderCount: cur().stakeholders.length });
          reprioritize(id);
          get().announce(`Invitation prepared for ${p.name} (simulated)`);
        },
        requestAssistance: (topic, context, source = 'help') => {
          const id = active();
          mut(id, (d) => { d.assistance.push({ id: uid('as'), topic, context, createdAt: Date.now(), status: 'submitted' }); });
          track(id, 'specialist_assistance_requested', source, { topic });
          reprioritize(id);
          get().announce('Assistance request submitted (simulated)');
        },
        trackHelp: (kind, helpId, source) => track(active(), kind === 'viewed' ? 'contextual_help_viewed' : 'contextual_help_accepted', source, { helpId }),
        requestSalesMeeting: (p) => {
          const id = active();
          mut(id, (d) => { d.salesRequest = { status: 'requested', topic: p.topic, keyQuestion: p.keyQuestion, preferredWindow: p.preferredWindow, requestedAt: Date.now() }; });
          track(id, 'sales_intent_declared', 'next-steps', { topic: p.topic });
          track(id, 'sales_meeting_requested', 'next-steps', { topic: p.topic, activation: activationStatus(cur()) });
          reprioritize(id);
        },
        saveAndContinue: () => track(active(), 'evaluation_resumed', 'next-steps', { action: 'save_and_continue' }),

        setLifecycleFlags: (id, patch) => mut(id, (d) => { d.lifecycle = { ...d.lifecycle, ...patch }; }),
        runJourney: (id, journeyId) => {
          const st = get();
          const s = st.scenarios[id];
          const ctx = buildLifecycleContext(id, s, st.events);
          const msg = evaluateJourney(journeyId, ctx, simulatedNow(s));
          mut(id, (d) => { d.lifecycle.messages = [msg, ...d.lifecycle.messages].slice(0, 30); });
          if (msg.deliveryStatus === 'queued_simulated') track(id, 'lifecycle_message_queued', 'engagement-journeys', { journey: journeyId, channel: msg.channel, class: msg.communicationClass });
          else track(id, 'lifecycle_message_suppressed', 'engagement-journeys', { journey: journeyId, reason: msg.deliveryStatus === 'suppressed' ? msg.suppressionReasons[0] : 'trigger_not_met' });
          return msg;
        },
        previewMessage: (id, journeyId) => track(id, 'lifecycle_message_previewed', 'engagement-journeys', { journey: journeyId }),

        setDisposition: (accountId, status) => {
          const sid = scenarioByAccount(accountId);
          const disp: Disposition = { ...(sid && isProspect(sid) ? get().scenarios[sid].disposition : get().fixtureDispositions[accountId] ?? { status: 'open' }), status, updatedAt: Date.now() };
          if (sid && isProspect(sid)) {
            mut(sid, (d) => { d.disposition = disp; });
            track(sid, status === 'sales_accepted' ? 'sales_opportunity_accepted' : 'sales_opportunity_rejected', 'sales-signals', { decision: status });
          } else set((st) => ({ fixtureDispositions: { ...st.fixtureDispositions, [accountId]: disp } }));
        },
        assignFollowUp: (accountId, followUp) => {
          const sid = scenarioByAccount(accountId);
          if (sid && isProspect(sid)) {
            mut(sid, (d) => { d.disposition = { ...d.disposition, followUp, updatedAt: Date.now() }; });
            track(sid, 'sales_followup_assigned', 'sales-signals', { topic: followUp.note.slice(0, 60) });
          } else set((st) => ({ fixtureDispositions: { ...st.fixtureDispositions, [accountId]: { ...(st.fixtureDispositions[accountId] ?? { status: 'open' }), followUp, updatedAt: Date.now() } } }));
        },
        markMeetingScheduled: (id) => {
          mut(id, (d) => { d.salesRequest = { ...d.salesRequest, status: 'scheduled', topic: d.salesRequest.topic ?? 'Evaluation review' }; });
          track(id, 'sales_meeting_scheduled', 'sales-signals', { topic: get().scenarios[id].salesRequest.topic ?? '' });
          reprioritize(id);
        },
        simulateAccountEvent: (id, kind) => {
          const fx = SCENARIOS[id];
          switch (kind) {
            case 'declare_near_term':
              mut(id, (d) => { d.profile.timeline = 'within_30'; d.started = true; d.startedAt ??= Date.now(); });
              track(id, 'qualification_updated', 'sales-simulator', { field: 'timeline', timeline: 'within_30' });
              break;
            case 'complete_reconciliation': {
              // Walk the same steps a prospect would, so state stays coherent.
              mut(id, (d) => {
                d.started = true; d.startedAt ??= Date.now(); d.profileConfirmed = true;
                if (!d.path) d.path = fx.recommendedPath;
                if (d.path === 'own_data' && d.migration.stage !== 'ready') d.migration = { stage: 'ready', requestedAt: Date.now(), completedAt: Date.now(), lastSyncAt: Date.now() };
                if (d.reconciliation.status === 'not_started' || d.reconciliation.decision === 'rejected') d.reconciliation = { status: 'in_review', exceptionReviewed: true, sourceInspected: true, entryReviewed: true, decision: 'none' };
              });
              track(id, 'accounting_workflow_started', 'sales-simulator', { workflow: 'reconciliation' });
              approveFor(id, 'sales-simulator');
              break;
            }
            case 'invite_cfo':
              mut(id, (d) => { d.started = true; d.startedAt ??= Date.now(); d.stakeholders.push({ id: uid('sh'), name: 'CFO (simulated)', email: 'cfo@company.example', role: 'CFO', status: 'invited', invitedAt: Date.now() }); });
              track(id, 'stakeholder_invited', 'sales-simulator', { role: 'CFO', stakeholderCount: get().scenarios[id].stakeholders.length });
              break;
            case 'raise_blocker':
              mut(id, (d) => { d.started = true; d.startedAt ??= Date.now(); d.blocker = { ...fx.blockerTemplate }; });
              track(id, 'evaluation_blocker_detected', 'sales-simulator', { milestone: fx.blockerTemplate.relatedMilestone });
              break;
            case 'request_meeting':
              mut(id, (d) => { d.started = true; d.startedAt ??= Date.now(); d.salesRequest = { status: 'requested', topic: 'Technical consultation', requestedAt: Date.now(), keyQuestion: 'Implementation timeline' }; });
              track(id, 'sales_intent_declared', 'sales-simulator', { topic: 'Technical consultation' });
              track(id, 'sales_meeting_requested', 'sales-simulator', { topic: 'Technical consultation' });
              break;
            case 'go_inactive':
              get().simulateInactivity(72, id);
              return;
          }
          reprioritize(id);
        },

        viewReferralPrompt: () => {
          const id = active();
          if (referralEligibility(cur().customer).eligible) track(id, 'referral_prompt_viewed', 'referral', {});
        },
        copyReferralLink: () => {
          const id = active();
          if (!referralEligibility(cur().customer).eligible) return;
          track(id, 'referral_link_copied', 'referral', {});
          get().announce('Referral link copied');
        },
        prepareReferralInvite: (p) => {
          const id = active();
          if (!referralEligibility(cur().customer).eligible) return;
          mut(id, (d) => { d.referrals.unshift({ id: uid('ref'), ...p, status: 'prepared', createdAt: Date.now() }); });
          track(id, 'referral_invitation_prepared', 'referral', {});
          get().announce('Referral invitation prepared (preview only, not sent)');
        },
      };

      function checkConsolidation(id: ScenarioId) {
        const s = get().scenarios[id];
        const c = s.consolidation;
        const n = SCENARIOS[id].consolidation.entities.length;
        const needed = Math.min(2, n);
        const complete = c.consolidatedViewed && (n === 1 || c.eliminationsInspected) && c.entitiesViewed.length >= needed;
        if (complete && !c.completed) {
          mut(id, (d) => { d.consolidation.completed = true; });
          track(id, 'consolidation_reviewed', 'reporting', { workflow: 'consolidation', proofPoint: 'consolidation', entityCount: n });
          reprioritize(id);
        }
      }
    },
    {
      name: 'dualentry-evaluation-demo-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeScenario: s.activeScenario, scenarios: s.scenarios, events: s.events, fixtureDispositions: s.fixtureDispositions }),
      version: 1,
    },
  ),
);

/** Convenience selector for the active scenario's state. */
export const useActive = () => useDemoStore((s) => s.scenarios[s.activeScenario]);
export const useActiveId = () => useDemoStore((s) => s.activeScenario);
export { SCENARIOS };
