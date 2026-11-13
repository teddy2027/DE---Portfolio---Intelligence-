import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Check, CheckCircle2, CornerUpLeft, FileText, Lock, ShieldCheck, UserRound, X } from 'lucide-react';
import { Badge, Button, Card, CardHeader, PageHeader, SimTag } from '../components/common/ui';
import { Dialog } from '../components/common/Dialog';
import { HelpPanel } from '../components/evaluation/HelpPanel';
import { JournalEntryTable } from './Reconciliation';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { dataAvailable, datasetName } from '../lib/evaluation/engine';
import { entryTotals } from '../lib/accounting/journal';
import { money, shortDateTime } from '../lib/format';

type Decision = 'approved' | 'rejected' | 'returned';

export default function Approvals() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const st = useDemoStore();
  const nav = useNavigate();
  const [pending, setPending] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  if (!s.path) return <Navigate to="/evaluation" replace />;
  if (!dataAvailable(s)) return <Navigate to="/evaluation/data" replace />;
  const fx = SCENARIOS[id].approval;
  const user = SCENARIOS[id].user;
  const a = s.approval;
  const totals = entryTotals(fx.entry);
  const sod = fx.preparer !== user.name;
  const decided = a.status !== 'pending';
  const controls = [
    { t: 'Entry balances', ok: totals.balanced },
    { t: `Routed to required approver (${fx.requiredApproverRole})`, ok: user.role === fx.requiredApproverRole },
    { t: 'Preparer and approver are different', ok: sod },
    { t: 'Supporting documents attached', ok: fx.supportingDocs.length > 0 },
    { t: 'Supporting documents opened by approver', ok: a.docsInspected },
  ];

  const submit = () => {
    if (pending !== 'approved' && !comment.trim()) return setErr('Add a comment so the preparer knows what to change.');
    st.decideApproval(pending!, comment.trim() || undefined);
    setPending(null); setComment(''); setErr('');
  };

  return (
    <div className="anim-fade">
      <PageHeader
        eyebrow={<>
          {a.status === 'pending' ? <Badge tone="info" dot>Awaiting your approval</Badge> : a.status === 'approved' ? <Badge tone="positive" dot>Approved · posted</Badge> : a.status === 'rejected' ? <Badge tone="danger" dot>Rejected · not posted</Badge> : <Badge tone="warning" dot>Returned to preparer · not posted</Badge>}
          <SimTag>{s.path === 'sample' ? 'Sample data · fictional' : id === 'customer' ? 'Demo customer data' : 'Your data · simulated migration'}</SimTag>
        </>}
        title={<span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden />{fx.kind === 'controls' ? 'Approval control' : 'Agent-prepared entry'}</span>}
        subtitle={`${fx.title} · ${money(fx.amount)}`}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader title={<span className="flex items-center gap-2">{fx.entry.description} <code className="text-[12px] font-normal text-muted">{fx.entry.id}</code></span>}
              subtitle={<span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" aria-hidden />Prepared by {fx.preparer} · {fx.entry.date} · {datasetName(s, fx.entry.entity)}</span>}
              right={decided ? (a.status === 'approved' ? <Badge tone="positive"><Lock className="h-3 w-3" aria-hidden />Posted</Badge> : <Badge tone="neutral">Not posted</Badge>) : <Badge tone="info">Prepared for review</Badge>} />
            <div className="px-5"><JournalEntryTable lines={fx.entry.lines} caption="Entry awaiting approval" /></div>
            <div className="grid sm:grid-cols-2 gap-4 px-5 py-4 text-[13px]">
              <div>
                <div className="label mb-1.5">Policy</div>
                <p className="text-ink-2">{fx.policy}</p>
                <div className="label mt-4 mb-1.5">Required approver</div>
                <p className="text-ink-2 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" aria-hidden />{fx.requiredApproverRole} · {user.name}</p>
              </div>
              <div>
                <div className="label mb-1.5">Agent reasoning</div>
                <ul className="space-y-1.5 text-ink-2">{fx.agentReasoning.map((x) => <li key={x} className="flex gap-1.5"><Bot className="h-3.5 w-3.5 mt-0.5 text-info shrink-0" aria-hidden />{x}</li>)}</ul>
                <p className="mt-2 text-xs text-muted">{fx.confidenceNote}</p>
              </div>
            </div>
            {!decided ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas/50 px-5 py-3 rounded-b-xl">
                <Button variant="primary" icon={<Check className="h-4 w-4" aria-hidden />} onClick={() => setPending('approved')}>Approve</Button>
                <Button variant="secondary" icon={<CornerUpLeft className="h-4 w-4" aria-hidden />} onClick={() => setPending('returned')}>Return for changes</Button>
                <Button variant="danger" icon={<X className="h-4 w-4" aria-hidden />} onClick={() => setPending('rejected')}>Reject</Button>
                {!a.docsInspected && <span className="ml-auto text-xs text-warning">Open the supporting documents before deciding</span>}
              </div>
            ) : (
              <div role="status" className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-line bg-positive-bg/50 px-5 py-3 rounded-b-xl text-sm">
                <CheckCircle2 className="h-4 w-4 text-positive shrink-0" aria-hidden />
                <span className="flex-1 text-ink-2">Decision recorded {a.decidedAt ? shortDateTime(a.decidedAt) : ''}. {a.status === 'approved' ? 'The entry is posted to the general ledger.' : 'Nothing was posted.'}{a.comment ? ` Comment: “${a.comment}”` : ''}</span>
                {id !== 'customer' && <Button size="sm" variant="secondary" onClick={() => nav('/evaluation')} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Back to evaluation</Button>}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Supporting documentation" subtitle="Fictional documents for the demo." />
            <ul className="border-t border-line divide-y divide-line">
              {fx.supportingDocs.map((d) => (
                <li key={d.name} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-4 w-4 text-muted shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0"><div className="text-[13.5px] font-medium">{d.name}</div><div className="text-xs text-muted">{a.docsInspected ? d.detail : 'Open to view details'}</div></div>
                </li>
              ))}
            </ul>
            {!a.docsInspected && <div className="px-5 py-3 border-t border-line"><Button size="sm" variant="secondary" onClick={st.inspectApprovalDocs}>Open supporting documents</Button></div>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Control checks</h2>
            <ul className="mt-3 space-y-2 text-[13px]">
              {controls.map((c) => <li key={c.t} className="flex gap-2">{c.ok ? <CheckCircle2 className="h-4 w-4 text-positive shrink-0" aria-label="Passed" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line-strong" aria-label="Not yet" />}{c.t}</li>)}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Audit trail" />
            <ol className="px-5 pb-4 space-y-2.5 text-[13px]">
              <li className="flex gap-2"><Bot className="h-3.5 w-3.5 mt-0.5 text-info shrink-0" aria-hidden /><span className="text-ink-2">{fx.preparer} prepared {fx.entry.id} and routed it to {fx.requiredApproverRole}</span></li>
              {s.auditTrail.filter((x) => x.action.includes(fx.entry.id) || x.action.includes('supporting')).map((x) => (
                <li key={x.id} className="flex gap-2"><UserRound className="h-3.5 w-3.5 mt-0.5 text-teal-700 shrink-0" aria-hidden /><span className="text-ink-2">{x.actor}: {x.action}<span className="block text-xs text-muted">{shortDateTime(x.at)}</span></span></li>
              ))}
            </ol>
          </Card>
          <HelpPanel screen="approvals" compact />
        </div>
      </div>

      <Dialog open={!!pending} onClose={() => { setPending(null); setErr(''); }} size="sm"
        title={pending === 'approved' ? 'Approve and post?' : pending === 'rejected' ? 'Reject this entry?' : 'Return to preparer?'}
        description={pending === 'approved' ? `${fx.entry.id} will post to the general ledger and the decision is recorded with your name.` : 'Nothing will be posted. Your comment is recorded in the audit trail.'}
        footer={<><Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button><Button variant={pending === 'approved' ? 'primary' : pending === 'rejected' ? 'danger' : 'secondary'} onClick={submit}>{pending === 'approved' ? 'Approve and post' : pending === 'rejected' ? 'Reject' : 'Return'}</Button></>}>
        {!a.docsInspected && pending === 'approved' && <p className="mb-3 rounded-lg bg-warning-bg border border-warning-line px-3 py-2 text-[13px] text-warning">You haven’t opened the supporting documents. You can still approve; this is recorded.</p>}
        <label htmlFor="appr-comment" className="block text-[13px] font-medium text-ink-2 mb-1.5">Comment {pending === 'approved' ? '(optional)' : '(required)'}</label>
        <textarea id="appr-comment" data-autofocus rows={3} className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
        {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
      </Dialog>
    </div>
  );
}
