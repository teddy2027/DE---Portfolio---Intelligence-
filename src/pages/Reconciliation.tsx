import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Bot, Check, CheckCircle2, CircleSlash, FileSearch, Lock, RotateCcw, Scale, ShieldCheck, TriangleAlert, UserRound, X } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Kpi, PageHeader, SimTag } from '../components/common/ui';
import { Dialog, Drawer } from '../components/common/Dialog';
import { HelpPanel } from '../components/evaluation/HelpPanel';
import { AssistanceDialog } from '../components/evaluation/AssistanceDialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { dataAvailable, datasetName, reconFigures } from '../lib/evaluation/engine';
import { entryTotals } from '../lib/accounting/journal';
import { money, shortDateTime } from '../lib/format';

const REJECT_REASONS = ['The bank should reverse this fee', 'Wrong expense account', 'Belongs to a different period', 'Need more information'];

export function JournalEntryTable({ lines, caption }: { lines: { account: string; debit: number; credit: number; memo?: string }[]; caption: string }) {
  const t = entryTotals({ id: '', date: '', description: '', entity: '', preparedBy: '', status: 'prepared', lines });
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">Account</th><th scope="col" className="text-right">Debit</th><th scope="col" className="text-right">Credit</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.account}>
              <td><div className="font-medium">{l.account}</div>{l.memo && <div className="text-xs text-muted">{l.memo}</div>}</td>
              <td className="text-right num">{l.debit ? money(l.debit) : ''}</td>
              <td className="text-right num">{l.credit ? money(l.credit) : ''}</td>
            </tr>
          ))}
          <tr className="bg-canvas/60 font-semibold">
            <td className="flex items-center gap-1.5">Total {t.balanced
              ? <Badge tone="positive"><Check className="h-3 w-3" aria-hidden />Balanced</Badge>
              : <Badge tone="danger">Out of balance</Badge>}</td>
            <td className="text-right num">{money(t.debit)}</td>
            <td className="text-right num">{money(t.credit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Reconciliation() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const st = useDemoStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<'unmatched' | 'matched'>('unmatched');
  const [source, setSource] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState('');
  const [assist, setAssist] = useState(false);
  const available = dataAvailable(s);
  useEffect(() => { if (available && id !== 'customer') st.openReconciliation(); }, [available, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s.path) return <Navigate to="/evaluation" replace />;
  const fx = SCENARIOS[id].reconciliation;
  const rec = reconFigures(s);
  const r = s.reconciliation;
  const sample = s.path === 'sample';
  const entity = datasetName(s, fx.entity);
  const fee = fx.bankOnly[0];
  const decided = r.decision !== 'none';

  if (!available) {
    return (
      <div className="max-w-2xl anim-fade">
        <PageHeader title="Reconciliation" subtitle="Available once your sandbox data is ready for review." />
        <Card className="p-6 text-sm text-ink-2">
          <p>Your reconciliation uses your migrated data, so it opens when the simulated migration finishes.</p>
          <Button className="mt-4" variant="primary" onClick={() => nav('/evaluation/data')}>View migration status</Button>
        </Card>
      </div>
    );
  }

  const statusBadge = rec.reconciled
    ? <Badge tone="positive" dot>Reconciled</Badge>
    : r.status === 'adjustment_rejected' ? <Badge tone="danger" dot>Adjustment rejected · difference open</Badge>
    : <Badge tone="warning" dot>1 item prepared for review</Badge>;

  const approve = () => {
    setConfirmApprove(false);
    if (st.approveEntry()) nav('/evaluation/milestone');
  };

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<>{statusBadge}<SimTag>{sample ? 'Sample data · fictional' : 'Your data · simulated migration'}</SimTag></>}
        title={<span className="flex items-center gap-2"><Scale className="h-5 w-5 text-teal-700" aria-hidden />Bank reconciliation</span>}
        subtitle={`${entity} · ${fx.ledgerAccount} · ${fx.period} · ${fx.bankAccountLabel}`}
      />

      <Card className="p-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <Kpi label="General ledger balance" value={money(rec.ledgerBalance)} tip="Cash balance per the general ledger, including adjustments posted in this evaluation."
            hint={rec.ledgerBalance !== rec.ledgerBalanceBefore ? <>Was {money(rec.ledgerBalanceBefore)} before {fx.proposedEntry.id}</> : 'Before adjustments'} />
          <Kpi label="Bank statement balance" value={money(rec.bankBalance)} hint={`As of ${fee.date}, 2026`} />
          <Kpi label="Difference" value={money(rec.difference)} tone={rec.difference === 0 ? 'positive' : 'warning'} tip="Ledger balance minus bank balance. A reconciled account has no unexplained difference." hint={rec.difference === 0 ? 'Fully explained' : 'Unexplained'} />
          <Kpi label="Matched" value={rec.matchedCount} hint="ledger ↔ bank lines" />
          <Kpi label="Unmatched" value={rec.unmatchedCount} tone={rec.unmatchedCount ? 'warning' : 'positive'} hint={rec.unmatchedCount ? 'needs a decision' : 'none'} />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 min-w-0">
          {rec.reconciled ? (
            <div role="status" className="rounded-xl border border-positive-line bg-positive-bg px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-positive shrink-0" aria-hidden />
              <div className="flex-1 text-sm"><span className="font-semibold">Reconciled.</span> <span className="text-ink-2">Ledger and bank both show {money(rec.bankBalance)}. {fx.proposedEntry.id} was approved by {s.ledgerEntries.find((e) => e.id === fx.proposedEntry.id)?.approvedBy ?? 'you'} and posted.</span></div>
              {id !== 'customer' && <Button size="sm" variant="secondary" onClick={() => nav('/evaluation/milestone')} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>See what you validated</Button>}
            </div>
          ) : r.status === 'adjustment_rejected' ? (
            <div role="status" className="rounded-xl border border-danger-line bg-danger-bg px-4 py-3.5">
              <div className="flex gap-3 text-sm">
                <CircleSlash className="h-5 w-5 text-danger shrink-0" aria-hidden />
                <div>
                  <p><span className="font-semibold">Adjustment rejected. Nothing was posted.</span> <span className="text-ink-2">The ledger balance is unchanged at {money(rec.ledgerBalance)} and the {money(rec.difference)} difference remains open.</span></p>
                  {r.rejectionReason && <p className="mt-1 text-ink-2">Reason: “{r.rejectionReason}”</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:pl-8">
                <Button size="sm" variant="secondary" icon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={st.reopenEntry}>Reopen proposed entry</Button>
                <Button size="sm" variant="ghost" icon={<UserRound className="h-4 w-4" aria-hidden />} onClick={() => setAssist(true)}>Ask an accountant</Button>
              </div>
            </div>
          ) : null}

          {!rec.reconciled && (
            <Card aria-labelledby="exc-title" className={clsx(r.status === 'adjustment_rejected' && 'opacity-90')}>
              <CardHeader id="exc-title" title="Unmatched bank line" subtitle={fx.exceptionExplanation}
                right={<Badge tone="warning">Exception</Badge>} />
              <div className="mx-5 mb-4 rounded-lg border border-line">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                  <span className="text-muted">{fee.date}</span>
                  <span className="flex-1 font-medium min-w-[200px]">{fee.description}</span>
                  <code className="text-xs text-muted">{fee.reference}</code>
                  <span className="num font-semibold text-danger">{money(fee.amount)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas/50 px-4 py-2.5">
                  <Button size="sm" variant="secondary" icon={<FileSearch className="h-4 w-4" aria-hidden />} onClick={() => { st.inspectSource(); setSource(true); }}>Inspect source transaction</Button>
                  <span className="text-xs text-muted">{r.sourceInspected ? 'Inspected' : 'Not yet inspected'}</span>
                </div>
              </div>
            </Card>
          )}

          <Card aria-labelledby="je-title">
            <CardHeader id="je-title"
              title={<span className="flex items-center gap-2">Proposed journal entry <code className="text-[12px] font-normal text-muted">{fx.proposedEntry.id}</code></span>}
              subtitle={<span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" aria-hidden />Prepared by {fx.proposedEntry.preparedBy} · {fx.proposedEntry.date} · {datasetName(s, fx.proposedEntry.entity)}</span>}
              right={r.decision === 'approved' ? <Badge tone="positive"><Lock className="h-3 w-3" aria-hidden />Posted</Badge>
                : r.decision === 'rejected' ? <Badge tone="danger">Rejected · not posted</Badge>
                : <Badge tone="info">Prepared for review</Badge>} />
            <div className="px-5" onMouseEnter={() => !r.entryReviewed && st.reviewEntry()} onFocus={() => !r.entryReviewed && st.reviewEntry()}>
              <JournalEntryTable lines={fx.proposedEntry.lines} caption="Proposed journal entry lines" />
            </div>
            <div className="px-5 py-4 grid sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="label mb-1.5">Why the agent proposed this</div>
                <ul className="space-y-1.5 text-ink-2">{fx.agentReasoning.map((x) => <li key={x} className="flex gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 text-teal-700 shrink-0" aria-hidden />{x}</li>)}</ul>
              </div>
              <div>
                <div className="label mb-1.5">Effect if approved</div>
                <dl className="space-y-1 num">
                  <div className="flex justify-between"><dt className="text-muted">Ledger cash</dt><dd>{money(rec.ledgerBalanceBefore)} → {money(rec.ledgerBalanceBefore + fee.amount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Difference</dt><dd>{money(rec.ledgerBalanceBefore - rec.bankBalance)} → {money(0)}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-muted flex gap-1.5"><ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden />The agent cannot post this entry. It posts only after an authorized person approves.</p>
              </div>
            </div>
            {!decided && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas/50 px-5 py-3 rounded-b-xl">
                <Button variant="primary" icon={<Check className="h-4 w-4" aria-hidden />} onClick={() => setConfirmApprove(true)}>Approve and post</Button>
                <Button variant="danger" icon={<X className="h-4 w-4" aria-hidden />} onClick={() => setRejectOpen(true)}>Reject</Button>
                <Button variant="ghost" icon={<UserRound className="h-4 w-4" aria-hidden />} onClick={() => setAssist(true)}>Request help</Button>
                <span className="ml-auto text-xs text-muted">Requires your approval</span>
              </div>
            )}
          </Card>

          <Card aria-labelledby="txn-title">
            <CardHeader id="txn-title" title="Transactions" subtitle={`${fx.period} · opening balance ${money(fx.openingBalance)}`} />
            <div role="tablist" aria-label="Transaction filter" className="flex gap-1 px-5">
              {(['unmatched', 'matched'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={clsx('rounded-md px-2.5 py-1.5 text-[13px] font-medium', tab === t ? 'bg-teal-50 text-teal-800' : 'text-muted hover:text-ink hover:bg-canvas')}>
                  {t === 'unmatched' ? `Unmatched (${rec.unmatchedCount})` : `Matched (${rec.matchedCount})`}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto mt-2" role="tabpanel">
              <table className="table-base">
                <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th className="text-right">Ledger</th><th className="text-right">Bank</th><th>Status</th></tr></thead>
                <tbody>
                  {(tab === 'matched' ? [...fx.matched, ...(rec.reconciled ? fx.bankOnly : [])] : rec.reconciled ? [] : fx.bankOnly).map((t) => {
                    const bankOnly = fx.bankOnly.some((b) => b.id === t.id);
                    const ledgerAmt = bankOnly ? (rec.reconciled ? t.amount : null) : t.amount;
                    return (
                      <tr key={t.id} className="hover:bg-canvas/50">
                        <td className="whitespace-nowrap text-muted">{t.date}</td>
                        <td className="min-w-[220px]">{t.description}{bankOnly && rec.reconciled && <span className="ml-1.5 text-xs text-muted">via {fx.proposedEntry.id}</span>}</td>
                        <td><code className="text-xs text-muted">{t.reference}</code></td>
                        <td className="text-right num whitespace-nowrap">{ledgerAmt === null ? <span className="text-subtle">—</span> : money(ledgerAmt)}</td>
                        <td className="text-right num whitespace-nowrap">{money(t.amount)}</td>
                        <td>{bankOnly && !rec.reconciled ? <Badge tone="warning">Unmatched</Badge> : <Badge tone="positive"><Check className="h-3 w-3" aria-hidden />Matched</Badge>}</td>
                      </tr>
                    );
                  })}
                  {tab === 'unmatched' && rec.reconciled && <tr><td colSpan={6} className="py-8 text-center text-muted">No unmatched items. Every bank line has a ledger match.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <HelpPanel screen="reconciliation" compact />
          <Card aria-labelledby="audit-title">
            <CardHeader id="audit-title" title="Audit trail" subtitle="Who did what, and when." />
            <ol className="px-5 pb-4 space-y-2.5 text-[13px]">
              <li className="flex gap-2"><Bot className="h-3.5 w-3.5 mt-0.5 text-info shrink-0" aria-hidden /><span className="text-ink-2">{fx.proposedEntry.preparedBy} prepared {fx.proposedEntry.id} for review</span></li>
              {s.auditTrail.filter((a) => a.action.includes(fx.proposedEntry.id)).map((a) => (
                <li key={a.id} className="flex gap-2"><UserRound className="h-3.5 w-3.5 mt-0.5 text-teal-700 shrink-0" aria-hidden /><span className="text-ink-2">{a.actor}: {a.action}<span className="block text-xs text-muted">{shortDateTime(a.at)}</span></span></li>
              ))}
            </ol>
          </Card>
          <p className="text-xs text-muted px-1">Looking for the posted entry? <Link to="/evaluation/ledger" className="text-teal-700 hover:underline">Open General Ledger</Link></p>
        </div>
      </div>

      <Drawer open={source} onClose={() => setSource(false)} title="Source transaction" subtitle={`Bank statement line · ${fx.bankAccountLabel}`}>
        <div className="px-5 py-4 space-y-5 text-sm">
          <dl className="rounded-lg border border-line divide-y divide-line">
            {[['Date', `${fee.date}, 2026`], ['Description', fee.description], ['Reference', fee.reference], ['Amount', money(fee.amount)], ['Ledger match', 'None found (±5 days, ±$0.01)']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted">{k}</dt><dd className="font-medium text-right num">{v}</dd></div>
            ))}
          </dl>
          <div>
            <h3 className="label mb-1.5">Agent analysis</h3>
            <ul className="space-y-1.5 text-ink-2">{fx.agentReasoning.map((x) => <li key={x} className="flex gap-1.5"><Bot className="h-3.5 w-3.5 mt-0.5 text-info shrink-0" aria-hidden />{x}</li>)}</ul>
          </div>
          <p className="text-xs text-muted flex gap-1.5"><Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />Bank account details are masked in this demo. No real bank connection exists.</p>
          <Button variant="secondary" onClick={() => setSource(false)}>Back to reconciliation</Button>
        </div>
      </Drawer>

      <Dialog open={confirmApprove} onClose={() => setConfirmApprove(false)} title="Approve and post this entry?"
        description={`Posting ${fx.proposedEntry.id} records the ${money(Math.abs(fee.amount))} fee in the general ledger. It is recorded in the audit trail with your name.`}
        footer={<><Button variant="ghost" onClick={() => setConfirmApprove(false)}>Cancel</Button><Button variant="primary" data-autofocus onClick={approve} icon={<Check className="h-4 w-4" aria-hidden />}>Approve and post</Button></>}>
        <JournalEntryTable lines={fx.proposedEntry.lines} caption="Entry to approve" />
        <ul className="mt-3 space-y-1 text-[13px] text-ink-2">
          <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 text-positive" aria-hidden />Debits equal credits</li>
          <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 text-positive" aria-hidden />Clears the {money(Math.abs(fee.amount))} difference exactly</li>
          <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 text-positive" aria-hidden />Approver ({SCENARIOS[id].user.name}) is not the preparer</li>
        </ul>
        {sample && <p className="mt-3 text-xs text-muted">Sample workspace: this posts to fictional sample data only.</p>}
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} size="sm" title="Reject the proposed entry?"
        description="Nothing will be posted. The difference stays open until you resolve it another way."
        footer={<><Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { st.rejectEntry(note ? `${reason}. ${note}` : reason); setRejectOpen(false); }}>Reject entry</Button></>}>
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-medium text-ink-2 mb-2">Reason</legend>
          {REJECT_REASONS.map((x) => (
            <label key={x} className="flex items-center gap-2 text-sm"><input type="radio" name="reason" className="accent-teal-700" checked={reason === x} onChange={() => setReason(x)} />{x}</label>
          ))}
        </fieldset>
        <label htmlFor="rej-note" className="mt-4 block text-[13px] font-medium text-ink-2 mb-1.5">Note (optional)</label>
        <textarea id="rej-note" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="mt-3 text-xs text-muted flex gap-1.5"><TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />Your reason is recorded in the audit trail.</p>
      </Dialog>

      <AssistanceDialog open={assist} onClose={() => setAssist(false)} topic="Reconciliation difference" source="reconciliation" />
    </div>
  );
}
