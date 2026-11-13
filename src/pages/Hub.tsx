import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight, BookOpenText, Bot, CalendarCheck2, Check, CheckCircle2, CircleDashed, Clock3, Hand, ListChecks, Loader2, Scale,
  BarChart3, ShieldCheck, TriangleAlert, UserRound, Workflow, Users,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, InfoTip, PageHeader, ProgressBar, SimTag } from '../components/common/ui';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { HelpPanel } from '../components/evaluation/HelpPanel';
import { AssistanceDialog } from '../components/evaluation/AssistanceDialog';
import { InviteDialog } from '../components/evaluation/InviteDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import {
  activationStatus, buildMilestones, buildTasks, evaluationProgress, nextAction, reconFigures, exceptionsOpen,
} from '../lib/evaluation/engine';
import { ACTIVATION_LABEL, GOAL_HEADLINE, goalShort, shortSource, timelineLabel } from '../lib/labels';
import { describeEvent, isTimelineEvent } from '../lib/analytics/describe';
import { money, timeAgo } from '../lib/format';
import { useNow } from '../hooks/useNow';
import type { MilestoneState } from '../types';

const STATE_ICON: Record<MilestoneState, React.ReactNode> = {
  done: <CheckCircle2 className="h-4 w-4 text-positive" aria-label="Done" />,
  in_progress: <Loader2 className="h-4 w-4 text-info" aria-label="In progress" />,
  waiting_on_me: <Hand className="h-4 w-4 text-teal-700" aria-label="Waiting on you" />,
  blocked: <TriangleAlert className="h-4 w-4 text-danger" aria-label="Blocked" />,
  todo: <CircleDashed className="h-4 w-4 text-subtle" aria-label="Not started" />,
};

