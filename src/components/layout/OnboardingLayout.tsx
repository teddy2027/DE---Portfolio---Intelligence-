import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { DemoBar } from './DemoBar';
import { Wordmark } from './Wordmark';

export function OnboardingLayout({ step, children }: { step: 1 | 2; children: ReactNode }) {
  const steps = ['Your evaluation', 'How to evaluate', 'First workflow'];
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <DemoBar />
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" aria-label="Back to welcome"><Wordmark /></Link>
          <ol className="hidden sm:flex items-center gap-2 text-[12.5px]" aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2" aria-current={i + 1 === step ? 'step' : undefined}>
                <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold num',
                  i + 1 < step ? 'bg-teal-700 text-white' : i + 1 === step ? 'border-2 border-teal-700 text-teal-800' : 'border border-line-strong text-muted')}>{i + 1}</span>
                <span className={clsx(i + 1 === step ? 'font-medium text-ink' : 'text-muted')}>{s}</span>
                {i < steps.length - 1 && <span className="w-6 h-px bg-line-strong" aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
      </header>
      <main id="main" className="flex-1 px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
}
