import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Send, ShieldCheck } from 'lucide-react';
import { Drawer } from '../common/Dialog';
import { Badge } from '../common/ui';
import { useDemoStore } from '../../store/useDemoStore';
import { SCENARIOS, ALL_SCENARIOS } from '../../data/scenarios';
import { toCrmPayload } from '../../lib/analytics/catalog';
import { clockTime } from '../../lib/format';
import type { EventCategory } from '../../types';

const CATS: (EventCategory | 'all')[] = ['all', 'entry', 'migration', 'activation', 'engagement', 'sales', 'referral'];

export function EventInspector() {
  const open = useDemoStore((s) => s.inspectorOpen);
  const setOpen = useDemoStore((s) => s.setInspectorOpen);
  const events = useDemoStore((s) => s.events);
  const activeId = useDemoStore((s) => s.activeScenario);
  const [cat, setCat] = useState<EventCategory | 'all'>('all');
  const [scope, setScope] = useState<'active' | 'all'>('active');
  const [expanded, setExpanded] = useState<string | null>(null);
  const accountNames = Object.fromEntries(ALL_SCENARIOS.map((id) => [SCENARIOS[id].account.id, SCENARIOS[id].account.name + (id === 'customer' ? ' (customer)' : '')]));

  const list = useMemo(() => events
    .filter((e) => cat === 'all' || e.category === cat)
    .filter((e) => scope === 'all' || e.accountId === SCENARIOS[activeId].account.id)
    .slice().reverse(), [events, cat, scope, activeId]);

  return (
    <Drawer open={open} onClose={() => setOpen(false)} width="lg" title="Product event stream"
      subtitle="Every meaningful action emits an event. Lifecycle and Sales logic read from this same stream. Nothing leaves the browser.">
      <div className="sticky top-0 z-10 bg-white border-b border-line px-5 py-3 space-y-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by category">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              className={clsx('rounded-md px-2 py-1 text-xs font-medium capitalize border', cat === c ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>{c}</button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={scope === 'all'} onChange={(e) => setScope(e.target.checked ? 'all' : 'active')} className="accent-teal-700" />
            Show all accounts
          </label>
          <span className="num">{list.length} events</span>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">No events yet. Interact with the evaluation to see the stream.</div>
      ) : (
        <ol className="divide-y divide-line">
          {list.map((e) => (
            <li key={e.eventId}>
              <button className="w-full px-5 py-2.5 text-left hover:bg-canvas/70" aria-expanded={expanded === e.eventId} onClick={() => setExpanded(expanded === e.eventId ? null : e.eventId)}>
                <div className="flex items-center gap-2">
                  <code className="text-[12.5px] font-medium text-ink">{e.eventName}</code>
                  {e.crmForwarded && <Badge tone="info"><Send className="h-3 w-3" aria-hidden />CRM signal</Badge>}
                  {e.meaningful && <Badge tone="teal">meaningful</Badge>}
                  <span className="ml-auto text-[11px] text-muted num">{clockTime(e.timestamp)}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted">{accountNames[e.accountId] ?? e.accountId} · {e.sourceScreen} · {e.category}</div>
              </button>
              {expanded === e.eventId && (
                <div className="px-5 pb-3 grid gap-2">
                  <div>
                    <div className="label mb-1">Product analytics payload</div>
                    <pre className="rounded-lg bg-canvas border border-line p-3 text-[11.5px] leading-4 overflow-x-auto">{JSON.stringify(e, null, 2)}</pre>
                  </div>
                  {e.crmForwarded && (
                    <div>
                      <div className="label mb-1 flex items-center gap-1"><ShieldCheck className="h-3 w-3" aria-hidden />CRM payload (allow-listed, simulated)</div>
                      <pre className="rounded-lg bg-info-bg/60 border border-info-line p-3 text-[11.5px] leading-4 overflow-x-auto">{JSON.stringify(toCrmPayload(e), null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}
