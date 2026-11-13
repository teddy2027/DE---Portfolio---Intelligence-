import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Bot, CalendarCheck2, CheckCircle2, Clock3, Radar, Radio, TriangleAlert, UserPlus, Users, ThumbsDown, ThumbsUp, Zap } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Field, PageHeader, SimTag, type Tone } from '../components/common/ui';
import { Drawer } from '../components/common/Dialog';
import { useDemoStore, SCENARIOS, type SimulatedAccountEvent } from '../store/useDemoStore';
import { PROSPECT_SCENARIOS } from '../data/scenarios';
import { liveSnapshot, fixtureSnapshots } from '../lib/qualification/snapshots';
import { qualify } from '../lib/qualification/model';
import { ACTIVATION_LABEL, FIT_LABEL, INTENT_LABEL, PRIORITY_LABEL, PRIORITY_ORDER, shortSource, timelineLabel } from '../lib/labels';
import { describeEvent } from '../lib/analytics/describe';
import { timeAgo } from '../lib/format';
import { useNow } from '../hooks/useNow';
import type { AccountSnapshot, Disposition, Priority, ProspectScenarioId, QualificationResult } from '../types';

export const PRIORITY_TONE: Record<Priority, Tone> = { route_now: 'danger', high: 'teal', specialist: 'warning', monitor: 'info', nurture: 'neutral' };
const tierTone = (t: string): Tone => (t === 'high' ? 'teal' : t === 'moderate' || t === 'medium' ? 'info' : 'neutral');
const actTone = (a: string): Tone => (a === 'verified' ? 'positive' : a === 'sample_completed' ? 'teal' : a === 'in_progress' ? 'info' : 'neutral');

interface Row { snap: AccountSnapshot; q: QualificationResult; disposition: Disposition; scenario?: ProspectScenarioId }

const SIMS: { kind: SimulatedAccountEvent; label: string; icon: React.ElementType }[] = [
  { kind: 'declare_near_term', label: 'Declares 30-day timeline', icon: Clock3 },
  { kind: 'complete_reconciliation', label: 'Completes reconciliation', icon: CheckCircle2 },
  { kind: 'invite_cfo', label: 'Invites CFO', icon: Users },
  { kind: 'raise_blocker', label: 'Hits accounting blocker', icon: TriangleAlert },
  { kind: 'request_meeting', label: 'Requests Sales meeting', icon: CalendarCheck2 },
  { kind: 'go_inactive', label: 'Goes quiet for 72h', icon: Radio },
];

