import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, LifeBuoy, UserRound } from 'lucide-react';
import { Card, CardHeader } from '../common/ui';
import { Drawer } from '../common/Dialog';
import { AssistanceDialog } from './AssistanceDialog';
import { useActive, useDemoStore } from '../../store/useDemoStore';
import { recommendHelp, HELP_ARTICLES } from '../../lib/help/recommend';
import type { HelpItem } from '../../types';

export function HelpPanel({ screen = 'hub', compact }: { screen?: Parameters<typeof recommendHelp>[1]; compact?: boolean }) {
  const s = useActive();
  const trackHelp = useDemoStore((x) => x.trackHelp);
  const nav = useNavigate();
  const items = recommendHelp(s, screen);
  const [assist, setAssist] = useState<string | null>(null);
  const [article, setArticle] = useState<string | null>(null);
  const key = items.map((i) => i.id).join(',');
  useEffect(() => { items.forEach((i) => trackHelp('viewed', i.id, screen)); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (h: HelpItem) => {
    trackHelp('accepted', h.id, screen);
    if (h.action.kind === 'assist') setAssist(h.action.topic ?? h.title);
    else if (h.action.kind === 'explain') setArticle(h.action.topic ?? null);
    else if (h.action.route) nav(h.action.route);
  };
  const a = article ? HELP_ARTICLES[article] : null;

  return (
    <Card aria-labelledby="help-title">
      <CardHeader id="help-title" title={<span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-teal-700" aria-hidden />Help for where you are</span>}
        subtitle={compact ? undefined : 'Based on your goal, progress and anything blocking you.'} />
      <ul className="px-3 pb-3 space-y-1">
        {items.map((h) => (
          <li key={h.id} className="rounded-lg px-2 py-2.5 hover:bg-canvas/70">
            <div className="text-[13.5px] font-medium text-ink">{h.title}</div>
            {!compact && <p className="text-[13px] text-muted mt-0.5 leading-[18px]">{h.body}</p>}
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => act(h)} className="inline-flex items-center gap-1 text-[13px] font-medium text-teal-700 hover:text-teal-900 hover:underline underline-offset-2">
                {h.action.kind === 'assist' ? <UserRound className="h-3.5 w-3.5" aria-hidden /> : h.action.kind === 'explain' ? <BookOpen className="h-3.5 w-3.5" aria-hidden /> : null}
                {h.action.label}{h.action.kind === 'route' && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
              </button>
              <span className="text-[11px] text-subtle italic">Shown because: {h.reason.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}</span>
            </div>
          </li>
        ))}
      </ul>
      <AssistanceDialog open={!!assist} onClose={() => setAssist(null)} topic={assist ?? ''} source={screen} />
      <Drawer open={!!a} onClose={() => setArticle(null)} title={a?.title ?? ''} subtitle="DualEntry evaluation guide">
        <div className="px-5 py-4 space-y-3 text-sm text-ink-2 leading-6">
          {a?.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <button onClick={() => { setArticle(null); setAssist(a?.title ?? 'Question'); }} className="mt-2 inline-flex items-center gap-1.5 text-teal-700 font-medium hover:underline">
            <UserRound className="h-4 w-4" aria-hidden />Still unsure? Ask a DualEntry accountant
          </button>
        </div>
      </Drawer>
    </Card>
  );
}
