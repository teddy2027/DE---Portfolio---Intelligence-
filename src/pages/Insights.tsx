import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FlaskConical, LineChart, Target, ShieldAlert } from 'lucide-react';
import { Badge, Card, CardHeader, PageHeader, SimTag } from '../components/common/ui';
import { useDemoStore } from '../store/useDemoStore';
import { PROSPECT_SCENARIOS } from '../data/scenarios';
import { liveSnapshot, fixtureSnapshots } from '../lib/qualification/snapshots';
import { qualify } from '../lib/qualification/model';
import { PRIORITY_LABEL, PRIORITY_ORDER } from '../lib/labels';

// Validated single-series mark color (passes chroma + contrast on light surface). One hue, no legend needed.
const MARK = '#008C83';
const GRID = '#E3E6E8';
const AXIS = '#5B6673';

// ILLUSTRATIVE numbers only. Not DualEntry data, not measured results.
const FUNNEL = [
  { stage: 'Qualified evaluation started', n: 200 },
  { stage: 'Data ready or sample opened', n: 156 },
  { stage: 'First workflow started', n: 112 },
  { stage: 'Verified activation', n: 68 },
  { stage: 'Sales-accepted opportunity', n: 31 },
];
const ACTIVATION_BY_PERSONA = [
  { persona: 'QuickBooks graduates', rate: 41 },
  { persona: 'Legacy ERP replacements', rate: 33 },
  { persona: 'Startups / first ERP', rate: 18 },
];
const STALL_REASONS = [
  { reason: 'Unresolved migration exception', n: 24 },
  { reason: 'Waiting on decision maker', n: 17 },
  { reason: 'Approval / controls parity unclear', n: 12 },
  { reason: 'No clear first workflow', n: 9 },
  { reason: 'Implementation timing concerns', n: 7 },
];
const JOURNEY_PERF = [
  { j: 'Data ready, not validated', queued: 46, suppressed: 19, metric: 'Validation start ≤48h', val: '58%' },
  { j: 'Unresolved reconciliation exception', queued: 38, suppressed: 22, metric: 'Exception resolved ≤7d', val: '64%' },
  { j: 'Qualified evaluation stalled', queued: 29, suppressed: 41, metric: 'Recovered ≤7d', val: '31%' },
  { j: 'First value achieved', queued: 52, suppressed: 16, metric: '→ Sales-accepted', val: '44%' },
];

