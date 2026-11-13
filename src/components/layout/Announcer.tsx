import { useDemoStore } from '../../store/useDemoStore';
export function Announcer() {
  const msg = useDemoStore((s) => s.announcement);
  return <div aria-live="polite" role="status" className="sr-only">{msg}</div>;
}
