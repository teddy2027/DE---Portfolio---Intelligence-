import { forwardRef, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Info, Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode; iconRight?: ReactNode }>(
  ({ variant = 'secondary', size = 'md', loading, icon, iconRight, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'h-8 px-2.5 text-[13px]',
        size === 'md' && 'h-9 px-3.5 text-sm',
        size === 'lg' && 'h-11 px-5 text-[15px]',
        variant === 'primary' && 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 shadow-sm',
        variant === 'secondary' && 'bg-white text-ink border border-line-strong hover:bg-canvas active:bg-line/50',
        variant === 'ghost' && 'text-ink-2 hover:bg-canvas hover:text-ink',
        variant === 'subtle' && 'bg-teal-50 text-teal-800 hover:bg-teal-100',
        variant === 'danger' && 'bg-white text-danger border border-danger-line hover:bg-danger-bg',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  ),
);
Button.displayName = 'Button';

export type Tone = 'neutral' | 'teal' | 'positive' | 'warning' | 'danger' | 'info';
const toneCls: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-2 border-line',
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
  positive: 'bg-positive-bg text-positive border-positive-line',
  warning: 'bg-warning-bg text-warning border-warning-line',
  danger: 'bg-danger-bg text-danger border-danger-line',
  info: 'bg-info-bg text-info border-info-line',
};

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap', toneCls[tone], className)}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-ink-2': tone === 'neutral', 'bg-teal-600': tone === 'teal', 'bg-positive': tone === 'positive',
        'bg-warning': tone === 'warning', 'bg-danger': tone === 'danger', 'bg-info': tone === 'info' })} aria-hidden />}
      {children}
    </span>
  );
}

export function SimTag({ children = 'Simulated', className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded border border-dashed border-line-strong px-1.5 py-px text-2xs font-medium text-muted', className)}>
      {children}
    </span>
  );
}

export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'aside' } & Record<string, unknown>) {
  return <As className={clsx('card', className)} {...rest}>{children}</As>;
}

export function CardHeader({ title, subtitle, right, className, id }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; className?: string; id?: string }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-ink leading-6">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function InfoTip({ text, label = 'More information' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-subtle hover:text-ink-2"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <span role="tooltip" id={id} className="anim-fade absolute left-1/2 top-6 z-50 w-64 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal normal-case tracking-normal leading-[18px] text-white shadow-pop">
          {text}
        </span>
      )}
    </span>
  );
}

export function ProgressBar({ value, label, tone = 'teal', className }: { value: number; label: string; tone?: 'teal' | 'positive' | 'warning'; className?: string }) {
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-line', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className={clsx('h-full rounded-full transition-[width] duration-500 ease-out', tone === 'teal' ? 'bg-teal-600' : tone === 'positive' ? 'bg-positive' : 'bg-warning')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Kpi({ label, value, hint, tone, tip }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; tip?: string }) {
  return (
    <div className="min-w-0">
      <div className="label flex items-center gap-1">{label}{tip && <InfoTip text={tip} label={`About ${label}`} />}</div>
      <div className={clsx('mt-1 text-[20px] font-semibold num leading-7', tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'positive' ? 'text-positive' : 'text-ink')}>{value}</div>
      {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-[-0.01em] text-ink leading-8">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted max-w-3xl">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </header>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-line', className)} />;
}
