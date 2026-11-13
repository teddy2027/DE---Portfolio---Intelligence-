import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { BarChart3, Check, CheckCircle2, CircleDashed, GitMerge, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, CardHeader, InfoTip, PageHeader, SimTag } from '../components/common/ui';
import { Drawer } from '../components/common/Dialog';
import { HelpPanel } from '../components/evaluation/HelpPanel';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { consolidate, entityLocal, entityUSD, type IncomeStatement } from '../lib/accounting/consolidation';
import { dataAvailable, datasetName } from '../lib/evaluation/engine';
import { acct } from '../lib/format';

const ROWS: { key: keyof IncomeStatement; label: string; strong?: boolean; ic?: boolean; tip?: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'icIncome', label: 'Intercompany management fee income', ic: true, tip: 'Fees charged by one group entity to another. Eliminated on consolidation.' },
  { key: 'cogs', label: 'Cost of revenue' },
  { key: 'grossProfit', label: 'Gross profit', strong: true },
  { key: 'salesMarketing', label: 'Sales & marketing' },
  { key: 'rnd', label: 'Research & development' },
  { key: 'ga', label: 'General & administrative' },
  { key: 'icExpense', label: 'Intercompany management fee expense', ic: true },
  { key: 'totalOpex', label: 'Total operating expenses', strong: true },
  { key: 'operatingIncome', label: 'Operating income', strong: true },
];
const sign = (k: keyof IncomeStatement, v: number) => (['cogs', 'salesMarketing', 'rnd', 'ga', 'icExpense', 'totalOpex'].includes(k) ? -v : v);