export default function Hub() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const events = useDemoStore((x) => x.events);
  const nav = useNavigate();
  const now = useNow(30000);
  const [assist, setAssist] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  if (!s.profileConfirmed) return <Navigate to={s.started ? '/evaluation/profile' : '/'} replace />;
  if (!s.path) return <Navigate to="/evaluation/path" replace />;

  const fx = SCENARIOS[id];
  const milestones = buildMilestones(s);
  const progress = evaluationProgress(s);
  const next = nextAction(s);
  const tasks = buildTasks(s);
  const activation = activationStatus(s);
  const rec = reconFigures(s);
  const current = milestones.find((m) => m.state !== 'done');
  const blockers = [
    ...(s.blocker ? [s.blocker.title] : []),
    ...(s.path === 'own_data' && s.migration.stage === 'ready' && exceptionsOpen(s) ? [`${exceptionsOpen(s)} migration exception${exceptionsOpen(s) === 1 ? '' : 's'} open`] : []),
    ...(s.reconciliation.status === 'adjustment_rejected' ? [`${money(Math.abs(rec.difference))} reconciliation difference unresolved`] : []),
  ];
  const sample = s.path === 'sample';
  const accountId = fx.account.id;
  const timeline = events.filter((e) => e.accountId === accountId && isTimelineEvent(e)).slice(-7).reverse();
  const nearTerm = s.profile.timeline === 'within_30' || s.profile.timeline === '1_3_months';

  const doNext = () => {
    if (next.kind === 'assist') return setAssist(s.blocker?.title ?? next.title);
    if (next.route === '/evaluation/invite') return setInvite(true);
    if (next.route) nav(next.route);
  };

  const subtitle = sample
    ? `You're exploring ${fx.sampleCompanyName}, a fictional workspace. Here is the next step to see how DualEntry handles ${goalShort(s.profile.goal).toLowerCase()}.`
    : s.migration.stage === 'ready'
      ? 'Your accounting data is ready. Here are the next steps to establish confidence in DualEntry.'
      : 'Your sandbox is being prepared. Here is what happens next.';

  const modules = [
    { icon: BookOpenText, name: 'General Ledger', desc: s.ledgerEntries.length ? `${s.ledgerEntries.length} entr${s.ledgerEntries.length === 1 ? 'y' : 'ies'} posted in this evaluation` : 'Journal entries and account activity', to: '/evaluation/ledger' },
    { icon: Scale, name: 'Reconciliation', desc: rec.reconciled ? 'Reconciled for October' : `${rec.unmatchedCount} unmatched item`, to: '/evaluation/reconciliation', status: rec.reconciled ? 'positive' : 'warning' },
    { icon: BarChart3, name: s.profile.entityCount > 1 ? 'Multi-Entity Reporting' : 'Financial Reporting', desc: s.profile.entityCount > 1 ? `${fx.consolidation.entities.length} entities, consolidated` : 'Income statement', to: '/evaluation/reporting', status: s.consolidation.completed ? 'positive' : undefined },
    { icon: CalendarCheck2, name: 'Close Management', desc: 'Close checklist walkthrough with a specialist', onClick: () => setAssist('Close management walkthrough') },
    { icon: ListChecks, name: 'Tasks', desc: `${tasks.filter((t) => t.column === 'waiting_on_me').length} waiting on you`, to: '/evaluation/tasks' },
    { icon: ShieldCheck, name: 'Approval Workflows', desc: s.approval.status === 'pending' ? `1 entry awaiting ${fx.approval.requiredApproverRole}` : 'Decision recorded', to: '/evaluation/approvals', status: s.approval.status === 'pending' ? undefined : 'positive' },
    { icon: Bot, name: 'AI Accounting Intelligence', desc: 'Agent-prepared work, always routed for approval', to: '/evaluation/approvals' },
  ];

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<>
          <Badge tone="teal">{goalShort(s.profile.goal)}</Badge>
          {sample ? <Badge tone="neutral">Sample data · fictional</Badge> : <Badge tone="info">Your {shortSource(s.profile.currentERP)} data · simulated migration</Badge>}
          {s.profile.entityCount > 1 && <span className="text-xs text-muted">{s.profile.entityCount} entities</span>}
        </>}
        title={GOAL_HEADLINE[s.profile.goal]}
        subtitle={subtitle}
        right={<Button variant="secondary" size="sm" icon={<Users className="h-4 w-4" aria-hidden />} onClick={() => setInvite(true)}>Invite a colleague</Button>}
      />

      {s.blocker && (
        <div role="alert" className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-danger-line bg-danger-bg px-4 py-3">
          <TriangleAlert className="h-5 w-5 text-danger shrink-0" aria-hidden />
          <div className="flex-1 text-sm"><span className="font-semibold text-ink">{s.blocker.title}.</span> <span className="text-ink-2">{s.blocker.detail}</span></div>
          <Button size="sm" variant="secondary" onClick={() => setAssist(s.blocker!.title)} icon={<UserRound className="h-4 w-4" aria-hidden />}>Request accounting assistance</Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 min-w-0">
          {/* Recommended next step: one primary action */}
          <section aria-labelledby="next-title" className="card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-5 sm:p-6">
                <div className="label text-teal-700">Recommended next step</div>
                <h2 id="next-title" className="mt-1.5 text-[19px] font-semibold tracking-[-0.01em]">{next.title}</h2>
                <p className="mt-1.5 text-[14px] text-ink-2 max-w-xl">{next.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={doNext} iconRight={next.kind !== 'assist' ? <ArrowRight className="h-4 w-4" aria-hidden /> : undefined}
                    icon={next.kind === 'assist' ? <UserRound className="h-4 w-4" aria-hidden /> : next.kind === 'wait' ? <Clock3 className="h-4 w-4" aria-hidden /> : undefined}>
                    {next.cta}
                  </Button>
                </div>
              </div>
              {next.id === 'reconcile' && (
                <div className="md:w-64 border-t md:border-t-0 md:border-l border-line bg-canvas/60 p-5 text-sm">
                  <div className="label">{fx.reconciliation.period}</div>
                  <dl className="mt-2 space-y-1.5 num">
                    <div className="flex justify-between"><dt className="text-muted">Ledger</dt><dd className="font-medium">{money(rec.ledgerBalance)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Bank</dt><dd className="font-medium">{money(rec.bankBalance)}</dd></div>
                    <div className="flex justify-between border-t border-line pt-1.5"><dt className="text-muted">Difference</dt><dd className="font-semibold text-warning">{money(rec.difference)}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </section>

          {/* Evaluation progress */}
          <Card aria-labelledby="progress-title">
            <CardHeader id="progress-title" title="Evaluation progress"
              subtitle={<>Goal: {goalShort(s.profile.goal)} · Current milestone: <span className="text-ink-2 font-medium">{current?.title ?? 'All milestones complete'}</span></>}
              right={<span className="text-[13px] text-muted num">{progress.done} of {progress.total} verified</span>} />
            <div className="px-5"><ProgressBar value={progress.pct} label="Evaluation progress" /></div>
            <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 px-5 pb-4">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-2.5 py-2 border-b border-line/70 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                  <span className="mt-0.5">{STATE_ICON[m.state]}</span>
                  <div className="min-w-0">
                    <Link to={m.route === '/evaluation/invite' ? '#' : m.route} onClick={(e) => { if (m.route === '/evaluation/invite') { e.preventDefault(); setInvite(true); } }}
                      className={clsx('text-[13.5px] font-medium hover:underline underline-offset-2', m.state === 'done' ? 'text-ink-2' : 'text-ink')}>{m.title}</Link>
                    <div className="text-xs text-muted truncate">{m.state === 'done' ? `Verified · ${m.verifiedBy}` : m.state === 'blocked' ? 'Blocked' : m.description}</div>
                  </div>
                </li>
              ))}
            </ol>
            {blockers.length > 0 && (
              <div className="mx-5 mb-4 rounded-lg bg-warning-bg border border-warning-line px-3 py-2 text-[13px] text-warning">
                <span className="font-medium">Outstanding:</span> {blockers.join(' · ')}
              </div>
            )}
          </Card>

          {/* Tasks */}
          <section aria-labelledby="tasks-title">
            <div className="flex items-end justify-between mb-2.5">
              <div>
                <h2 id="tasks-title" className="text-[15px] font-semibold flex items-center gap-1.5">Tasks <InfoTip text="Evaluation work appears in the same Tasks model DualEntry uses for agent activity, exceptions and approvals. Cards move automatically as you complete workflows; nothing is ticked off by hand." /></h2>
                <p className="text-[13px] text-muted">Updates from what you actually do in the evaluation.</p>
              </div>
              <Link to="/evaluation/tasks" className="text-[13px] font-medium text-teal-700 hover:underline">Open Tasks</Link>
            </div>
            <TaskBoard tasks={tasks} compact />
          </section>

          {/* Modules */}
          <Card aria-labelledby="modules-title">
            <CardHeader id="modules-title" title="Explore DualEntry" subtitle="Modules relevant to your evaluation." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 px-4 pb-4">
              {modules.map((m) => {
                const inner = (
                  <>
                    <m.icon className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" aria-hidden />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium flex items-center gap-1.5">{m.name}{m.status === 'positive' && <Check className="h-3.5 w-3.5 text-positive" aria-label="Complete" />}</div>
                      <div className="text-xs text-muted">{m.desc}</div>
                    </div>
                  </>
                );
                const cls = 'flex gap-2.5 rounded-lg border border-line px-3 py-2.5 text-left hover:border-line-strong hover:bg-canvas/50 transition w-full';
                return m.to ? <Link key={m.name} to={m.to} className={cls}>{inner}</Link> : <button key={m.name} onClick={m.onClick} className={cls}>{inner}</button>;
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Activation, readiness and purchase are deliberately separate */}
          <Card className="p-5" aria-labelledby="status-title">
            <h2 id="status-title" className="text-[15px] font-semibold flex items-center gap-1.5">Where things stand
              <InfoTip text="Completing an accounting workflow is product activation. It is not the same as being ready to buy, and neither changes your purchase status." />
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Product activation</dt>
                <dd><Badge tone={activation === 'verified' ? 'positive' : activation === 'sample_completed' ? 'teal' : activation === 'in_progress' ? 'info' : 'neutral'} dot>{ACTIVATION_LABEL[activation]}</Badge></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Buying timeline</dt>
                <dd className="text-right font-medium text-ink-2">{timelineLabel(s.profile.timeline)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Purchase status</dt>
                <dd><Badge tone="neutral">Evaluating · not a customer</Badge></dd>
              </div>
            </dl>
            {activation === 'sample_completed' && <p className="mt-3 text-xs text-muted">Sample results show the workflow. Verified activation requires your own data.</p>}
            {activation === 'verified' && nearTerm && (
              <Button className="mt-4 w-full" variant="subtle" onClick={() => nav('/evaluation/next-steps')}>Review next steps with DualEntry</Button>
            )}
          </Card>

          <HelpPanel screen="hub" />

          <Card aria-labelledby="activity-title">
            <CardHeader id="activity-title" title="Recent activity" right={<SimTag>Demo events</SimTag>} />
            {timeline.length ? (
              <ol className="px-5 pb-4 space-y-2.5">
                {timeline.map((e) => (
                  <li key={e.eventId} className="flex gap-2.5 text-[13px]">
                    <Workflow className="h-3.5 w-3.5 mt-0.5 text-subtle shrink-0" aria-hidden />
                    <span className="flex-1 text-ink-2">{describeEvent(e)}</span>
                    <span className="text-xs text-muted whitespace-nowrap">{timeAgo(e.timestamp, now)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="px-5 pb-4 text-[13px] text-muted">Your evaluation activity will appear here.</p>}
          </Card>
        </div>
      </div>

      <AssistanceDialog open={!!assist} onClose={() => setAssist(null)} topic={assist ?? ''} source="hub" />
      <InviteDialog open={invite} onClose={() => setInvite(false)} source="hub" />
    </div>
  );
}
