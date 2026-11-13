import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Check, CalendarClock, ShieldCheck, UserRound, Database, Lock } from 'lucide-react';
import { DemoBar } from '../components/layout/DemoBar';
import { Wordmark } from '../components/layout/Wordmark';
import { Button, Badge, SimTag } from '../components/common/ui';
import { AssistanceDialog } from '../components/evaluation/AssistanceDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { goalLabel, timelineLabel, shortSource } from '../lib/labels';

export default function Welcome() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const start = useDemoStore((x) => x.startEvaluation);
  const resume = useDemoStore((x) => x.resumeEvaluation);
  const nav = useNavigate();
  const [expert, setExpert] = useState(false);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  const fx = SCENARIOS[id];
  const invited = fx.account.acquisitionSource === 'sales_invitation';

  const go = () => {
    if (s.started) { resume(); nav(s.profileConfirmed ? (s.path ? '/evaluation' : '/evaluation/path') : '/evaluation/profile'); }
    else { start(); nav('/evaluation/profile'); }
  };

  const milestones = [
    { t: 'Confirm what you want to evaluate', d: 'Your goal, current system and timeline. Most of it is already filled in.' },
    { t: 'Review your financial data or explore sample data', d: 'Validate your own data in a CPA-assisted sandbox, or start with a sample workspace.' },
    { t: 'Validate your first workflow', d: 'Complete a real accounting workflow, with every change under your approval.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DemoBar />
      <div className="flex-1 grid lg:grid-cols-[1.05fr_1fr]">
        {/* Left: branded welcome moment (darker teal used sparingly here only) */}
        <section className="relative bg-teal-900 text-white px-6 py-10 sm:px-12 lg:px-16 lg:py-14 flex flex-col">
          <Wordmark inverse />
          <div className="mt-12 lg:mt-20 max-w-xl anim-fade">
            <p className="text-teal-200 text-[13px] font-medium tracking-wide">Your DualEntry Evaluation</p>
            <h1 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-semibold tracking-[-0.02em]">Welcome to your DualEntry evaluation.</h1>
            <p className="mt-4 text-[16px] leading-7 text-white/80">Let's help you validate the accounting workflows that matter most to {fx.account.name}. {fx.messaging.headline}</p>
          </div>
          <ol className="mt-10 max-w-xl space-y-5" aria-label="Evaluation milestones">
            {milestones.map((m, i) => (
              <li key={m.t} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-[13px] font-semibold num">{i + 1}</span>
                <div>
                  <div className="font-medium text-[15px]">{m.t}</div>
                  <div className="text-[13.5px] text-white/65 mt-0.5 leading-5">{m.d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-12 grid sm:grid-cols-3 gap-4 max-w-2xl text-[12.5px] text-white/70">
            <div className="flex gap-2"><UserRound className="h-4 w-4 shrink-0 text-teal-200" aria-hidden />CPA-led help at every step</div>
            <div className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-teal-200" aria-hidden />Nothing posts without your approval</div>
            <div className="flex gap-2"><Lock className="h-4 w-4 shrink-0 text-teal-200" aria-hidden />Your sandbox is separate from your live books</div>
          </div>
        </section>

        {/* Right: welcome card */}
        <section className="flex items-center justify-center bg-canvas px-5 py-10 sm:px-10">
          <div className="w-full max-w-md anim-fade">
            <div className="card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="teal" dot>{s.started ? 'Evaluation in progress' : invited ? 'Invitation accepted' : 'Guided evaluation requested'}</Badge>
                <SimTag>Demo environment</SimTag>
              </div>
              <h2 className="mt-5 text-[20px] font-semibold">Hi {fx.user.firstName},</h2>
              <p className="mt-1.5 text-sm text-muted leading-6">
                {invited
                  ? `${fx.account.assignedSalesOwner} from DualEntry set up this evaluation for ${fx.account.name} after your conversation. We've carried over what you shared, so you won't need to repeat it.`
                  : `You requested a guided evaluation for ${fx.account.name}. We'll keep it short and focused on what you need to learn.`}
              </p>

              <dl className="mt-5 rounded-xl border border-line divide-y divide-line text-sm">
                {[
                  ['Company', `${fx.account.name} · ${fx.account.industry}`],
                  ['Current system', shortSource(s.profile.currentERP)],
                  ['Entities', `${s.profile.entityCount}${s.profile.currencies.length > 1 ? ` · ${s.profile.currencies.join(', ')}` : ''}`],
                  ['Focus', goalLabel(s.profile.goal)],
                  ['Timeline', timelineLabel(s.profile.timeline)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3.5 py-2.5">
                    <dt className="text-muted">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-positive" aria-hidden />{invited ? 'Prefilled from your conversation with DualEntry. You can edit it next.' : 'From your request. You can edit it next.'}</p>

              <Button variant="primary" size="lg" className="mt-6 w-full" onClick={go} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>
                Continue evaluation
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setExpert(true)} icon={<CalendarClock className="h-4 w-4" aria-hidden />}>
                Speak with a DualEntry expert
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-muted flex items-center justify-center gap-1.5">
              <Database className="h-3.5 w-3.5" aria-hidden />All companies, people and figures in this prototype are fictional.
            </p>
          </div>
        </section>
      </div>
      <AssistanceDialog open={expert} onClose={() => setExpert(false)} topic="Speak with a DualEntry expert" source="welcome" />
    </div>
  );
}