export default function Reporting() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const st = useDemoStore();
  const fx = SCENARIOS[id].consolidation;
  const [view, setView] = useState<string>('consolidated');
  const [included, setIncluded] = useState<string[]>(fx.entities.map((e) => e.id));
  const [elimsOpen, setElimsOpen] = useState(false);
  const available = dataAvailable(s) || id === 'customer';
  const multi = fx.entities.length > 1;
  useEffect(() => { if (available && view === 'consolidated') st.viewConsolidated(); }, [available]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setIncluded(fx.entities.map((e) => e.id)); setView('consolidated'); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cons = useMemo(() => consolidate(fx, included), [fx, included]);
  if (!s.path) return <Navigate to="/evaluation" replace />;
  if (!available) return <Navigate to="/evaluation/data" replace />;

  const select = (v: string) => { setView(v); if (v === 'consolidated') st.viewConsolidated(); else st.viewEntity(v); };
  const name = (n: string) => datasetName(s, n);
  const ent = fx.entities.find((e) => e.id === view);
  const c = s.consolidation;
  const needEntities = Math.min(2, fx.entities.length);
  const partialElims = !cons.eliminationsBalance;
  const icPairs = fx.entities.filter((e) => e.lines.icExpense > 0);
  const parent = fx.entities.find((e) => e.lines.icIncome > 0);

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<>{c.completed ? <Badge tone="positive" dot>Reviewed</Badge> : <Badge tone="info" dot>In review</Badge>}<SimTag>{s.path === 'sample' ? 'Sample data · fictional' : id === 'customer' ? 'Demo customer data' : 'Your data · simulated migration'}</SimTag></>}
        title={<span className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-700" aria-hidden />{multi ? 'Consolidated income statement' : 'Income statement'}</span>}
        subtitle={`${fx.period} · ${multi ? `${fx.entities.length} entities · presented in USD at period-average rates` : name(fx.entities[0].name)}`}
        right={multi ? <Button variant="secondary" icon={<GitMerge className="h-4 w-4" aria-hidden />} onClick={() => { setElimsOpen(true); st.inspectEliminations(); }}>Inspect eliminations</Button> : undefined}
      />

      {multi && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Reporting view">
          <button role="tab" aria-selected={view === 'consolidated'} onClick={() => select('consolidated')}
            className={clsx('rounded-lg border px-3 py-1.5 text-[13px] font-medium', view === 'consolidated' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>Consolidated</button>
          {fx.entities.map((e) => (
            <button key={e.id} role="tab" aria-selected={view === e.id} onClick={() => select(e.id)}
              className={clsx('rounded-lg border px-3 py-1.5 text-[13px] font-medium inline-flex items-center gap-1.5', view === e.id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>
              {e.shortName}<span className={clsx('text-[11px]', view === e.id ? 'text-white/70' : 'text-muted')}>{e.currency}</span>
              {c.entitiesViewed.includes(e.id) && <Check className="h-3 w-3" aria-label="Reviewed" />}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 min-w-0">
          {view === 'consolidated' || !multi ? (
            <Card>
              <CardHeader title={multi ? 'Consolidated view' : 'Income statement'} subtitle={multi ? `${included.length} of ${fx.entities.length} entities included` : 'USD'}
                right={partialElims ? <Badge tone="warning"><TriangleAlert className="h-3 w-3" aria-hidden />Eliminations incomplete</Badge> : multi ? <Badge tone="positive"><Check className="h-3 w-3" aria-hidden />Eliminations balance</Badge> : undefined} />
              <div className="overflow-x-auto border-t border-line">
                <table className="table-base">
                  <caption className="sr-only">Income statement by entity with eliminations</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="min-w-[230px]">Line</th>
                      {multi && fx.entities.filter((e) => included.includes(e.id)).map((e) => <th key={e.id} scope="col" className="text-right whitespace-nowrap">{e.shortName}</th>)}
                      {multi && <th scope="col" className="text-right">Elims</th>}
                      <th scope="col" className="text-right whitespace-nowrap">{multi ? 'Consolidated' : 'USD'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => {
                      const elim = r.key === 'icIncome' ? -(cons.combined.icIncome - cons.consolidated.icIncome) : r.key === 'icExpense' ? -(cons.combined.icExpense - cons.consolidated.icExpense) : 0;
                      return (
                        <tr key={r.key} className={clsx(r.strong && 'bg-canvas/60 font-semibold', r.ic && 'text-ink-2')}>
                          <th scope="row" className="text-left font-[inherit] px-3 py-2.5 border-b border-line">
                            <span className="inline-flex items-center gap-1">{r.label}{r.tip && <InfoTip text={r.tip} label={`About ${r.label}`} />}</span>
                          </th>
                          {multi && fx.entities.filter((e) => included.includes(e.id)).map((e) => <td key={e.id} className="text-right num whitespace-nowrap">{acct(sign(r.key, entityUSD(e)[r.key]))}</td>)}
                          {multi && <td className="text-right num whitespace-nowrap text-info">{elim ? acct(sign(r.key, elim)) : ''}</td>}
                          <td className="text-right num whitespace-nowrap font-semibold">{acct(sign(r.key, cons.consolidated[r.key]))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {multi && <p className="px-5 py-3 text-xs text-muted">Entity columns shown in USD. Select an entity above to see local currency and the rate used.</p>}
            </Card>
          ) : ent && (
            <Card>
              <CardHeader title={name(ent.name)} subtitle={`${ent.country} · functional currency ${ent.currency}`}
                right={<Badge tone="neutral">Avg rate {ent.fxRate} USD/{ent.currency}</Badge>} />
              <div className="overflow-x-auto border-t border-line">
                <table className="table-base">
                  <caption className="sr-only">Entity income statement in local currency and USD</caption>
                  <thead><tr><th scope="col">Line</th><th scope="col" className="text-right">{ent.currency}</th><th scope="col" className="text-right">USD</th></tr></thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.key} className={clsx(r.strong && 'bg-canvas/60 font-semibold')}>
                        <th scope="row" className="text-left font-[inherit] px-3 py-2.5 border-b border-line">{r.label}</th>
                        <td className="text-right num">{acct(sign(r.key, entityLocal(ent)[r.key]), ent.currency)}</td>
                        <td className="text-right num">{acct(sign(r.key, entityUSD(ent)[r.key]))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {multi && (
            <Card>
              <CardHeader title="Entities included" subtitle="Excluding an entity shows how eliminations depend on both sides of each intercompany pair." />
              <div className="flex flex-wrap gap-2 px-5 pb-4">
                {fx.entities.map((e) => {
                  const on = included.includes(e.id);
                  return (
                    <label key={e.id} className={clsx('inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] cursor-pointer', on ? 'border-teal-600 bg-teal-50' : 'border-line text-muted')}>
                      <input type="checkbox" className="accent-teal-700" checked={on}
                        onChange={() => setIncluded(on ? (included.length > 1 ? included.filter((x) => x !== e.id) : included) : [...included, e.id])} />
                      {name(e.name)}
                    </label>
                  );
                })}
              </div>
              {partialElims && <p className="px-5 pb-4 text-[13px] text-warning flex gap-1.5"><TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />One side of an intercompany pair is excluded, so the remaining intercompany balance cannot be fully eliminated.</p>}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5" aria-labelledby="review-title">
            <h2 id="review-title" className="text-[15px] font-semibold">Review progress</h2>
            <p className="text-xs text-muted mt-0.5">Completes automatically from what you open.</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {[
                { ok: c.consolidatedViewed, t: multi ? 'Viewed the consolidated statement' : 'Viewed the income statement' },
                ...(multi ? [
                  { ok: c.eliminationsInspected, t: 'Inspected intercompany eliminations' },
                  { ok: c.entitiesViewed.length >= needEntities, t: `Reviewed entity detail (${Math.min(c.entitiesViewed.length, needEntities)} of ${needEntities})` },
                ] : []),
              ].map((x) => (
                <li key={x.t} className="flex gap-2">{x.ok ? <CheckCircle2 className="h-4 w-4 text-positive shrink-0" aria-label="Done" /> : <CircleDashed className="h-4 w-4 text-subtle shrink-0" aria-label="Not yet" />}<span className={x.ok ? 'text-ink-2' : 'text-ink'}>{x.t}</span></li>
              ))}
            </ul>
            {c.completed && <p role="status" className="mt-3 rounded-lg bg-positive-bg border border-positive-line px-3 py-2 text-[13px] text-positive">Reporting review complete. Your Tasks have been updated.</p>}
          </Card>
          <HelpPanel screen="reporting" compact />
        </div>
      </div>

      <Drawer open={elimsOpen} onClose={() => setElimsOpen(false)} title="Intercompany eliminations" subtitle={fx.period}>
        <div className="px-5 py-4 space-y-4 text-sm">
          <p className="text-ink-2">{fx.eliminationNote}</p>
          <table className="table-base border border-line rounded-lg">
            <thead><tr><th>Counterparty</th><th className="text-right">Local</th><th className="text-right">USD</th></tr></thead>
            <tbody>
              {icPairs.map((e) => (
                <tr key={e.id}><td>{name(e.name)}</td><td className="text-right num">{acct(e.lines.icExpense, e.currency)}</td><td className="text-right num">{acct(entityUSD(e).icExpense)}</td></tr>
              ))}
              <tr className="font-semibold bg-canvas/60"><td>Total expense recorded by subsidiaries</td><td /><td className="text-right num">{acct(icPairs.reduce((a, e) => a + entityUSD(e).icExpense, 0))}</td></tr>
              <tr className="font-semibold bg-canvas/60"><td>Income recorded by {parent ? name(parent.shortName) : 'parent'}</td><td /><td className="text-right num">{acct(parent ? entityUSD(parent).icIncome : 0)}</td></tr>
            </tbody>
          </table>
          <p className={clsx('rounded-lg px-3 py-2 text-[13px]', cons.eliminationsBalance ? 'bg-positive-bg text-positive border border-positive-line' : 'bg-warning-bg text-warning border border-warning-line')}>
            {cons.eliminationsBalance ? 'Both sides agree, so the full amount eliminates. Consolidated intercompany income and expense are zero.' : 'With some entities excluded, the pair does not fully eliminate.'}
          </p>
          <p className="text-xs text-muted">Rates are illustrative period averages for the demo, not market data.</p>
        </div>
      </Drawer>
    </div>
  );
}
