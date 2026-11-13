import { Navigate } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { PageHeader } from '../components/common/ui';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { useActive } from '../store/useDemoStore';
import { buildTasks } from '../lib/evaluation/engine';

export default function TasksPage() {
  const s = useActive();
  if (!s.path) return <Navigate to="/evaluation" replace />;
  const tasks = buildTasks(s);
  return (
    <div className="anim-fade">
      <PageHeader title={<span className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-teal-700" aria-hidden />Tasks</span>}
        subtitle="Evaluation work in the same model as agent activity, exceptions and approvals. Status changes when the underlying workflow changes; nothing here is ticked off by hand." />
      <TaskBoard tasks={tasks} />
    </div>
  );
}
