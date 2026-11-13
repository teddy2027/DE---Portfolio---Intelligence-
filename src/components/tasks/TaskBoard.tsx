import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Bot, CheckCircle2, Circle, CircleDot, Hand, Users, ArrowUpRight, TriangleAlert } from 'lucide-react';
import { Badge } from '../common/ui';
import type { EvalTask, TaskColumn } from '../../lib/evaluation/engine';

export const COLUMNS: { id: TaskColumn; label: string; icon: React.ElementType }[] = [
  { id: 'todo', label: 'To do', icon: Circle },
  { id: 'in_progress', label: 'In progress', icon: CircleDot },
  { id: 'waiting_on_me', label: 'Waiting on me', icon: Hand },
  { id: 'done', label: 'Done', icon: CheckCircle2 },
];

export function TaskCard({ t }: { t: EvalTask }) {
  const body = (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className={clsx('text-[13px] font-medium leading-[18px]', t.column === 'done' ? 'text-ink-2' : 'text-ink')}>{t.title}</div>
          <div className="text-xs text-muted mt-0.5 leading-4">{t.detail}</div>
        </div>
        {t.route && <ArrowUpRight className="h-3.5 w-3.5 text-subtle shrink-0 mt-0.5 group-hover:text-teal-700" aria-hidden />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {t.blocked && <Badge tone="danger"><TriangleAlert className="h-3 w-3" aria-hidden />Blocked</Badge>}
        <Badge tone={t.source === 'Agent' ? 'info' : t.source === 'DualEntry team' ? 'teal' : 'neutral'}>
          {t.source === 'Agent' ? <Bot className="h-3 w-3" aria-hidden /> : t.source === 'DualEntry team' ? <Users className="h-3 w-3" aria-hidden /> : null}{t.source}
        </Badge>
        <span className="text-[11px] text-muted">{t.assignee}</span>
      </div>
      {t.verifiedBy && <div className="mt-1.5 text-[11px] text-positive">Verified by <code className="font-medium">{t.verifiedBy}</code></div>}
    </>
  );
  const cls = 'group block rounded-lg border border-line bg-white p-2.5 shadow-card transition hover:border-line-strong';
  return t.route ? <Link to={t.route} className={cls} aria-label={`${t.title}. ${COLUMNS.find((c) => c.id === t.column)?.label}`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function TaskBoard({ tasks, compact }: { tasks: EvalTask[]; compact?: boolean }) {
  return (
    <div className={clsx('grid gap-3', compact ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4')}>
      {COLUMNS.map((c) => {
        const list = tasks.filter((t) => t.column === c.id);
        return (
          <section key={c.id} aria-labelledby={`col-${c.id}`} className="rounded-xl bg-canvas border border-line p-2">
            <h3 id={`col-${c.id}`} className="flex items-center gap-1.5 px-1.5 py-1 text-[12.5px] font-semibold text-ink-2">
              <c.icon className={clsx('h-3.5 w-3.5', c.id === 'done' ? 'text-positive' : c.id === 'waiting_on_me' ? 'text-teal-700' : 'text-muted')} aria-hidden />
              {c.label}<span className="ml-auto text-[11px] font-medium text-muted num">{list.length}</span>
            </h3>
            <div className="mt-1 space-y-2 min-h-[52px]">
              {list.length ? list.map((t) => <TaskCard key={t.id} t={t} />) : <div className="px-2 py-3 text-xs text-subtle">Nothing here</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
