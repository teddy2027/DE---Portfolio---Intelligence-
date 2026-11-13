import clsx from 'clsx';
/** Restrained text wordmark. The official DualEntry logo asset was not accessible from this environment, so no logo is recreated. */
export function Wordmark({ inverse, className }: { inverse?: boolean; className?: string }) {
  return (
    <span className={clsx('font-semibold tracking-[-0.02em] text-[17px]', inverse ? 'text-white' : 'text-ink', className)}>
      DualEntry
    </span>
  );
}