function TipBox({ active, payload, label, unit = '' }: { active?: boolean; payload?: { value: number }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-pop"><div className="font-medium text-ink">{label}</div><div className="text-ink-2 num mt-0.5">{payload[0].value}{unit}</div></div>;
}

function HBar({ data, k, cat, unit = '', height, label }: { data: Record<string, string | number>[]; k: string; cat: string; unit?: string; height: number; label: string }) {
  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 8 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} unit={unit} />
          <YAxis type="category" dataKey={cat} width={190} tick={{ fill: '#36404B', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#F1F8F7' }} content={<TipBox unit={unit} />} />
          <Bar dataKey={k} fill={MARK} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            <LabelList dataKey={k} position="right" formatter={(v: number) => `${v}${unit}`} style={{ fill: '#36404B', fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Insights() {
  const st = useDemoStore();
  const live = useMemo(() => {
    const now = Date.now();
    const snaps = [...PROSPECT_SCENARIOS.map((id) => liveSnapshot(id, st.scenarios[id], st.events, now)), ...fixtureSnapshots(now)];
    return snaps.map((s) => ({ name: s.account.name, q: qualify(s, now) }));
  }, [st.scenarios, st.events]);
  const dist = PRIORITY_ORDER.map((p) => ({ p: PRIORITY_LABEL[p], n: live.filter((x) => x.q.priority === p).length }));

  return (
    <div className="anim-fade">
      <PageHeader eyebrow={<><Badge tone="neutral">Internal</Badge><SimTag>Illustrative metrics · not DualEntry data</SimTag></>}
        title={<span className="flex items-center gap-2"><LineChart className="h-5 w-5 text-teal-700" aria-hidden />Growth Insights</span>}
        subtitle="How we would measure whether guided evaluation helps the right prospects reach a credible proof point. Every number on this page is illustrative except the live account distribution." />

      <Card className="mb-4 p-5">
        <div className="flex items-center gap-2 text-teal-700"><Target className="h-4 w-4" aria-hidden /><span className="label text-teal-700">North Star</span></div>
        <p className="mt-1 text-[16px] font-semibold">Monthly Sales-accepted qualified opportunities originating from website or product evaluation</p>
        <div className="mt-4 grid md:grid-cols-3 gap-4 text-[13px]">
          <div><div className="label mb-1">Leading metrics</div><ul className="text-ink-2 space-y-0.5"><li>Qualified evaluation start rate</li><li>Verified activation rate</li><li>Median time to first value</li><li>Activated → Sales-accepted conversion</li><li>Qualified evaluation recovery rate</li></ul></div>
          <div><div className="label mb-1">Secondary</div><ul className="text-ink-2 space-y-0.5"><li>Product-qualified accounts</li><li>Sales response time</li><li>High-priority acceptance rate</li><li>Multi-stakeholder participation</li><li>Referred qualified leads and opportunities</li></ul></div>
          <div><div className="label mb-1 flex items-center gap-1"><ShieldAlert className="h-3 w-3" aria-hidden />Guardrails</div><ul className="text-ink-2 space-y-0.5"><li>Sales acceptance quality</li><li>Reconciliation and exception-resolution correctness</li><li>Support and CPA team time</li><li>Unwanted lifecycle communications</li><li>False-positive high-intent signals</li></ul></div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Evaluation funnel" subtitle="Accounts per stage, one cohort (illustrative)" right={<SimTag>Illustrative</SimTag>} />
          <div className="px-3 pb-4"><HBar data={FUNNEL} k="n" cat="stage" height={210} label="Illustrative funnel: 200 started, 156 data ready, 112 workflow started, 68 verified activation, 31 Sales-accepted" /></div>
          <div className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted num">
            {FUNNEL.slice(1).map((f, i) => <span key={f.stage}>{FUNNEL[i].stage.split(' ')[0]} → {f.stage.split(' ')[0]}: {Math.round((f.n / FUNNEL[i].n) * 100)}%</span>)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Verified activation rate by persona" subtitle="Share of qualified evaluations reaching verified activation (illustrative)" right={<SimTag>Illustrative</SimTag>} />
          <div className="px-3 pb-4"><HBar data={ACTIVATION_BY_PERSONA} k="rate" cat="persona" unit="%" height={150} label="Illustrative activation rates: QuickBooks 41%, legacy ERP 33%, startups 18%" /></div>
          <p className="px-5 pb-4 text-xs text-muted">Startups are expected to activate less on own data: most should stay on the sample path until they have a reason to move.</p>
        </Card>
        <Card>
          <CardHeader title="Why evaluations stall" subtitle="Stalled qualified evaluations by primary reason (illustrative)" right={<SimTag>Illustrative</SimTag>} />
          <div className="px-3 pb-4"><HBar data={STALL_REASONS} k="n" cat="reason" height={200} label="Illustrative stall reasons led by unresolved migration exceptions" /></div>
        </Card>
        <Card>
          <CardHeader title="Priority distribution, live accounts" subtitle="Computed from the demo’s current state" right={<Badge tone="info">Live demo data</Badge>} />
          <div className="px-3 pb-4"><HBar data={dist} k="n" cat="p" height={190} label={`Live priority distribution: ${dist.map((d) => `${d.p} ${d.n}`).join(', ')}`} /></div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Lifecycle journey performance" subtitle="Queued vs suppressed, and each journey’s outcome metric (illustrative)" right={<SimTag>Illustrative</SimTag>} />
        <div className="overflow-x-auto border-t border-line">
          <table className="table-base">
            <thead><tr><th>Journey</th><th className="text-right">Queued</th><th className="text-right">Suppressed</th><th>Outcome metric</th><th className="text-right">Value</th></tr></thead>
            <tbody>{JOURNEY_PERF.map((r) => <tr key={r.j}><td className="font-medium">{r.j}</td><td className="text-right num">{r.queued}</td><td className="text-right num">{r.suppressed}</td><td className="text-ink-2">{r.metric}</td><td className="text-right num">{r.val}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-muted border-t border-line">A high suppression count on the stalled journey is a feature: it means reps and meetings already cover those accounts.</p>
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-teal-700" aria-hidden /><h2 className="text-[15px] font-semibold">Proposed experiment</h2><Badge tone="neutral">Not yet run</Badge></div>
        <div className="mt-3 grid md:grid-cols-2 gap-4 text-[13px]">
          <div className="rounded-lg border border-line p-3"><div className="label">Control</div><p className="mt-1 text-ink-2">Generic post-migration sandbox landing experience.</p></div>
          <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3"><div className="label">Treatment</div><p className="mt-1 text-ink-2">Personalized goal-based evaluation hub with a recommended first workflow and contextual help.</p></div>
        </div>
        <dl className="mt-4 grid md:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
          <div><dt className="label">Hypothesis</dt><dd className="text-ink-2 mt-0.5">A guided evaluation improves verified activation and reduces time to first value for qualified prospects.</dd></div>
          <div><dt className="label">Unit and population</dt><dd className="text-ink-2 mt-0.5">Account-level randomization of qualified, own-data evaluations once sandbox data is ready.</dd></div>
          <div><dt className="label">Primary metric</dt><dd className="text-ink-2 mt-0.5">Verified activation rate within 14 days of data ready.</dd></div>
          <div><dt className="label">Secondary</dt><dd className="text-ink-2 mt-0.5">Median time to first value.</dd></div>
          <div><dt className="label">Guardrails</dt><dd className="text-ink-2 mt-0.5">Accounting validation quality, support/CPA load, downstream opportunity acceptance.</dd></div>
          <div><dt className="label">Result</dt><dd className="text-ink-2 mt-0.5">None. No uplift is claimed. Sample size depends on DualEntry’s evaluation volume, which is not public.</dd></div>
        </dl>
      </Card>
    </div>
  );
}
