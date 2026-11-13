import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, Pencil, Sparkles } from 'lucide-react';
import { OnboardingLayout } from '../components/layout/OnboardingLayout';
import { Button, InfoTip } from '../components/common/ui';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { GOALS, ROLES, SOURCE_SYSTEMS, TIMELINES, shortSource } from '../lib/labels';
import { buildMilestones } from '../lib/evaluation/engine';
import type { CurrencyCode, GoalId, SourceSystem, Timeline } from '../types';

const ERP_NOTE: Record<SourceSystem, string> = {
  'QuickBooks Online': 'Classes and locations will map to DualEntry dimensions. We check each entity’s trial balance against QuickBooks.',
  Xero: 'Tracking categories will map to DualEntry dimensions. We check each organisation’s trial balance against Xero.',
  NetSuite: 'Subsidiaries map to entities and custom segments to dimensions. Approval workflows are recreated and confirmed with you.',
  'Sage Intacct': 'Entities and dimensions map closely. We confirm consolidation and intercompany setup with you.',
  'Spreadsheets / other': 'We start from a standard chart of accounts and your opening balances. A DualEntry accountant can help set this up.',
  Other: 'A DualEntry specialist confirms what can be exported and how it maps.',
};
const CURRENCIES: CurrencyCode[] = ['USD', 'GBP', 'EUR', 'CAD', 'MXN', 'AUD', 'SGD'];

function Pills<T extends string>({ name, value, options, onChange, label }: { name: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.id} className={clsx('cursor-pointer rounded-lg border px-3 py-2 text-[13.5px] transition-colors focus-within:ring-2 focus-within:ring-teal-600/40',
          value === o.id ? 'border-teal-600 bg-teal-50 text-teal-900 font-medium' : 'border-line-strong bg-white text-ink-2 hover:border-subtle')}>
          <input type="radio" name={name} className="sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
          {value === o.id && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-hidden />}{o.label}
        </label>
      ))}
    </div>
  );
}

