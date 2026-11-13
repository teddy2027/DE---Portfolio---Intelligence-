import { useState } from 'react';
import clsx from 'clsx';
import { Ban, CheckCircle2, Clock3, Eye, Inbox, Mail, Megaphone, MonitorSmartphone, Play, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, PageHeader, SimTag } from '../components/common/ui';
import { Dialog } from '../components/common/Dialog';
import { useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { PROSPECT_SCENARIOS } from '../data/scenarios';
import { JOURNEYS, evaluateJourney, journeyById } from '../lib/lifecycle/engine';
import { buildLifecycleContext, simulatedNow } from '../lib/lifecycle/context';
import { ACTIVATION_LABEL } from '../lib/labels';
import { shortDateTime } from '../lib/format';
import { useNow } from '../hooks/useNow';
import type { JourneyId, LifecycleMessage, ProspectScenarioId } from '../types';

function StatusBadge({ m }: { m: LifecycleMessage }) {
  if (m.deliveryStatus === 'queued_simulated') return <Badge tone="positive"><CheckCircle2 className="h-3 w-3" aria-hidden />Would queue</Badge>;
  if (m.deliveryStatus === 'suppressed') return <Badge tone="warning"><Ban className="h-3 w-3" aria-hidden />Suppressed</Badge>;
  return <Badge tone="neutral"><XCircle className="h-3 w-3" aria-hidden />Not triggered</Badge>;
}

function MessagePreview({ m }: { m: LifecycleMessage }) {
  const j = journeyById(m.journeyId);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge m={m} />
        <Badge tone={m.channel === 'email' ? 'info' : 'teal'}>{m.channel === 'email' ? <Mail className="h-3 w-3" aria-hidden /> : <MonitorSmartphone className="h-3 w-3" aria-hidden />}{m.channel === 'email' ? 'Email' : 'In-product'}</Badge>
        <Badge tone="neutral">{m.communicationClass === 'marketing' ? 'Marketing (consent required)' : 'Product / service'}</Badge>
        <SimTag>Never sent</SimTag>
      </div>
      <div className="rounded-xl border border-line overflow-hidden">
        <div className="bg-canvas px-4 py-2 border-b border-line text-xs text-muted">{m.channel === 'email' ? 'Subject' : 'In-product card'}</div>
        <div className="px-4 py-3">
          <div className="font-semibold text-ink">{m.subject}</div>
          <p className="mt-2 text-ink-2 leading-6">{m.body}</p>
          <span className="mt-3 inline-flex rounded-lg bg-teal-700 px-3 py-1.5 text-[13px] font-medium text-white">{m.cta}</span>
        </div>
      </div>
      <div>
        <h3 className="label mb-1">Why this decision</h3>
        <p className="text-ink-2">{m.selectionReason}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <h3 className="label mb-1">Eligibility</h3>
          <ul className="space-y-1 text-[13px]">{m.eligibility.map((e) => <li key={e.rule} className="flex gap-1.5">{e.pass ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-positive" aria-label="Pass" /> : <XCircle className="h-3.5 w-3.5 mt-0.5 text-danger" aria-label="Fail" />}{e.rule}</li>)}</ul>
        </div>
        <div>
          <h3 className="label mb-1">Suppression rules checked</h3>
          <ul className="space-y-1 text-[13px] text-ink-2">{j.suppressions.map((r) => <li key={r} className="flex gap-1.5"><Ban className={clsx('h-3.5 w-3.5 mt-0.5', m.suppressionReasons.length && m.suppressionReasons.some((x) => x.toLowerCase().includes(r.split(' ')[0].toLowerCase())) ? 'text-warning' : 'text-subtle')} aria-hidden />{r}</li>)}</ul>
        </div>
      </div>
      {m.suppressionReasons.length > 0 && (
        <div className="rounded-lg bg-warning-bg border border-warning-line px-3 py-2 text-[13px] text-warning"><b>Suppressed because:</b> {m.suppressionReasons.join(' ')}</div>
      )}
      <p className="text-xs text-muted">Trigger: <code>{m.trigger}</code></p>
    </div>
  );
}

export default function Journeys() {
  const st = useDemoStore();
  const now = useNow(5000);
  const defaultId: ProspectScenarioId = st.activeScenario === 'customer' ? 'quickbooks' : (st.activeScenario as ProspectScenarioId);
  const [acct, setAcct] = useState<ProspectScenarioId>(defaultId);
  const [result, setResult] = useState<LifecycleMessage | null>(null);
  const s = st.scenarios[acct];
  const fx = SCENARIOS[acct];
  const ctx = buildLifecycleContext(acct, s, st.events, now);
  const simulate = (j: JourneyId) => setResult(st.runJourney(acct, j));
  const preview = (j: JourneyId) => { st.previewMessage(acct, j); setResult(evaluateJourney(j, ctx, simulatedNow(s, now))); };

  const facts: [string, string, boolean?][] = [
    ['Evaluation path', s.path === 'own_data' ? 'Own data' : s.path === 'sample' ? 'Sample' : 'Not chosen'],
    ['Sandbox data ready', ctx.migrationReady ? 'Yes' : 'No', ctx.migrationReady],
    ['Validation started', ctx.validationStarted ? 'Yes' : 'No', ctx.validationStarted],
    ['Reconciliation exception open', ctx.reconExceptionOpen ? 'Yes' : 'No'],
    ['Activation', ACTIVATION_LABEL[ctx.activation]],
    ['Hours since meaningful activity', `${Math.floor(ctx.hoursSinceMeaningfulActivity)}h${s.lifecycle.clockOffsetHours ? ` (+${s.lifecycle.clockOffsetHours}h simulated)` : ''}`],
    ['Meeting scheduled / requested', ctx.meetingScheduled ? 'Scheduled' : ctx.salesRequested ? 'Requested' : 'No'],
    ['Qualified (fit or intent)', ctx.qualified ? 'Yes' : 'No', ctx.qualified],
    ['Marketing email consent', ctx.marketingOptIn ? 'Opted in' : 'Opted out', ctx.marketingOptIn],
    ['Marketing email in last 72h', ctx.marketingSentWithinCap ? 'Yes (capped)' : 'No'],
  ];

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<><Badge tone="neutral">Internal</Badge><SimTag>No emails are ever sent from this prototype</SimTag></>}
        title={<span className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-teal-700" aria-hidden />Engagement Journeys</span>}
        subtitle="Event-based lifecycle messages that help at a moment of friction, and stay silent when they would be redundant." />

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Account">
        <span className="text-[13px] text-muted mr-1">Account</span>
        {PROSPECT_SCENARIOS.map((id) => (
          <button key={id} aria-pressed={acct === id} onClick={() => setAcct(id)}
            className={clsx('rounded-lg border px-3 py-1.5 text-[13px] font-medium', acct === id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>
            {SCENARIOS[id].account.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 md:grid-cols-2 content-start">
          {JOURNEYS.map((j, i) => {
            const live = evaluateJourney(j.id, ctx, simulatedNow(s, now));
            return (
              <Card key={j.id} className="flex flex-col">
                <div className="px-5 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="label">Journey {i + 1}</div>
                    <StatusBadge m={live} />
                  </div>
                  <h2 className="mt-1 text-[15px] font-semibold">{j.name}</h2>
                  <code className="mt-2 block rounded-md bg-canvas border border-line px-2 py-1.5 text-[11.5px] text-ink-2">{j.trigger}</code>
                </div>
                <dl className="px-5 py-3 space-y-1.5 text-[13px] flex-1">
                  <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Eligible</dt><dd className="text-ink-2">{j.eligibility}</dd></div>
                  <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Channel</dt><dd className="text-ink-2">{j.channel === 'email' ? 'Email' : 'In-product'} · {j.communicationClass === 'marketing' ? 'marketing' : 'product/service'}</dd></div>
                  <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Suppress if</dt><dd className="text-ink-2">{j.suppressions.join('; ')}</dd></div>
                  <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Metric</dt><dd className="text-ink-2">{j.metric}</dd></div>
                </dl>
                <p className="mx-5 mb-3 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-2"><b>Right now:</b> {live.selectionReason}</p>
                <div className="flex gap-2 border-t border-line px-5 py-3">
                  <Button size="sm" variant="primary" icon={<Play className="h-3.5 w-3.5" aria-hidden />} onClick={() => simulate(j.id)}>Simulate trigger</Button>
                  <Button size="sm" variant="ghost" icon={<Eye className="h-3.5 w-3.5" aria-hidden />} onClick={() => preview(j.id)}>Preview message</Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Account state used by the rules" subtitle={`${fx.account.name} · read from the shared event model`} />
            <dl className="px-5 pb-4 space-y-1.5 text-[13px]">
              {facts.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="font-medium text-right">{v}</dd></div>)}
            </dl>
          </Card>
          <Card className="p-5 space-y-3">
            <h2 className="text-[15px] font-semibold">Demo controls</h2>
            <Button className="w-full" variant="secondary" icon={<Clock3 className="h-4 w-4" aria-hidden />} onClick={() => st.simulateInactivity(72, acct)}>Simulate 72 hours of inactivity</Button>
            {s.salesRequest.status !== 'scheduled' && <Button className="w-full" variant="secondary" onClick={() => st.markMeetingScheduled(acct)}>Mark a meeting as scheduled</Button>}
            <label className="flex items-center justify-between gap-3 text-[13px]">Marketing email consent
              <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={s.lifecycle.marketingOptIn} onChange={(e) => st.setLifecycleFlags(acct, { marketingOptIn: e.target.checked })} />
            </label>
            <label className="block text-[13px]">
              <span className="block mb-1">Rep has an active follow-up on</span>
              <select className="input" value={s.lifecycle.repFollowUpActiveOn ?? ''} onChange={(e) => st.setLifecycleFlags(acct, { repFollowUpActiveOn: (e.target.value || null) as JourneyId | null })}>
                <option value="">No active follow-up</option>
                {JOURNEYS.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </label>
          </Card>
          <Card>
            <CardHeader title="Message log" subtitle="Decisions from simulated triggers" />
            {s.lifecycle.messages.length ? (
              <ul className="px-3 pb-3 space-y-1">
                {s.lifecycle.messages.slice(0, 8).map((m) => (
                  <li key={m.id}><button onClick={() => setResult(m)} className="w-full rounded-lg px-2 py-2 text-left hover:bg-canvas">
                    <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium truncate">{journeyById(m.journeyId).name}</span><StatusBadge m={m} /></div>
                    <div className="text-xs text-muted">Simulated time {shortDateTime(m.createdAt)}</div>
                  </button></li>
                ))}
              </ul>
            ) : <div className="px-5 pb-5 text-[13px] text-muted flex items-center gap-2"><Inbox className="h-4 w-4" aria-hidden />No triggers simulated yet.</div>}
          </Card>
        </div>
      </div>

      <Dialog open={!!result} onClose={() => setResult(null)} size="lg" title={result ? journeyById(result.journeyId).name : ''} description={`${fx.account.name} · ${fx.user.name}`}
        footer={<Button variant="primary" onClick={() => setResult(null)}>Close</Button>}>
        {result && <MessagePreview m={result} />}
      </Dialog>
    </div>
  );
}
