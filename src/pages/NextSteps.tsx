import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, CalendarClock, CheckCircle2, Send, Users } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Field, PageHeader, SimTag } from '../components/common/ui';
import { InviteDialog } from '../components/evaluation/InviteDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { activationStatus, proofPoints, buildMilestones } from '../lib/evaluation/engine';
import { ACTIVATION_LABEL, goalLabel, shortSource, timelineLabel } from '../lib/labels';
import { liveSnapshot } from '../lib/qualification/snapshots';
import { qualify } from '../lib/qualification/model';
import type { ProspectScenarioId } from '../types';

const TOPICS = ['Technical migration review', 'Implementation timeline', 'Controls and audit review', 'Consolidation deep dive', 'Pricing and packaging', 'General questions'];
const DEFAULTS: Record<ProspectScenarioId, { topic: string; question: string }> = {
  quickbooks: { topic: 'Consolidation deep dive', question: 'How consolidation and FX translation will work across our three entities, and what the cut-over from QuickBooks looks like.' },
  netsuite: { topic: 'Technical migration review', question: 'Implementation timeline, and how our NetSuite approval rules and custom segments carry over.' },
  startup: { topic: 'Implementation timeline', question: 'What setting up DualEntry requires for a single-entity company coming from spreadsheets.' },
};

