import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, CircleDashed, FileText, Users } from 'lucide-react';
import { Badge, Button, Card, SimTag } from '../components/common/ui';
import { InviteDialog } from '../components/evaluation/InviteDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { activationStatus, buildMilestones, datasetName, reconFigures } from '../lib/evaluation/engine';
import { ACTIVATION_LABEL, timelineLabel } from '../lib/labels';
import { money, shortDateTime } from '../lib/format';
import type { ScenarioState } from '../store/state';

/** Persona- and intent-sensitive primary CTA after first value. */
export function postActivationCta(s: ScenarioState): { label: string; route: string; why: string } {
  const remaining = buildMilestones(s).filter((m) => m.state !== 'done' && m.id !== 'goals' && m.id !== 'stakeholder');
  const highIntent = s.profile.timeline === 'within_30' || s.profile.timeline === '1_3_months' || s.profile.timeline === '3_6_months';
  if (s.profile.currentERP === 'NetSuite' && highIntent && s.path === 'own_data')
    return { label: 'Review migration requirements with our team', route: '/evaluation/next-steps', why: 'You are replacing NetSuite with an active timeline. The next useful step is scoping migration and controls with a specialist.' };
  if (s.profile.entityCount > 1 && remaining.some((m) => m.id === 'consolidate'))
    return { label: 'Explore consolidated reporting', route: '/evaluation/reporting', why: `With ${s.profile.entityCount} entities, consolidation is the next workflow to validate.` };
  if (s.profile.timeline === 'later' || s.profile.timeline === 'undisclosed' || s.path === 'sample')
    return { label: 'Continue exploring your finance workflows', route: remaining[0]?.route ?? '/evaluation', why: 'There is no urgency here. Keep exploring at your own pace.' };
  if (remaining.length) return { label: `Continue: ${remaining[0].title}`, route: remaining[0].route, why: 'The next milestone in your evaluation plan.' };
  return { label: 'Review next steps with DualEntry', route: '/evaluation/next-steps', why: 'You have validated the workflows you set out to evaluate.' };
}

export default function Milestone() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const nav = useNavigate();
  const [invite, setInvite] = useState(false);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  if (s.reconciliation.status !== 'reconciled') return <Navigate to="/evaluation/reconciliation" replace />;
  const fx = SCENARIOS[id];
  const rec = reconFigures(s);
  const je = s.ledgerEntries.find((e) => e.id === fx.reconciliation.proposedEntry.id)!;
  const activation = activationStatus(s);
  const remaining = buildMilestones(s).filter((m) => m.state !== 'done' && m.id !== 'goals');
  const cta = postActivationCta(s);
  const sample = s.path === 'sample';

  return (
    <div className="max-w-4xl mx-auto anim-fade">
      <div className="text-center pt-2 sm:pt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive-bg border border-positive-line">
          <CheckCircle2 className="h-6 w-6 text-positive" aria-hidden />
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Badge tone={activation === 'verified' ? 'positive' : 'teal'} dot>{ACTIVATION_LABEL[activation]}</Badge>
          <SimTag>{sample ? 'Sample data' : 'Simulated migration data'}</SimTag>
        </div>
        <h1 className="mt-3 text-[26px] sm:text-[28px] font-semibold tracking-[-0.015em]">Your first reconciliation is complete.</h1>
        <p className="mt-2 text-[15px] text-ink-2 max-w-2xl mx-auto">You reviewed an accounting exception, approved the necessary adjustment, and validated the updated balance.</p>
        {sample && <p className="mt-2 text-[13px] text-muted max-w-xl mx-auto">This was sample data, so it counts as a completed sample evaluation. Verified activation happens on your own data.</p>}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">What you accomplished</h2>
          <ul className="mt-3 space-y-2 text-[13.5px] text-ink-2">
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-hidden />Inspected an unmatched bank line ({fx.reconciliation.bankOnly[0].reference})</li>
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-hidden />Reviewed an agent-prepared entry and its reasoning</li>
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-hidden />Approved {je.id}; posted {je.postedAt ? shortDateTime(je.postedAt) : ''}</li>
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-hidden />Ledger now equals bank at {money(rec.bankBalance)}</li>
          </ul>
          <h3 className="label mt-5 mb-2">Records involved</h3>
          <ul className="text-[13px] space-y-1 text-ink-2">
            <li className="flex gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 text-muted" aria-hidden />{fx.reconciliation.ledgerAccount} · {datasetName(s, fx.reconciliation.entity)}</li>
            <li className="flex gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 text-muted" aria-hidden />Journal entry {je.id} ({je.lines.length} lines)</li>
            <li className="flex gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 text-muted" aria-hidden />{rec.matchedCount} matched bank and ledger lines, {fx.reconciliation.period}</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">Validation checks</h2>
          <ul className="mt-3 space-y-2 text-[13.5px]">
            {[
              'Journal entry balanced (debits = credits)',
              `Approved by ${je.approvedBy}, not the preparer`,
              `Ledger ${money(rec.ledgerBalance)} = bank ${money(rec.bankBalance)}`,
              'No unmatched items remain',
              'Decision recorded in the audit trail',
            ].map((c) => <li key={c} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-hidden /><span className="num">{c}</span></li>)}
          </ul>
          <h3 className="label mt-5 mb-2">Still to evaluate</h3>
          {remaining.length ? (
            <ul className="space-y-1.5 text-[13px] text-ink-2">
              {remaining.map((m) => <li key={m.id} className="flex gap-2"><CircleDashed className="h-3.5 w-3.5 mt-0.5 text-subtle" aria-hidden />{m.title}</li>)}
            </ul>
          ) : <p className="text-[13px] text-muted">Nothing. You’ve covered your evaluation plan.</p>}
        </Card>
      </div>

      <Card className="mt-4 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="label text-teal-700">Recommended next step</div>
            <p className="mt-1 text-[15px] font-semibold">{cta.label}</p>
            <p className="text-[13px] text-muted mt-0.5">{cta.why}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="primary" onClick={() => nav(cta.route)} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>{cta.label}</Button>
            <Button variant="secondary" onClick={() => setInvite(true)} icon={<Users className="h-4 w-4" aria-hidden />}>Invite a colleague</Button>
          </div>
        </div>
        <dl className="mt-5 grid sm:grid-cols-3 gap-3 border-t border-line pt-4 text-[13px]">
          <div><dt className="text-muted">Product activation</dt><dd className="font-medium mt-0.5">{ACTIVATION_LABEL[activation]}</dd></div>
          <div><dt className="text-muted">Buying timeline</dt><dd className="font-medium mt-0.5">{timelineLabel(s.profile.timeline)}</dd></div>
          <div><dt className="text-muted">Purchase status</dt><dd className="font-medium mt-0.5">Evaluating. Activation is not a commitment.</dd></div>
        </dl>
      </Card>
      <div className="mt-4 text-center"><Button variant="ghost" onClick={() => nav('/evaluation')}>Back to your evaluation</Button></div>
      <InviteDialog open={invite} onClose={() => setInvite(false)} source="milestone" />
    </div>
  );
}
