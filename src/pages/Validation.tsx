import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, CircleDashed, Clock, TriangleAlert, UserRound } from 'lucide-react';
import { Badge, Button, Card, CardHeader, InfoTip, PageHeader, SimTag, type Tone } from '../components/common/ui';
import { Drawer } from '../components/common/Dialog';
import { HelpPanel } from '../components/evaluation/HelpPanel';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { exceptionsOpen, highExceptionsOpen } from '../lib/evaluation/engine';
import type { ExceptionSeverity, MigrationException } from '../types';

const SEV: Record<ExceptionSeverity, { tone: Tone; label: string }> = {
  high: { tone: 'danger', label: 'High' }, medium: { tone: 'warning', label: 'Medium' }, low: { tone: 'neutral', label: 'Low' },
};

export default function Validation() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const startValidation = useDemoStore((x) => x.startValidation);
  const viewException = useDemoStore((x) => x.viewException);
  const decide = useDemoStore((x) => x.decideException);
  const nav = useNavigate();
  const [openEx, setOpenEx] = useState<MigrationException | null>(null);
  useEffect(() => { if (s.migration.stage === 'ready' && s.path === 'own_data') startValidation(); }, [s.migration.stage, s.path, startValidation]);
  if (id === 'customer' || s.path !== 'own_data') return <Navigate to="/evaluation" replace />;
  if (s.migration.stage !== 'ready') return <Navigate to="/evaluation/data" replace />;

  const fx = SCENARIOS[id];
  const m = fx.migration;
  const open = exceptionsOpen(s);
  const highOpen = highExceptionsOpen(s);
  const passed = m.checks.filter((c) => c.status === 'passed').length;
  const show = (e: MigrationException) => { setOpenEx(e); viewException(e.id); };
  const decision = openEx ? s.exceptionDecisions[openEx.id] : 'open';

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<><button onClick={() => nav('/evaluation/data')} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Migration</button><SimTag>Simulated validation · fictional data</SimTag></>}
        title="Migration validation"
        subtitle={`${passed} of ${m.checks.length} checks passed. ${open ? `${open} exception${open === 1 ? '' : 's'} need your decision.` : 'All exceptions have a decision.'}`}
        right={highOpen === 0
          ? <Button variant="primary" onClick={() => nav('/evaluation')} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Continue evaluation</Button>
          : <Badge tone="warning" dot>{highOpen} high-severity item{highOpen === 1 ? '' : 's'} open</Badge>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader title="Validation checks" subtitle="Each check is reported on its own. A passed check never implies the others passed." />
            <ul className="divide-y divide-line border-t border-line">
              {m.checks.map((c) => (
                <li key={c.id} className="flex gap-3 px-5 py-3">
                  {c.status === 'passed' ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-positive shrink-0" aria-label="Passed" />
                    : c.status === 'review' ? <TriangleAlert className="h-4 w-4 mt-0.5 text-warning shrink-0" aria-label="Needs review" />
                    : <CircleDashed className="h-4 w-4 mt-0.5 text-muted shrink-0" aria-label="Pending" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium flex items-center gap-1.5">{c.label}{c.tooltip && <InfoTip text={c.tooltip} label={`About ${c.label}`} />}</div>
                    <div className="text-[13px] text-muted">{c.detail}</div>
                  </div>
                  <Badge tone={c.status === 'passed' ? 'positive' : c.status === 'review' ? 'warning' : 'neutral'}>{c.status === 'passed' ? 'Passed' : c.status === 'review' ? 'Needs review' : 'Not started'}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Exceptions" subtitle="Open one to see the source detail and decide what to do." />
            <ul className="border-t border-line divide-y divide-line">
              {m.exceptions.map((e) => {
                const d = s.exceptionDecisions[e.id];
                return (
                  <li key={e.id}>
                    <button onClick={() => show(e)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-canvas/70">
                      <Badge tone={SEV[e.severity].tone}>{SEV[e.severity].label}</Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium text-ink truncate">{e.title}</div>
                        <div className="text-xs text-muted">{e.entity}</div>
                      </div>
                      {d === 'open' && <Badge tone="warning">Needs decision</Badge>}
                      {d === 'recommendation_accepted' && <Badge tone="info"><Clock className="h-3 w-3" aria-hidden />Recommendation accepted · pending CPA confirmation</Badge>}
                      {d === 'assistance_requested' && <Badge tone="teal"><UserRound className="h-3 w-3" aria-hidden />With a DualEntry accountant</Badge>}
                      <ChevronRight className="h-4 w-4 text-subtle shrink-0" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <HelpPanel screen="validation" />
          <Card className="p-5 text-[13px] text-ink-2 space-y-2">
            <h2 className="text-[14px] font-semibold text-ink">When to involve a CPA</h2>
            <p>Ask for help when a variance affects equity or opening balances, when an exception touches approval controls, or when you are unsure which source is correct.</p>
          </Card>
        </div>
      </div>

      <Drawer open={!!openEx} onClose={() => setOpenEx(null)} title={openEx?.title ?? ''} subtitle={openEx && <span className="flex items-center gap-2"><Badge tone={SEV[openEx.severity].tone}>{SEV[openEx.severity].label} severity</Badge>{openEx.entity}</span>}>
        {openEx && (
          <div className="px-5 py-4 space-y-5 text-sm">
            <section><h3 className="label mb-1.5">What happened</h3><p className="text-ink-2 leading-6">{openEx.explanation}</p></section>
            <section>
              <h3 className="label mb-1.5">Source detail</h3>
              <dl className="rounded-lg border border-line divide-y divide-line">
                {openEx.sourceDetail.map((d) => <div key={d.label} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted">{d.label}</dt><dd className="font-medium text-right num">{d.value}</dd></div>)}
              </dl>
            </section>
            <section><h3 className="label mb-1.5">Suggested next step</h3><p className="text-ink-2">{openEx.suggestedNextStep}</p></section>
            <section className="rounded-lg border border-dashed border-line-strong p-3">
              <div className="flex items-center gap-2"><h3 className="label">Recommendation</h3><Badge tone="info">Not applied</Badge></div>
              <p className="mt-1 text-ink-2">{openEx.recommendation}</p>
              <p className="mt-1.5 text-xs text-muted">Accepting records your intent. A DualEntry accountant confirms before anything changes in your sandbox.</p>
            </section>
            {decision === 'open' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" onClick={() => decide(openEx.id, 'recommendation_accepted')}>Accept recommendation</Button>
                <Button variant="secondary" icon={<UserRound className="h-4 w-4" aria-hidden />} onClick={() => decide(openEx.id, 'assistance_requested')}>Request accounting assistance</Button>
              </div>
            ) : (
              <div className={clsx('rounded-lg px-3 py-2.5 text-[13px] flex gap-2', decision === 'assistance_requested' ? 'bg-teal-50 border border-teal-200 text-teal-900' : 'bg-info-bg border border-info-line text-info')} role="status">
                {decision === 'assistance_requested' ? <UserRound className="h-4 w-4 shrink-0" aria-hidden /> : <Clock className="h-4 w-4 shrink-0" aria-hidden />}
                {decision === 'assistance_requested' ? 'A DualEntry accountant will review this with you (simulated). It appears in Tasks under “In progress”.' : 'Recommendation accepted. Pending CPA confirmation. Not yet applied to your sandbox.'}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