export default function SalesSignals() {
  const st = useDemoStore();
  const nav = useNavigate();
  const now = useNow(15000);
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [fu, setFu] = useState({ owner: 'Jordan Ellis', due: 'Within 1 business day', note: '' });

  const rows: Row[] = useMemo(() => {
    const live: Row[] = PROSPECT_SCENARIOS.map((id) => {
      const snap = liveSnapshot(id, st.scenarios[id], st.events, now);
      return { snap, q: qualify(snap, now), disposition: st.scenarios[id].disposition, scenario: id };
    });
    const fixed: Row[] = fixtureSnapshots(now).map((snap) => ({ snap, q: qualify(snap, now), disposition: st.fixtureDispositions[snap.account.id] ?? { status: 'open' } }));
    return [...live, ...fixed].sort((a, b) => PRIORITY_ORDER.indexOf(a.q.priority) - PRIORITY_ORDER.indexOf(b.q.priority));
  }, [st.scenarios, st.events, st.fixtureDispositions, now]);

  const shown = rows.filter((r) => filter === 'all' || r.q.priority === filter);
  const open = rows.find((r) => r.snap.account.id === openId);
  const counts = Object.fromEntries(PRIORITY_ORDER.map((p) => [p, rows.filter((r) => r.q.priority === p).length]));

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<><Badge tone="neutral">Internal</Badge><SimTag>Proposed growth-operations view · not a current DualEntry CRM</SimTag></>}
        title={<span className="flex items-center gap-2"><Radar className="h-5 w-5 text-teal-700" aria-hidden />Growth & Sales Signals</span>}
        subtitle="Which accounts are seriously evaluating, what they have proven, what is blocking them, and what conversation would help next. Live accounts update from the same events as the prospect experience." />

      <Card className="mb-4">
        <CardHeader title="How prioritization works" subtitle="Three dimensions scored separately. The first matching rule sets priority, and the rule is always shown." />
        <div className="grid md:grid-cols-3 gap-3 px-5">
          {[
            { t: 'Fit', d: 'Entities, currencies, and replacing a mid-market ERP or outgrowing a small-business tool.' },
            { t: 'Intent', d: 'Explicit Sales request, stated buying timeline, own-data sandbox, stakeholders involved.' },
            { t: 'Activation', d: 'A verified accounting proof point on own data. Sample completion is tracked separately.' },
          ].map((x) => <div key={x.t} className="rounded-lg border border-line p-3"><div className="text-[13.5px] font-semibold">{x.t}</div><p className="text-[13px] text-muted mt-0.5">{x.d}</p></div>)}
        </div>
        <ol className="px-5 py-4 grid md:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] text-ink-2">
          <li><b>R1</b> Explicit Sales request → route now, regardless of sandbox engagement</li>
          <li><b>R2</b> High fit + accounting blocker → specialist intervention</li>
          <li><b>R3</b> High fit + purchase within 90 days → high priority</li>
          <li><b>R4</b> High fit + verified activation + 2+ stakeholders → high priority</li>
          <li><b>R5</b> High fit, no timeline or proof point yet → monitor</li>
          <li><b>R6</b> Low intent + sample exploration → nurture, no Sales alert</li>
        </ol>
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by priority">
        {(['all', ...PRIORITY_ORDER] as const).map((p) => (
          <button key={p} onClick={() => setFilter(p)} aria-pressed={filter === p}
            className={clsx('rounded-lg border px-2.5 py-1.5 text-[13px] font-medium', filter === p ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>
            {p === 'all' ? `All (${rows.length})` : `${PRIORITY_LABEL[p]} (${counts[p]})`}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <caption className="sr-only">Prospect accounts by priority</caption>
            <thead>
              <tr>
                <th scope="col">Account</th><th scope="col">Priority</th><th scope="col">Fit</th><th scope="col">Intent</th><th scope="col">Activation</th>
                <th scope="col">Use case</th><th scope="col">Timeline</th><th scope="col">Evaluation</th><th scope="col">Last activity</th><th scope="col">Owner</th><th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ snap, q, disposition }) => (
                <tr key={snap.account.id} className="hover:bg-canvas/60 cursor-pointer" onClick={() => setOpenId(snap.account.id)}>
                  <td className="min-w-[200px]">
                    <div className="font-medium flex items-center gap-1.5">{snap.account.name}{snap.live && <Badge tone="info"><Zap className="h-3 w-3" aria-hidden />Live</Badge>}</div>
                    <div className="text-xs text-muted">{shortSource(snap.account.currentERP)} · {snap.account.entityCount} entit{snap.account.entityCount === 1 ? 'y' : 'ies'}</div>
                  </td>
                  <td><Badge tone={PRIORITY_TONE[q.priority]} dot>{PRIORITY_LABEL[q.priority]}</Badge>
                    {disposition.status !== 'open' && <div className="mt-1"><Badge tone={disposition.status === 'sales_accepted' ? 'positive' : 'neutral'}>{disposition.status === 'sales_accepted' ? 'Sales accepted' : 'Needs nurture'}</Badge></div>}</td>
                  <td><Badge tone={tierTone(q.fit)}>{FIT_LABEL[q.fit]}</Badge></td>
                  <td><Badge tone={tierTone(q.intent)}>{INTENT_LABEL[q.intent]}</Badge></td>
                  <td><Badge tone={actTone(q.activation)}>{ACTIVATION_LABEL[q.activation]}</Badge></td>
                  <td className="text-ink-2 min-w-[160px]">{snap.primaryUseCase}</td>
                  <td className="text-ink-2 whitespace-nowrap">{timelineLabel(snap.account.purchaseTimeline)}</td>
                  <td className="text-ink-2 whitespace-nowrap">{snap.evaluationState}</td>
                  <td className="text-muted whitespace-nowrap">{snap.lastMeaningfulActivity ? timeAgo(snap.lastMeaningfulActivity, now) : '—'}</td>
                  <td className="text-ink-2 whitespace-nowrap">{disposition.followUp?.owner ?? snap.account.assignedSalesOwner}</td>
                  <td><button className="rounded-md p-1 text-muted hover:text-ink hover:bg-canvas" aria-label={`Inspect ${snap.account.name}`} onClick={(e) => { e.stopPropagation(); setOpenId(snap.account.id); }}><ArrowRight className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={11} className="py-10 text-center text-muted">No accounts at this priority.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-muted">Live rows are driven by the three demo personas. Other rows are seeded fictional accounts. Thresholds are assumptions pending DualEntry win/loss data.</p>

      <Drawer open={!!open} onClose={() => setOpenId(null)} width="lg" title={open?.snap.account.name ?? ''}
        subtitle={open && <span className="flex flex-wrap items-center gap-1.5">{open.snap.account.industry} · {open.snap.account.currentERP} · {open.snap.account.entityCount} entities {open.snap.live && <Badge tone="info">Live demo account</Badge>}</span>}>
        {open && (
          <div className="px-5 py-4 space-y-5 text-sm">
            <section className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={PRIORITY_TONE[open.q.priority]} dot>{PRIORITY_LABEL[open.q.priority]}</Badge><code className="text-[11.5px] text-muted">{open.q.rule}</code></div>
              <h3 className="label mt-3 mb-1">Why this account is prioritized</h3>
              <p className="text-ink">{open.q.why}</p>
              <h3 className="label mt-3 mb-1">Recommended action</h3>
              <p className="text-ink font-medium">{open.q.recommendedAction}</p>
            </section>

            <section className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-line p-3"><div className="label">Fit</div><Badge tone={tierTone(open.q.fit)} className="mt-1">{FIT_LABEL[open.q.fit]}</Badge><ul className="mt-2 text-xs text-ink-2 space-y-0.5">{open.q.fitReasons.map((r) => <li key={r}>· {r}</li>)}</ul></div>
              <div className="rounded-lg border border-line p-3"><div className="label">Intent</div><Badge tone={tierTone(open.q.intent)} className="mt-1">{INTENT_LABEL[open.q.intent]}</Badge><ul className="mt-2 text-xs text-ink-2 space-y-0.5">{open.q.intentReasons.map((r) => <li key={r}>· {r}</li>)}</ul></div>
              <div className="rounded-lg border border-line p-3"><div className="label">Activation</div><Badge tone={actTone(open.q.activation)} className="mt-1">{ACTIVATION_LABEL[open.q.activation]}</Badge><ul className="mt-2 text-xs text-ink-2 space-y-0.5">{open.snap.completedProofPoints.length ? open.snap.completedProofPoints.map((r) => <li key={r}>· {r}</li>) : <li>· No proof point yet</li>}</ul></div>
            </section>

            {open.snap.blocker && <section className="rounded-lg bg-warning-bg border border-warning-line px-3 py-2.5 text-[13px] text-warning flex gap-2"><TriangleAlert className="h-4 w-4 shrink-0" aria-hidden /><span><b>Blocker:</b> {open.snap.blocker.title}. {open.snap.blocker.detail}</span></section>}

            <section>
              <h3 className="label mb-2">Signals</h3>
              <ul className="space-y-1.5">{open.q.signals.length ? open.q.signals.map((g) => <li key={g.id} className="flex gap-2 text-[13px]"><Bot className="h-3.5 w-3.5 mt-0.5 text-info shrink-0" aria-hidden /><code className="text-[12px]">{g.signalType}</code><span className="text-ink-2">{g.evidence}</span></li>) : <li className="text-muted text-[13px]">No signals yet.</li>}</ul>
            </section>

            <section>
              <h3 className="label mb-2">Recent events</h3>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {open.snap.recentEvents.length ? open.snap.recentEvents.map((e) => (
                  <li key={e.eventId} className="flex items-center gap-3 px-3 py-2 text-[13px]"><code className="text-[12px] text-ink">{e.eventName}</code><span className="flex-1 text-muted truncate">{describeEvent(e)}</span><span className="text-xs text-muted whitespace-nowrap">{timeAgo(e.timestamp, now)}</span></li>
                )) : <li className="px-3 py-3 text-muted text-[13px]">No events yet. Open this persona’s evaluation to generate some.</li>}
              </ul>
              <p className="mt-1.5 text-xs text-muted">Only account-level metadata. No transactions, balances or bank details reach this view.</p>
            </section>

            <section className="rounded-xl border border-line p-4 space-y-3">
              <h3 className="text-[14px] font-semibold">Disposition</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={open.disposition.status === 'sales_accepted' ? 'primary' : 'secondary'} icon={<ThumbsUp className="h-4 w-4" aria-hidden />} onClick={() => st.setDisposition(open.snap.account.id, 'sales_accepted')}>Mark Sales accepted</Button>
                <Button size="sm" variant={open.disposition.status === 'needs_nurture' ? 'primary' : 'secondary'} icon={<ThumbsDown className="h-4 w-4" aria-hidden />} onClick={() => st.setDisposition(open.snap.account.id, 'needs_nurture')}>Mark needs nurture</Button>
                {open.scenario && open.snap.salesRequest.status === 'requested' && <Button size="sm" variant="secondary" icon={<CalendarCheck2 className="h-4 w-4" aria-hidden />} onClick={() => st.markMeetingScheduled(open.scenario!)}>Mark meeting scheduled</Button>}
              </div>
              {open.disposition.followUp ? (
                <p className="text-[13px] text-ink-2 rounded-lg bg-canvas px-3 py-2"><b>Follow-up:</b> {open.disposition.followUp.owner} · {open.disposition.followUp.due}{open.disposition.followUp.note ? ` · ${open.disposition.followUp.note}` : ''}</p>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Assign follow-up to" htmlFor="fu-owner">
                  <select id="fu-owner" className="input" value={fu.owner} onChange={(e) => setFu({ ...fu, owner: e.target.value })}>{['Jordan Ellis', 'Priya Raman', 'Marcus Webb', 'Solutions CPA team'].map((o) => <option key={o}>{o}</option>)}</select>
                </Field>
                <Field label="Due" htmlFor="fu-due">
                  <select id="fu-due" className="input" value={fu.due} onChange={(e) => setFu({ ...fu, due: e.target.value })}>{['Within 1 business day', 'This week', 'Next week'].map((o) => <option key={o}>{o}</option>)}</select>
                </Field>
              </div>
              <Field label="Note" htmlFor="fu-note"><input id="fu-note" className="input" value={fu.note} onChange={(e) => setFu({ ...fu, note: e.target.value })} placeholder={open.q.recommendedAction} /></Field>
              <Button size="sm" variant="secondary" icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => { st.assignFollowUp(open.snap.account.id, { ...fu, note: fu.note || open.q.recommendedAction }); setFu({ ...fu, note: '' }); }}>Assign follow-up</Button>
            </section>

            {open.scenario && (
              <section className="rounded-xl border border-dashed border-line-strong p-4">
                <h3 className="text-[14px] font-semibold">Simulate prospect activity</h3>
                <p className="text-[13px] text-muted mt-0.5">Applies the same state changes the prospect’s actions would, then re-runs prioritization.</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {SIMS.map((x) => (
                    <Button key={x.kind} size="sm" variant="secondary" className="justify-start" icon={<x.icon className="h-4 w-4" aria-hidden />} onClick={() => st.simulateAccountEvent(open.scenario!, x.kind)}>{x.label}</Button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { st.switchScenario(open.scenario!); nav(st.scenarios[open.scenario!].started ? '/evaluation' : '/'); }} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Open {SCENARIOS[open.scenario].user.firstName}’s evaluation</Button>
                  <Button size="sm" variant="ghost" onClick={() => st.resetScenario(open.scenario!)}>Reset this account</Button>
                </div>
              </section>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
