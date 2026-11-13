import { Navigate } from 'react-router-dom';
import { BookOpenText, Lock } from 'lucide-react';
import { Badge, Card, CardHeader, PageHeader, SimTag } from '../components/common/ui';
import { JournalEntryTable } from './Reconciliation';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { dataAvailable, datasetName, reconFigures } from '../lib/evaluation/engine';
import { money, shortDateTime } from '../lib/format';

export default function Ledger() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  if (!s.path) return <Navigate to="/evaluation" replace />;
  if (!dataAvailable(s)) return <Navigate to="/evaluation/data" replace />;
  const fx = SCENARIOS[id];
  const rec = reconFigures(s);
  const pending = [
    ...(s.reconciliation.decision !== 'approved' ? [{ e: fx.reconciliation.proposedEntry, status: s.reconciliation.decision === 'rejected' ? 'Rejected' : 'Prepared for review' }] : []),
    ...(s.approval.status !== 'approved' ? [{ e: fx.approval.entry, status: s.approval.status === 'pending' ? 'Prepared for review' : s.approval.status === 'rejected' ? 'Rejected' : 'Returned to preparer' }] : []),
  ];
  return (
    <div className="anim-fade">
      <PageHeader eyebrow={<SimTag>{s.path === 'sample' ? 'Sample data · fictional' : id === 'customer' ? 'Demo customer data' : 'Your data · simulated migration'}</SimTag>}
        title={<span className="flex items-center gap-2"><BookOpenText className="h-5 w-5 text-teal-700" aria-hidden />General Ledger</span>}
        subtitle="Entries posted during this evaluation, and entries that were prepared but not posted." />
      <Card className="p-5 mb-4">
        <div className="flex flex-wrap gap-8 text-sm">
          <div><div className="label">{fx.reconciliation.ledgerAccount}</div><div className="mt-1 text-[20px] font-semibold num">{money(rec.ledgerBalance)}</div><div className="text-xs text-muted">{datasetName(s, fx.reconciliation.entity)} · Oct 31, 2026</div></div>
          <div><div className="label">Posted in evaluation</div><div className="mt-1 text-[20px] font-semibold num">{s.ledgerEntries.length}</div></div>
          <div><div className="label">Prepared, not posted</div><div className="mt-1 text-[20px] font-semibold num">{pending.length}</div></div>
        </div>
      </Card>
      <div className="space-y-4">
        {s.ledgerEntries.map((e) => (
          <Card key={e.id}>
            <CardHeader title={<span className="flex items-center gap-2">{e.description}<code className="text-[12px] font-normal text-muted">{e.id}</code></span>}
              subtitle={`${datasetName(s, e.entity)} · ${e.date} · prepared by ${e.preparedBy} · approved by ${e.approvedBy}${e.postedAt ? ` · ${shortDateTime(e.postedAt)}` : ''}`}
              right={<Badge tone="positive"><Lock className="h-3 w-3" aria-hidden />Posted</Badge>} />
            <div className="px-5 pb-4"><JournalEntryTable lines={e.lines} caption={`Lines for ${e.id}`} /></div>
          </Card>
        ))}
        {pending.map(({ e, status }) => (
          <Card key={e.id} className="border-dashed">
            <CardHeader title={<span className="flex items-center gap-2">{e.description}<code className="text-[12px] font-normal text-muted">{e.id}</code></span>}
              subtitle={`${datasetName(s, e.entity)} · not in the ledger balance`} right={<Badge tone={status === 'Rejected' ? 'danger' : 'info'}>{status}</Badge>} />
          </Card>
        ))}
      </div>
    </div>
  );
}