export default function Profile() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const update = useDemoStore((x) => x.updateProfile);
  const confirm = useDemoStore((x) => x.confirmProfile);
  const start = useDemoStore((x) => x.startEvaluation);
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  if (id === 'customer') return <Navigate to="/customer" replace />;
  const fx = SCENARIOS[id];
  const p = s.profile;
  const prefilled = fx.account.acquisitionSource === 'sales_invitation';
  const plan = buildMilestones(s).filter((m) => m.id !== 'goals');

  const finish = () => { if (!s.started) start(); confirm(); nav('/evaluation/path'); };

  return (
    <OnboardingLayout step={1}>
      <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card p-6 sm:p-8 anim-fade" aria-labelledby="profile-title">
          <p className="text-[13px] font-medium text-teal-700">Step 1 of 3 · {step === 1 ? 'Your evaluation' : 'A little more context'}</p>
          <h1 id="profile-title" className="mt-1 text-[22px] font-semibold tracking-[-0.01em]">
            {step === 1 ? 'Confirm what you want to evaluate' : 'Help us set up the right checks'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {step === 1
              ? prefilled ? 'We filled this in from your conversation with DualEntry. Change anything that isn’t right.' : 'Three quick questions. Everything else can wait.'
              : 'These shape which validation checks and workflows we prepare. All optional.'}
          </p>

          {step === 1 ? (
            <div className="mt-7 space-y-7">
              <fieldset>
                <legend className="text-[14px] font-semibold mb-2.5 flex items-center gap-2">Current accounting system {prefilled && <span className="text-xs font-normal text-muted inline-flex items-center gap-1"><Pencil className="h-3 w-3" aria-hidden />previously provided</span>}</legend>
                <Pills name="erp" label="Current accounting system" value={p.currentERP} onChange={(v) => update({ currentERP: v })}
                  options={SOURCE_SYSTEMS.map((x) => ({ id: x, label: x === 'Spreadsheets / other' ? 'Spreadsheets / lightweight tools' : x }))} />
                <p className="mt-2.5 text-[13px] text-ink-2 rounded-lg bg-canvas border border-line px-3 py-2">{ERP_NOTE[p.currentERP]}</p>
              </fieldset>

              <fieldset>
                <legend className="text-[14px] font-semibold mb-2.5">Primary objective</legend>
                <div role="radiogroup" aria-label="Primary objective" className="grid sm:grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <label key={g.id} className={clsx('cursor-pointer rounded-lg border px-3.5 py-3 text-[13.5px] transition-colors focus-within:ring-2 focus-within:ring-teal-600/40 flex items-center justify-between gap-2',
                      p.goal === g.id ? 'border-teal-600 bg-teal-50 text-teal-900 font-medium' : 'border-line-strong bg-white text-ink-2 hover:border-subtle')}>
                      <input type="radio" name="goal" className="sr-only" checked={p.goal === g.id} onChange={() => update({ goal: g.id as GoalId })} />
                      {g.label}{p.goal === g.id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[14px] font-semibold mb-1 flex items-center gap-1.5">Buying timeline <span className="text-xs font-normal text-muted">optional</span>
                  <InfoTip text="This helps us suggest the right next step: more exploration, or a conversation about implementation. It never limits what you can access." label="Why we ask about timeline" />
                </legend>
                <div className="mt-2"><Pills name="timeline" label="Buying timeline" value={p.timeline} onChange={(v) => update({ timeline: v as Timeline })} options={TIMELINES} /></div>
              </fieldset>
            </div>
          ) : (
            <div className="mt-7 space-y-7">
              <fieldset>
                <legend className="text-[14px] font-semibold mb-2.5">Legal entities and currencies</legend>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="entities" className="text-sm text-ink-2">Entities</label>
                  <input id="entities" type="number" min={1} max={50} className="input w-24 num" value={p.entityCount}
                    onChange={(e) => update({ entityCount: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />
                  <span className="text-xs text-muted">{p.entityCount > 1 ? 'We’ll include consolidation and intercompany checks.' : 'Single-entity: we’ll skip consolidation.'}</span>
                </div>
                {p.entityCount > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Currencies">
                    {CURRENCIES.map((c) => {
                      const on = p.currencies.includes(c);
                      return (
                        <button key={c} type="button" aria-pressed={on}
                          onClick={() => update({ currencies: on ? p.currencies.filter((x) => x !== c).length ? p.currencies.filter((x) => x !== c) : p.currencies : [...p.currencies, c] })}
                          className={clsx('rounded-md border px-2.5 py-1 text-xs font-medium num', on ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-line-strong text-ink-2 hover:bg-canvas')}>{c}</button>
                      );
                    })}
                  </div>
                )}
              </fieldset>
              <fieldset>
                <legend className="text-[14px] font-semibold mb-2.5">Your role in the decision <span className="text-xs font-normal text-muted">optional</span></legend>
                <Pills name="role" label="Your role in the decision" value={p.buyingRole} onChange={(v) => update({ buyingRole: v })} options={ROLES} />
              </fieldset>
              <div>
                <label htmlFor="blocker" className="text-[14px] font-semibold block mb-2">What would stop you from switching? <span className="text-xs font-normal text-muted">optional</span></label>
                <input id="blocker" className="input" value={p.mainBlocker} onChange={(e) => update({ mainBlocker: e.target.value }, 'profile-blocker')}
                  placeholder="e.g. Confidence that balances carry over correctly" />
                <p className="mt-1 text-xs text-muted">We use this to put the right checks first, not to follow up with sales emails.</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            {step === 1 ? <span /> : <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" aria-hidden />} onClick={() => setStep(1)}>Back</Button>}
            <div className="flex gap-2">
              {step === 1 && <Button variant="ghost" onClick={finish}>Skip details</Button>}
              <Button variant="primary" iconRight={<ArrowRight className="h-4 w-4" aria-hidden />} onClick={() => (step === 1 ? setStep(2) : finish())}>
                {step === 1 ? 'Continue' : 'Choose how to evaluate'}
              </Button>
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 self-start card p-5 anim-fade" aria-labelledby="plan-title">
          <div className="flex items-center gap-1.5 text-teal-700"><Sparkles className="h-4 w-4" aria-hidden /><span className="text-xs font-medium">Updates as you answer</span></div>
          <h2 id="plan-title" className="mt-2 text-[15px] font-semibold">Your evaluation plan</h2>
          <p className="text-[13px] text-muted mt-0.5">Built for {shortSource(p.currentERP)}, {p.entityCount} entit{p.entityCount === 1 ? 'y' : 'ies'}.</p>
          <ol className="mt-4 space-y-3">
            {plan.map((m, i) => (
              <li key={m.id} className="flex gap-3 anim-fade">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas border border-line text-[11px] font-semibold text-ink-2 num">{i + 1}</span>
                <div>
                  <div className="text-[13.5px] font-medium leading-5">{m.title}</div>
                  <div className="text-xs text-muted">{m.description}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </OnboardingLayout>
  );
}
