import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, ListChecks, BookOpenText, Scale, BarChart3, ShieldCheck, Megaphone, Radar, LineChart, Gift, Home, Database, X,
} from 'lucide-react';
import { useDemoStore, useActive } from '../../store/useDemoStore';
import { SCENARIOS } from '../../data/scenarios';
import { buildTasks } from '../../lib/evaluation/engine';
import { Wordmark } from './Wordmark';

type Item = { to: string; label: string; icon: React.ElementType; badge?: number; end?: boolean };

function Group({ title, items, onNavigate, note }: { title?: string; items: Item[]; onNavigate?: () => void; note?: string }) {
  return (
    <div className="mt-5 first:mt-3">
      {title && <div className="px-3 mb-1.5 flex items-center justify-between label">{title}{note && <span className="normal-case tracking-normal font-normal text-[10px] text-subtle">{note}</span>}</div>}
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} onClick={onNavigate}
              className={({ isActive }) => clsx('group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] transition-colors',
                isActive ? 'bg-teal-50 text-teal-800 font-medium' : 'text-ink-2 hover:bg-canvas hover:text-ink')}>
              <it.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{it.label}</span>
              {!!it.badge && <span className="ml-auto rounded-md bg-teal-700 px-1.5 text-[11px] font-medium text-white num" aria-label={`${it.badge} waiting on you`}>{it.badge}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const fx = SCENARIOS[id];
  const waiting = buildTasks(s).filter((t) => t.column === 'waiting_on_me').length;
  const isCustomer = id === 'customer';
  const workspace = isCustomer ? 'Production workspace (demo)' : s.path === 'sample' ? 'Sample workspace' : s.path === 'own_data' ? 'Evaluation sandbox' : 'Evaluation';
  const company = s.path === 'sample' ? fx.sampleCompanyName : fx.account.name;

  return (
    <nav aria-label="Primary" className="flex h-full flex-col bg-white border-r border-line">
      <div className="flex items-center justify-between px-4 h-14 border-b border-line">
        <Wordmark />
        {mobile && <button onClick={onNavigate} aria-label="Close navigation" className="rounded-md p-1 hover:bg-canvas"><X className="h-4 w-4" /></button>}
      </div>
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-800 text-[12px] font-semibold text-white">{company.charAt(0)}</div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{company}</div>
            <div className="truncate text-[11px] text-muted flex items-center gap-1"><Database className="h-3 w-3" aria-hidden />{workspace}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isCustomer ? (
          <Group items={[
            { to: '/customer', label: 'Home', icon: Home, end: true },
            { to: '/evaluation/ledger', label: 'General Ledger', icon: BookOpenText },
            { to: '/evaluation/reporting', label: 'Reporting', icon: BarChart3 },
            { to: '/customer/referrals', label: 'Refer a colleague', icon: Gift },
          ]} onNavigate={onNavigate} />
        ) : (
          <>
            <Group title="Evaluation" items={[
              { to: '/evaluation', label: 'Your evaluation', icon: LayoutDashboard, end: true },
              { to: '/evaluation/tasks', label: 'Tasks', icon: ListChecks, badge: waiting },
              ...(s.path === 'own_data' ? [{ to: '/evaluation/data', label: 'Migration', icon: Database }] : []),
            ]} onNavigate={onNavigate} />
            <Group title="Accounting" items={[
              { to: '/evaluation/ledger', label: 'General Ledger', icon: BookOpenText },
              { to: '/evaluation/reconciliation', label: 'Reconciliation', icon: Scale },
              { to: '/evaluation/reporting', label: s.profile.entityCount > 1 ? 'Multi-Entity Reporting' : 'Reporting', icon: BarChart3 },
              { to: '/evaluation/approvals', label: 'Approvals', icon: ShieldCheck },
            ]} onNavigate={onNavigate} />
          </>
        )}
        <Group title="Internal" note="demo only" items={[
          { to: '/internal/sales', label: 'Growth & Sales Signals', icon: Radar },
          { to: '/internal/journeys', label: 'Engagement Journeys', icon: Megaphone },
          { to: '/internal/insights', label: 'Growth Insights', icon: LineChart },
          ...(!isCustomer ? [{ to: '/customer/referrals', label: 'Referral (post-purchase)', icon: Gift }] : []),
        ]} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas border border-line text-[11px] font-semibold text-ink-2">
            {fx.user.name.split(' ').map((p) => p[0]).join('')}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{fx.user.name}</div>
            <div className="truncate text-[11px] text-muted">{fx.user.role}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
