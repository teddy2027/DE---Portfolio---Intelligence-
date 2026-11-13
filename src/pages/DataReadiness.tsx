import { Link, Navigate, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Check, CircleDashed, Clock3, FastForward, FileCheck2, Loader2, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, CardHeader, Kpi, PageHeader, ProgressBar, SimTag } from '../components/common/ui';
import { AssistanceDialog } from '../components/evaluation/AssistanceDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { MIGRATION_STAGES } from '../store/state';
import { exceptionsOpen, migrationStageAt } from '../lib/evaluation/engine';
import { useNow } from '../hooks/useNow';
import { num, shortDateTime, timeAgo } from '../lib/format';
import { shortSource } from '../lib/labels';

export default function DataReadiness() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const request = useDemoStore((x) => x.requestMigration);
  const complete = useDemoStore((x) => x.completeMigration);
  const now = useNow(400);
  const nav = useNavigate();
  const [assist, setAssist] = useState(false);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  if (s.path === 'sample') return <Navigate to="/evaluation" replace />;
  const fx = SCENARIOS[id];
  const m = fx.migration;
  const stage = migrationStageAt(s, now);
  const stageIdx = MIGRATION_STAGES.findIndex((x) => x.stage === stage);
  const ready = stage === 'ready';
  const src = shortSource(s.profile.currentERP);
  const open = exceptionsOpen(s);
  const elapsed = s.migration.requestedAt ? now - s.migration.requestedAt : 0;
  const pct = ready ? 100 : Math.min(98, (elapsed / MIGRATION_STAGES[MIGRATION_STAGES.length - 1].at) * 100);

  if (s.migration.stage === 'not_requested') {
    return (
      <div className="max-w-3xl anim-fade">
        <PageHeader eyebrow={<><Badge tone="teal">Step 3 of 3 · Prepare your data</Badge><SimTag>Simulated migration</SimTag></>}
          title={`Prepare your ${src} data for evaluation`}
          subtitle="A DualEntry team member prepares a copy of your books in a separate evaluation sandbox. You review everything before relying on it." />
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-4">
            {[
              { t: 'Request received', d: 'A DualEntry accountant confirms scope with you: entities, history range and source exports.' },
              { t: 'Data ingestion and mapping', d: `Accounts, entities and transactions from ${src} are mapped to DualEntry.` },
              { t: 'Initial validation', d: 'Record counts, trial balances and mappings are checked. Anything that doesn’t match is listed as an exception.' },
              { t: 'Ready for your review', d: 'You inspect checks and exceptions, and decide what to do about each one.' },
            ].map((x, i) => (
              <li key={x.t} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-[12px] font-semibold num">{i + 1}</span>
                <div><div className="text-[14px] font-medium">{x.t}</div><div className="text-[13px] text-muted">{x.d}</div></div>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] text-ink-2 space-y-1.5">
            <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-teal-700 mt-0.5" aria-hidden />This prototype does not connect to {src} and never asks for credentials or file uploads. The migration below is a simulation using fictional data.</p>
            <p className="flex gap-2"><Clock3 className="h-4 w-4 shrink-0 text-teal-700 mt-0.5" aria-hidden />DualEntry describes migrations in about 24 hours; actual timing depends on your data. The simulation compresses this into a few seconds.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" onClick={request} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Request sandbox migration</Button>
            <Button variant="ghost" onClick={() => setAssist(true)} icon={<UserRound className="h-4 w-4" aria-hidden />}>Talk to an accountant first</Button>
          </div>
        </Card>
        <AssistanceDialog open={assist} onClose={() => setAssist(false)} topic="Migration scoping" source="data-readiness" />
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<><Badge tone={ready ? (open ? 'warning' : 'positive') : 'info'} dot>{ready ? (open ? 'Attention needed' : 'Validated') : 'In preparation'}</Badge><SimTag>Simulated migration · fictional data</SimTag></>}
        title={ready ? 'Your data is ready for review.' : 'Your data is being prepared.'}
        subtitle={ready ? `Review what came over from ${src} before relying on it. Imported, mapped and reconciled are reported separately.` : 'You can leave this page. Progress continues and you will see it here when you return.'}
        right={ready
          ? <Button variant="primary" onClick={() => nav('/evaluation/data/validation')} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Review validation</Button>
          : <Button variant="ghost" size="sm" onClick={() => complete()} icon={<FastForward className="h-4 w-4" aria-hidden />}>Skip simulation</Button>} />

      <Card className="p-5">
        <ol className="grid gap-3 sm:grid-cols-5" aria-label="Migration stages">
          {MIGRATION_STAGES.map((st, i) => {
            const done = i < stageIdx || ready;
            const current = i === stageIdx && !ready;
            return (
              <li key={st.stage} className="flex sm:flex-col gap-2 sm:gap-1.5" aria-current={current ? 'step' : undefined}>
                <div className="flex items-center gap-2">
                  <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full', done ? 'bg-positive text-white' : current ? 'bg-teal-50 text-teal-700 border border-teal-600' : 'border border-line-strong text-subtle')}>
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : current ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CircleDashed className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                  <span className={clsx('text-[13px]', done || current ? 'font-medium text-ink' : 'text-muted')}>{st.label}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <ProgressBar className="mt-4" value={pct} label="Migration progress" tone={ready ? 'positive' : 'teal'} />
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
          <span>Requested {s.migration.requestedAt ? shortDateTime(s.migration.requestedAt) : ''} · Prepared by DualEntry implementation team (simulated)</span>
          {ready && s.migration.lastSyncAt && <span>Last simulated sync {timeAgo(s.migration.lastSyncAt, now)}</span>}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="What came over" subtitle={`Source: ${s.profile.currentERP} · History ${m.historyRange}`} right={<SimTag />} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 px-5 pb-5">
            {ready ? (
              <>
                <Kpi label="Entities detected" value={m.entities} />
                <Kpi label="Accounts reviewed" value={num(m.accountsReviewed)} />
                <Kpi label="Records imported" value={num(m.recordsImported)} tip="Records received from the source export. Imported does not mean mapped or reconciled." />
                <Kpi label="Records mapped" value={num(m.recordsMapped)} hint={`${num(m.recordsImported - m.recordsMapped)} not yet mapped`} tone={m.recordsImported - m.recordsMapped ? 'warning' : undefined} tip="Records assigned to a DualEntry account, entity and dimension." />
                <Kpi label="Balances reconciled" value={`${m.entitiesBalanced} of ${m.entities}`} hint="entity trial balances tie to source" tone={m.entitiesBalanced < m.entities ? 'warning' : 'positive'} tip="Each entity's trial balance compared with the source at the cut-over date." />
                <Kpi label="Exceptions open" value={open} hint={open ? 'need your review' : 'all addressed'} tone={open ? 'warning' : 'positive'} />
              </>
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} aria-hidden><div className="skeleton h-3 w-24" /><div className="skeleton h-6 w-16 mt-2" /></div>
              ))
            )}
          </div>
          {!ready && <p className="px-5 pb-5 text-xs text-muted" role="status">Figures appear once initial validation finishes.</p>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-teal-700" aria-hidden /><h2 className="text-[15px] font-semibold">Before you rely on this data</h2></div>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-2">
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-teal-700 shrink-0" aria-hidden />Review which checks passed and which need attention</li>
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-teal-700 shrink-0" aria-hidden />Inspect each exception with its source detail</li>
            <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-teal-700 shrink-0" aria-hidden />Accept a recommendation or ask an accountant</li>
          </ul>
          {ready && open > 0 && (
            <div className="mt-4 rounded-lg bg-warning-bg border border-warning-line px-3 py-2.5 text-[13px] text-warning flex gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />{open} item{open === 1 ? ' needs' : 's need'} your attention.
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {ready && <Button variant="primary" onClick={() => nav('/evaluation/data/validation')}>Review validation</Button>}
            <Button variant="ghost" onClick={() => setAssist(true)} icon={<UserRound className="h-4 w-4" aria-hidden />}>Request accounting assistance</Button>
            <Link to="/evaluation" className="text-center text-[13px] text-teal-700 hover:underline py-1">Go to your evaluation</Link>
          </div>
        </Card>
      </div>
      <AssistanceDialog open={assist} onClose={() => setAssist(false)} topic="Migration review" source="data-readiness" />
    </div>
  );
}
