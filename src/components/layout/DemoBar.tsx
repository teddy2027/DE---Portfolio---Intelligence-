import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown, FlaskConical, ListTree, RotateCcw, TriangleAlert, Clock3, CircleCheck, Users } from 'lucide-react';
import { useDemoStore } from '../../store/useDemoStore';
import { SCENARIOS, ALL_SCENARIOS } from '../../data/scenarios';
import type { ScenarioId } from '../../types';

function Menu({ label, icon, children, align = 'right' }: { label: string; icon?: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-white/90 hover:bg-white/10">
        {icon}{label}<ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
      {open && (
        <div role="menu" className={clsx('anim-fade absolute top-8 z-[60] w-72 rounded-xl border border-line bg-white p-1.5 text-ink shadow-pop', align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function Item({ onClick, icon, title, desc, active, disabled }: { onClick: () => void; icon?: React.ReactNode; title: string; desc?: string; active?: boolean; disabled?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} disabled={disabled}
      className={clsx('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed', active && 'bg-teal-50')}>
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{title}</span>
        {desc && <span className="block text-xs text-muted leading-4 mt-0.5">{desc}</span>}
      </span>
    </button>
  );
}

/** Thin internal demo strip. Clearly separated from the product UI. */
export function DemoBar() {
  const nav = useNavigate();
  const st = useDemoStore();
  const activeFx = SCENARIOS[st.activeScenario];
  const isCustomer = st.activeScenario === 'customer';
  const switchTo = (id: ScenarioId) => {
    st.switchScenario(id);
    nav(id === 'customer' ? '/customer' : st.scenarios[id].started ? '/evaluation' : '/');
  };
  return (
    <div className="bg-teal-950 text-white">
      <div className="flex h-9 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-[12px]">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-teal-200" aria-hidden />
          <span className="hidden sm:inline font-medium text-white/90">Demo environment</span>
          <span className="hidden md:inline text-white/60">· Fictional data · Proposed experience, not a live product</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Menu label={activeFx.shortLabel} icon={<Users className="h-3.5 w-3.5" aria-hidden />} align="right">
            {(close) => (
              <>
                <div className="px-2.5 pt-1.5 pb-1 label">Demo scenario</div>
                {ALL_SCENARIOS.map((id) => (
                  <Item key={id} active={id === st.activeScenario} onClick={() => { close(); switchTo(id); }}
                    icon={id === st.activeScenario ? <CircleCheck className="h-4 w-4 text-teal-700" /> : <span className="block h-4 w-4" />}
                    title={SCENARIOS[id].label} desc={SCENARIOS[id].personaSummary} />
                ))}
              </>
            )}
          </Menu>
          <Menu label="Controls" align="right">
            {(close) => (
              <>
                <div className="px-2.5 pt-1.5 pb-1 label">Simulate</div>
                <Item disabled={isCustomer || !!st.scenarios[st.activeScenario].blocker} icon={<TriangleAlert className="h-4 w-4" />} title="Simulate blocker" desc={activeFx.blockerTemplate.title || 'Not available for customers'} onClick={() => { close(); st.simulateBlocker(); }} />
                <Item disabled={!st.scenarios[st.activeScenario].blocker} icon={<CircleCheck className="h-4 w-4" />} title="Resolve blocker" desc="Simulates a CPA resolving it" onClick={() => { close(); st.resolveBlocker(); }} />
                <Item disabled={isCustomer} icon={<Clock3 className="h-4 w-4" />} title="Simulate 72 hours of inactivity" desc="Advances the simulated clock for lifecycle rules" onClick={() => { close(); st.simulateInactivity(72); }} />
                <div className="my-1 border-t border-line" />
                <Item icon={<ListTree className="h-4 w-4" />} title="Open event log" desc="Inspect the product event stream" onClick={() => { close(); st.setInspectorOpen(true); }} />
                <Item icon={<RotateCcw className="h-4 w-4" />} title={`Reset “${activeFx.shortLabel}” scenario`} onClick={() => { close(); st.resetScenario(st.activeScenario); nav(isCustomer ? '/customer' : '/'); }} />
                <Item icon={<RotateCcw className="h-4 w-4" />} title="Reset entire demo" desc="All scenarios, events and Sales dispositions" onClick={() => { close(); st.resetDemo(); nav(isCustomer ? '/customer' : '/'); }} />
              </>
            )}
          </Menu>
          <button onClick={() => st.setInspectorOpen(true)} className="ml-1 hidden sm:inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-white/90 hover:bg-white/10">
            <ListTree className="h-3.5 w-3.5" aria-hidden />Events
            <span className="rounded bg-white/15 px-1 text-[11px] num">{st.events.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
