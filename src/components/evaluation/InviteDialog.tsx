import { useState } from 'react';
import { CheckCircle2, Eye } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button, Field, SimTag } from '../common/ui';
import { useDemoStore, useActive, SCENARIOS } from '../../store/useDemoStore';
import { goalShort } from '../../lib/labels';
import { proofPoints } from '../../lib/evaluation/engine';

export function InviteDialog({ open, onClose, source = 'invite', defaultRole }: { open: boolean; onClose: () => void; source?: string; defaultRole?: string }) {
  const id = useDemoStore((s) => s.activeScenario);
  const s = useActive();
  const invite = useDemoStore((x) => x.inviteStakeholder);
  const fx = SCENARIOS[id];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(defaultRole ?? (id === 'startup' ? 'CEO' : 'CFO'));
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const close = () => { onClose(); setTimeout(() => { setDone(false); setName(''); setEmail(''); setErr(''); }, 200); };
  const submit = () => {
    if (!name.trim()) return setErr('Enter a name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    invite({ name: name.trim(), email: email.trim(), role }, source);
    setDone(true);
  };
  const proofs = proofPoints(s);
  return (
    <Dialog open={open} onClose={close} title={done ? 'Invitation prepared' : 'Invite a colleague to the evaluation'}
      description={done ? undefined : 'They see your evaluation goal and progress. Access to data follows the permissions you set.'}
      footer={done ? <Button variant="primary" onClick={close}>Done</Button> : (<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" onClick={submit}>Prepare invitation</Button></>)}>
      {done ? (
        <div className="flex gap-3 rounded-xl bg-positive-bg border border-positive-line p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-positive shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{name} ({role}) is added to the evaluation as “Invited”.</p>
            <p className="text-ink-2 mt-1">No email was sent. This prototype does not connect to an email service.</p>
            <SimTag className="mt-2">Simulated invitation</SimTag>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name" htmlFor="inv-name"><input id="inv-name" data-autofocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
            <Field label="Work email" htmlFor="inv-email"><input id="inv-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.example" /></Field>
          </div>
          <Field label="Role" htmlFor="inv-role">
            <select id="inv-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {['CFO', 'CEO', 'Controller', 'Accounting Manager', 'Outside accountant', 'IT / Systems'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="rounded-xl border border-line">
            <div className="flex items-center gap-1.5 border-b border-line px-3 py-2 label"><Eye className="h-3 w-3" aria-hidden />Invitation preview</div>
            <div className="px-3 py-3 text-sm text-ink-2 space-y-1.5">
              <p><span className="font-medium text-ink">{fx.user.name}</span> invited you to {fx.account.name}'s DualEntry evaluation.</p>
              <p>Goal: {goalShort(s.profile.goal)}. {proofs.length ? `Validated so far: ${proofs.join('; ').toLowerCase()}.` : 'The evaluation has just started.'}</p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
