import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Building2, CheckCircle2, Copy, ExternalLink, Gift, Lock, Mail, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Field, PageHeader, SimTag } from '../components/common/ui';
import { Dialog } from '../components/common/Dialog';
import { useActive, useDemoStore, SCENARIOS } from '../store/useDemoStore';
import { REFERRAL_PROGRAM_URL, referralEligibility, referralLink } from '../lib/referral/eligibility';

/** Post-purchase home for the customer scenario. */
export function CustomerHome() {
  const id = useDemoStore((s) => s.activeScenario);
  const nav = useNavigate();
  const st = useDemoStore();
  if (id !== 'customer') {
    return (
      <div className="max-w-xl anim-fade">
        <PageHeader title="Customer home" subtitle="This view belongs to the post-purchase scenario." />
        <Card className="p-5 text-sm text-ink-2"><p>Switch to the post-purchase scenario to see a customer after their first successful close.</p>
          <Button className="mt-4" variant="primary" onClick={() => { st.switchScenario('customer'); nav('/customer'); }}>Switch to post-purchase scenario</Button></Card>
      </div>
    );
  }
  const close = [
    { t: 'Bank reconciliations', d: '3 of 3 entities reconciled' },
    { t: 'Intercompany eliminations', d: 'Balanced' },
    { t: 'Consolidated reporting', d: 'Published to CFO' },
    { t: 'Close checklist', d: '41 of 41 tasks complete' },
  ];
  return (
    <div className="anim-fade">
      <PageHeader eyebrow={<><Badge tone="positive" dot>Customer</Badge><SimTag>Demo customer · fictional</SimTag></>}
        title="Your October close is complete."
        subtitle="All three entities closed and consolidated in DualEntry. Here’s the summary." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="October 2026 close" subtitle="First month-end close on DualEntry (illustrative)" right={<Badge tone="positive">Closed</Badge>} />
          <ul className="border-t border-line divide-y divide-line">
            {close.map((c) => <li key={c.t} className="flex items-center gap-3 px-5 py-3 text-sm"><CheckCircle2 className="h-4 w-4 text-positive" aria-hidden /><span className="flex-1 font-medium">{c.t}</span><span className="text-muted">{c.d}</span></li>)}
          </ul>
          <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-line">
            <Button variant="secondary" onClick={() => nav('/evaluation/reporting')}>View consolidated report</Button>
            <Button variant="ghost" onClick={() => nav('/evaluation/ledger')}>General Ledger</Button>
          </div>
        </Card>
        <ReferralCard compact />
      </div>
    </div>
  );
}

/** Light, secondary referral module. Only renders an invitation for eligible customers. */
function ReferralCard({ compact }: { compact?: boolean }) {
  const s = useActive();
  const id = useDemoStore((x) => x.activeScenario);
  const st = useDemoStore();
  const nav = useNavigate();
  const elig = referralEligibility(s.customer);
  const link = referralLink(SCENARIOS[id].account.id);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (elig.eligible) st.viewReferralPrompt(); }, [elig.eligible]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!elig.eligible) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard unavailable: the link stays selectable below */ }
    st.copyReferralLink(); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Card className="p-5 self-start" aria-labelledby="ref-title">
      <div className="flex items-center gap-2 text-teal-700"><Gift className="h-4 w-4" aria-hidden /><span className="text-xs font-medium">Referral program</span></div>
      <h2 id="ref-title" className="mt-2 text-[15px] font-semibold">Know another finance leader who’s outgrown their ERP?</h2>
      <p className="mt-1 text-[13px] text-muted">Invite a colleague to explore DualEntry. Eligible referrals may earn rewards when they become customers: $1,000 for you and $1,000 for them, under the program’s terms.</p>
      <div className="mt-3 flex items-center gap-2">
        <input readOnly value={link} aria-label="Your referral link (simulated)" className="input text-xs num" onFocus={(e) => e.target.select()} />
        <Button size="sm" variant="secondary" onClick={copy} icon={<Copy className="h-3.5 w-3.5" aria-hidden />} aria-live="polite">{copied ? 'Copied' : 'Copy'}</Button>
      </div>
      <p className="mt-1 text-[11px] text-muted">Simulated link for the demo. It does not track real referrals.</p>
      {compact
        ? <Button className="mt-3" variant="ghost" size="sm" onClick={() => nav('/customer/referrals')} iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>Invite by email and see status</Button>
        : null}
    </Card>
  );
}