export default function NextSteps() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const st = useDemoStore();
  const nav = useNavigate();
  const d = DEFAULTS[(id === 'customer' ? 'quickbooks' : id) as ProspectScenarioId];
  const [topic, setTopic] = useState(s.salesRequest.topic ?? d.topic);
  const [question, setQuestion] = useState(s.salesRequest.keyQuestion ?? d.question);
  const [windowPref, setWindowPref] = useState(s.salesRequest.preferredWindow ?? 'Next week · afternoons');
  const [invite, setInvite] = useState(false);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  if (!s.profileConfirmed) return <Navigate to="/evaluation/profile" replace />;

  const fx = SCENARIOS[id];
  const activation = activationStatus(s);
  const proofs = proofPoints(s);
  const remaining = buildMilestones(s).filter((m) => m.state !== 'done' && m.id !== 'goals');
  const ready = activation === 'verified' || s.profile.timeline === 'within_30' || s.profile.timeline === '1_3_months';
  const submitted = s.salesRequest.status !== 'none';
  const q = qualify(liveSnapshot(id as ProspectScenarioId, s, st.events, Date.now()), Date.now());

  // Structured, account-level context passed to the CRM. No transactions, bank details or statement values.
  const crm = {
    account: fx.account.name,
    contact: { name: fx.user.name, role: fx.user.role },
    currentSystem: s.profile.currentERP,
    entityCount: s.profile.entityCount,
    currencies: s.profile.currencies.length,
    priority: goalLabel(s.profile.goal),
    buyingTimeline: timelineLabel(s.profile.timeline),
    evaluationPath: s.path === 'own_data' ? 'Own data (assisted sandbox)' : s.path === 'sample' ? 'Sample data' : 'Not chosen',
    activation: ACTIVATION_LABEL[activation],
    evaluationCompleted: proofs,
    outstanding: remaining.map((m) => m.title),
    stakeholders: s.stakeholders.map((x) => x.role),
    keyQuestion: question,
    requestedNextStep: topic,
    preferredWindow: windowPref,
    fitTier: q.fit, intentTier: q.intent,
  };

  return (
    <div className="max-w-5xl anim-fade">
      <PageHeader eyebrow={<button onClick={() => nav('/evaluation')} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Your evaluation</button>}
        title={submitted ? 'Your request is with DualEntry.' : ready ? 'Ready to explore next steps?' : 'Have questions? Talk to a DualEntry expert.'}
        subtitle={submitted ? 'Keep evaluating in the meantime. Your progress is shared with your DualEntry contact, not your raw data.' : 'We’ve summarized your evaluation so you don’t have to repeat yourself. Edit anything before sending.'} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Evaluation summary" subtitle="Prefilled from your evaluation" right={<SimTag>Simulated request</SimTag>} />
          <dl className="border-t border-line divide-y divide-line text-sm">
            {[
              ['Current accounting system', `${s.profile.currentERP} · ${s.profile.entityCount} entit${s.profile.entityCount === 1 ? 'y' : 'ies'}`],
              ['Priority', goalLabel(s.profile.goal)],
              ['Evaluation completed', proofs.length ? proofs.join(' · ') : 'No workflow validated yet'],
              ['Still to evaluate', remaining.length ? remaining.map((m) => m.title).join(' · ') : 'Nothing outstanding'],
            ].map(([k, v]) => <div key={k} className="grid sm:grid-cols-[200px_1fr] gap-1 px-5 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-ink">{v}</dd></div>)}
          </dl>
          {!submitted ? (
            <div className="border-t border-line px-5 py-5 space-y-4">
              <Field label="Key question" htmlFor="ns-q"><textarea id="ns-q" rows={2} className="input" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Requested next step" htmlFor="ns-topic">
                  <select id="ns-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Preferred timing" htmlFor="ns-win" hint="A preference, not a calendar booking.">
                  <select id="ns-win" className="input" value={windowPref} onChange={(e) => setWindowPref(e.target.value)}>
                    {['This week · mornings', 'This week · afternoons', 'Next week · mornings', 'Next week · afternoons', 'In 2–3 weeks'].map((w) => <option key={w}>{w}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button variant="primary" icon={<Send className="h-4 w-4" aria-hidden />} onClick={() => st.requestSalesMeeting({ topic, keyQuestion: question, preferredWindow: windowPref })}>Request consultation</Button>
                <Button variant="secondary" icon={<Users className="h-4 w-4" aria-hidden />} onClick={() => setInvite(true)}>Invite another stakeholder</Button>
                <Button variant="ghost" onClick={() => { st.saveAndContinue(); nav('/evaluation'); }}>Save and continue evaluating</Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-line px-5 py-5">
              <div role="status" className="flex gap-3 rounded-xl bg-positive-bg border border-positive-line p-4 text-sm">
                <CheckCircle2 className="h-5 w-5 text-positive shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">Consultation requested: {s.salesRequest.topic}.</p>
                  <p className="text-ink-2 mt-1">Preferred timing: {s.salesRequest.preferredWindow ?? '—'}. {fx.account.assignedSalesOwner} would confirm a time. No calendar event was created and no email was sent in this prototype.</p>
                  {s.salesRequest.status === 'scheduled' && <Badge tone="positive" className="mt-2"><CalendarClock className="h-3 w-3" aria-hidden />Meeting marked as scheduled by DualEntry (simulated)</Badge>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => nav('/evaluation')}>Continue evaluating</Button>
                <Button variant="secondary" icon={<Users className="h-4 w-4" aria-hidden />} onClick={() => setInvite(true)}>Invite another stakeholder</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="What DualEntry receives" subtitle="Account-level context for your conversation" />
          <pre className="mx-5 rounded-lg bg-canvas border border-line p-3 text-[11.5px] leading-4 overflow-x-auto max-h-80">{JSON.stringify(crm, null, 2)}</pre>
          <div className="px-5 py-4 text-[13px]">
            <div className="label mb-1.5 flex items-center gap-1"><Ban className="h-3 w-3" aria-hidden />Never included</div>
            <ul className="text-ink-2 space-y-1 list-disc pl-4">
              <li>Individual ledger or bank transactions</li>
              <li>Bank account details</li>
              <li>Financial statement values or balances</li>
              <li>Migration exception amounts</li>
            </ul>
            <p className="mt-3 text-xs text-muted">Sent to the CRM as a simulated payload. Source: {shortSource(s.profile.currentERP)} evaluation, {fx.account.assignedSalesOwner} (owner).</p>
          </div>
        </Card>
      </div>
      <InviteDialog open={invite} onClose={() => setInvite(false)} source="next-steps" />
    </div>
  );
}
