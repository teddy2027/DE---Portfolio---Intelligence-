import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, Compass, DatabaseZap, ShieldCheck, UserRound, Eye, KeyRound } from 'lucide-react';
import { OnboardingLayout } from '../components/layout/OnboardingLayout';
import { Badge, Button, SimTag } from '../components/common/ui';
import { Dialog } from '../components/common/Dialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { shortSource } from '../lib/labels';
import type { EvaluationPath } from '../types';

export default function PathSelect() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const select = useDemoStore((x) => x.selectPath);
  const nav = useNavigate();
  const [confirmSwitch, setConfirmSwitch] = useState<EvaluationPath | null>(null);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  const fx = SCENARIOS[id];
  const src = shortSource(s.profile.currentERP);
  const recommended = s.profile.currentERP === 'NetSuite' || s.profile.currentERP === 'Sage Intacct' ? 'own_data' : fx.recommendedPath;

  const choose = (p: EvaluationPath) => {
    if (s.path && s.path !== p && (s.reconciliation.status !== 'not_started' || s.approval.status !== 'pending')) return setConfirmSwitch(p);
    select(p);
    nav(p === 'own_data' ? '/evaluation/data' : '/evaluation');
  };

  const cards: { id: EvaluationPath; title: string; desc: string; icon: React.ElementType; points: { icon: React.ElementType; t: string }[]; cta: string; tag: React.ReactNode }[] = [
    {
      id: 'own_data', title: 'Validate your own financial data', icon: DatabaseZap,
      desc: `Work with DualEntry to prepare a sandbox using data from ${src}.`,
      points: [
        { icon: UserRound, t: 'A DualEntry accountant prepares the migration with you' },
        { icon: Eye, t: 'You review every check and exception before relying on the data' },
        { icon: ShieldCheck, t: 'Your sandbox is separate from your live books' },
        { icon: KeyRound, t: 'No credentials are requested in this prototype' },
      ],
      cta: 'Validate my data', tag: <SimTag>Simulated migration</SimTag>,
    },
    {
      id: 'sample', title: 'Explore with sample data', icon: Compass,
      desc: 'See how DualEntry works using a preconfigured example workspace.',
      points: [
        { icon: Check, t: 'Start immediately. No data or bank access needed' },
        { icon: Check, t: `Fictional company: ${fx.sampleCompanyName}` },
        { icon: Check, t: 'The same workflows you would validate on your own data' },
        { icon: Check, t: 'Move to your own data whenever you are ready' },
      ],
      cta: 'Explore sample workspace', tag: <SimTag>Proposed guided preview</SimTag>,
    },
  ];
  const ordered = recommended === 'own_data' ? cards : [...cards].reverse();

  return (
    <OnboardingLayout step={2}>
      <div className="mx-auto max-w-5xl anim-fade">
        <p className="text-[13px] font-medium text-teal-700">Step 2 of 3</p>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.01em]">How would you like to evaluate DualEntry?</h1>
        <p className="mt-1 text-sm text-muted max-w-2xl">{fx.messaging.subhead} You can change this later.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {ordered.map((c) => {
            const isRec = c.id === recommended;
            const selected = s.path === c.id;
            return (
              <article key={c.id} className={clsx('card p-6 flex flex-col transition', isRec && 'ring-1 ring-teal-600/40 border-teal-600/50')} aria-labelledby={`path-${c.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', isRec ? 'bg-teal-700 text-white' : 'bg-canvas border border-line text-ink-2')}>
                    <c.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {isRec && <Badge tone="teal">Recommended for you</Badge>}
                    {c.tag}
                  </div>
                </div>
                <h2 id={`path-${c.id}`} className="mt-4 text-[17px] font-semibold">{c.title}</h2>
                <p className="mt-1 text-sm text-muted">{c.desc}</p>
                <ul className="mt-4 space-y-2 text-[13.5px] text-ink-2 flex-1">
                  {c.points.map((p) => <li key={p.t} className="flex gap-2"><p.icon className="h-4 w-4 mt-0.5 shrink-0 text-teal-700" aria-hidden />{p.t}</li>)}
                </ul>
                {c.id === 'own_data' && (
                  <p className="mt-4 text-xs text-muted border-t border-line pt-3">DualEntry describes data migration in about 24 hours and typical implementation in 4–6 weeks. Timing depends on your data and complexity.</p>
                )}
                {c.id === 'sample' && (
                  <p className="mt-4 text-xs text-muted border-t border-line pt-3">DualEntry does not currently offer a self-serve free trial. This sample workspace is a proposed guided preview built for this prototype.</p>
                )}
                <Button className="mt-5" variant={isRec ? 'primary' : 'secondary'} onClick={() => choose(c.id)} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>
                  {selected ? 'Continue' : c.cta}
                </Button>
                {isRec && c.id === 'own_data' && id !== 'netsuite' && <p className="mt-2 text-center text-xs text-muted">Recommended because you’re moving from {src} with {s.profile.entityCount} entities.</p>}
                {isRec && c.id === 'own_data' && id === 'netsuite' && <p className="mt-2 text-center text-xs text-muted">Recommended because proving controls and entity mapping requires your own data.</p>}
                {isRec && c.id === 'sample' && <p className="mt-2 text-center text-xs text-muted">Recommended to see the workflows before deciding what to set up.</p>}
              </article>
            );
          })}
        </div>
        <div className="mt-6"><Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" aria-hidden />} onClick={() => nav('/evaluation/profile')}>Back</Button></div>
      </div>

      <Dialog open={!!confirmSwitch} onClose={() => setConfirmSwitch(null)} size="sm" title="Switch evaluation data?"
        description="Workflow progress is tied to a dataset. Switching resets reconciliation, reporting and approval progress so results are never mixed between sample and your own data."
        footer={<><Button variant="ghost" onClick={() => setConfirmSwitch(null)}>Keep current path</Button>
          <Button variant="primary" onClick={() => { const p = confirmSwitch!; setConfirmSwitch(null); select(p); nav(p === 'own_data' ? '/evaluation/data' : '/evaluation'); }}>Switch and reset progress</Button></>} />
    </OnboardingLayout>
  );
}