export default function Referrals() {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const st = useDemoStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<'customer' | 'partner'>('customer');
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [err, setErr] = useState('');
  const fx = SCENARIOS[id];
  const elig = referralEligibility(s.customer);

  if (!elig.eligible) {
    return (
      <div className="max-w-2xl anim-fade">
        <PageHeader eyebrow={<Badge tone="neutral">Internal view</Badge>} title="Referral prompt not shown"
          subtitle={`${fx.account.name} is a prospect in evaluation. Referral moments appear only after a customer has succeeded with DualEntry.`} />
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Eligibility for a referral prompt</h2>
          <ul className="mt-3 space-y-2 text-sm">{elig.checks.map((c) => <li key={c.rule} className="flex gap-2">{c.pass ? <CheckCircle2 className="h-4 w-4 text-positive" aria-label="Met" /> : <XCircle className="h-4 w-4 text-danger" aria-label="Not met" />}{c.rule}</li>)}</ul>
          <p className="mt-4 text-[13px] text-muted">Asking a prospect for referrals before they have succeeded erodes trust and produces low-quality referrals.</p>
          <Button className="mt-4" variant="primary" onClick={() => { st.switchScenario('customer'); nav('/customer/referrals'); }}>Switch to post-purchase scenario</Button>
        </Card>
      </div>
    );
  }

  const submit = () => {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.company.trim()) return setErr('Enter a name, a valid email and a company.');
    st.prepareReferralInvite(form); setInvite(false); setForm({ name: '', email: '', company: '' }); setErr('');
  };

  const partnerOrgs = [
    { org: 'Quill & Co.', status: 'Evaluating', consent: 'Shared progress with adviser' },
    { org: 'Fernhill Studios', status: 'Invitation sent', consent: 'Not yet opted in' },
    { org: 'Kite Analytics', status: 'Customer', consent: 'Shared progress with adviser' },
  ];

  return (
    <div className="anim-fade">
      <PageHeader eyebrow={<><Badge tone="positive" dot>Customer</Badge><SimTag>Proposed referral experience · simulated</SimTag></>}
        title="Refer a colleague"
        subtitle="A light, optional way to share DualEntry after a successful close. Not part of evaluation." />
      <div role="tablist" aria-label="Referral variant" className="mb-4 flex gap-1.5">
        {(['customer', 'partner'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={clsx('rounded-lg border px-3 py-1.5 text-[13px] font-medium', tab === t ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-line text-ink-2 hover:bg-canvas')}>
            {t === 'customer' ? 'Customer' : 'Accounting adviser (partner)'}
          </button>
        ))}
      </div>

      {tab === 'customer' ? (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <ReferralCard />
            <Card className="p-5 text-[13px] text-ink-2 space-y-2">
              <h2 className="text-[14px] font-semibold text-ink">Why you’re seeing this</h2>
              <ul className="space-y-1">{elig.checks.map((c) => <li key={c.rule} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-positive shrink-0" aria-hidden />{c.rule}</li>)}</ul>
              <p className="text-xs text-muted pt-1">Milestone: {s.customer.successMilestone}</p>
            </Card>
          </div>
          <Card>
            <CardHeader title="Your referrals" subtitle="Status of colleagues you’ve invited"
              right={<Button size="sm" variant="primary" icon={<Mail className="h-4 w-4" aria-hidden />} onClick={() => setInvite(true)}>Invite by email</Button>} />
            <div className="overflow-x-auto border-t border-line">
              <table className="table-base">
                <thead><tr><th>Name</th><th>Company</th><th>Status</th></tr></thead>
                <tbody>
                  {s.referrals.map((r) => (
                    <tr key={r.id}><td className="font-medium">{r.name}<div className="text-xs text-muted font-normal">{r.email}</div></td><td>{r.company}</td>
                      <td>{r.status === 'prepared' ? <Badge tone="neutral">Prepared · not sent</Badge> : r.status === 'evaluating' ? <Badge tone="info">Evaluating</Badge> : r.status === 'customer' ? <Badge tone="positive">Customer</Badge> : <Badge tone="teal">Invited</Badge>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 text-xs text-muted space-y-1 border-t border-line">
              <p>Rewards follow DualEntry’s published referral program and its eligibility terms. Status here is simulated.</p>
              <a href={REFERRAL_PROGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline">Official referral program <ExternalLink className="h-3 w-3" aria-hidden /></a>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="p-5 self-start">
            <div className="flex items-center gap-2 text-teal-700"><Building2 className="h-4 w-4" aria-hidden /><span className="text-xs font-medium">For accounting advisers</span></div>
            <h2 className="mt-2 text-[15px] font-semibold">Share DualEntry with clients who are outgrowing their ERP</h2>
            <p className="mt-1 text-[13px] text-muted">Send a referral invitation. Clients choose whether to share their evaluation progress with you.</p>
            <Button className="mt-4 w-full" variant="primary" icon={<Mail className="h-4 w-4" aria-hidden />} onClick={() => setInvite(true)}>Share a referral invitation</Button>
          </Card>
          <Card>
            <CardHeader title="Referred organizations" subtitle="Status only. Evaluation details are visible only with the client’s opt-in." />
            <div className="overflow-x-auto border-t border-line">
              <table className="table-base">
                <thead><tr><th>Organization</th><th>Referral status</th><th>Client consent</th></tr></thead>
                <tbody>
                  {partnerOrgs.map((p) => (
                    <tr key={p.org}><td className="font-medium">{p.org}</td><td>{p.status}</td>
                      <td>{p.consent.startsWith('Shared') ? <Badge tone="positive"><ShieldCheck className="h-3 w-3" aria-hidden />{p.consent}</Badge> : <Badge tone="neutral"><Lock className="h-3 w-3" aria-hidden />{p.consent}</Badge>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-muted border-t border-line">Fictional organizations. Advisers never see a client’s ledger, balances or exceptions through the referral view.</p>
          </Card>
        </div>
      )}

      <Dialog open={invite} onClose={() => setInvite(false)} title="Invite a colleague" description="Preview only. No email is sent from this prototype."
        footer={<><Button variant="ghost" onClick={() => setInvite(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Prepare invitation</Button></>}>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name" htmlFor="rf-name"><input id="rf-name" data-autofocus className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" htmlFor="rf-email"><input id="rf-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="Company" htmlFor="rf-co"><input id="rf-co" className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="rounded-xl border border-line px-4 py-3 text-[13px] text-ink-2">
            <div className="label mb-1">Preview</div>
            <p><b>{fx.user.name}</b> ({fx.user.role}, {fx.account.name}) thinks DualEntry could help {form.company || 'your team'} close faster. We closed our first month on DualEntry across three entities.</p>
            <p className="mt-1.5 text-muted">If {form.company || 'your company'} becomes a customer, you may both be eligible for a $1,000 reward under the program terms.</p>
          </div>
          <p className="text-xs text-muted">Nothing about {fx.account.name}’s financial data is included in the invitation.</p>
        </div>
      </Dialog>
    </div>
  );
}
