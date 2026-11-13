import { useState } from 'react';
import { CheckCircle2, UserRound } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button, Field, SimTag } from '../common/ui';
import { useDemoStore } from '../../store/useDemoStore';

export function AssistanceDialog({ open, onClose, topic, source }: { open: boolean; onClose: () => void; topic: string; source: string }) {
  const request = useDemoStore((s) => s.requestAssistance);
  const [context, setContext] = useState('');
  const [done, setDone] = useState(false);
  const close = () => { onClose(); setTimeout(() => { setDone(false); setContext(''); }, 200); };
  return (
    <Dialog open={open} onClose={close} size="sm"
      title={done ? 'Request submitted' : 'Request accounting assistance'}
      description={done ? undefined : 'A DualEntry accountant reviews your question with the context of your evaluation.'}
      footer={done ? <Button variant="primary" onClick={close}>Done</Button> : (
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={() => { request(topic, context, source); setDone(true); }}>Submit request</Button>
        </>
      )}>
      {done ? (
        <div className="flex gap-3 rounded-xl bg-positive-bg border border-positive-line p-4">
          <CheckCircle2 className="h-5 w-5 text-positive shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-ink">Your request is in Tasks under “In progress”.</p>
            <p className="text-ink-2 mt-1">In this prototype no message is sent. In production, a CPA from the DualEntry team would pick this up and reply in the evaluation.</p>
            <SimTag className="mt-2">Simulated request</SimTag>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-canvas border border-line px-3 py-2.5 text-sm">
            <div className="label">Topic</div>
            <div className="font-medium mt-0.5">{topic}</div>
          </div>
          <Field label="What would you like help with? (optional)" htmlFor="assist-context" hint="Don't include bank account numbers or credentials.">
            <textarea id="assist-context" data-autofocus rows={3} className="input" value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. I want to confirm how the UK retained earnings variance should be treated." />
          </Field>
          <div className="flex items-center gap-2 text-xs text-muted"><UserRound className="h-3.5 w-3.5" aria-hidden />Shared with your evaluation team only. Not used for marketing.</div>
        </div>
      )}
    </Dialog>
  );
}
