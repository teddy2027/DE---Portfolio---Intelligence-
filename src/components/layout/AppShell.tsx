import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { DemoBar } from './DemoBar';
import { Sidebar } from './Sidebar';
import { Wordmark } from './Wordmark';

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <DemoBar />
      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-[248px] shrink-0 sticky top-0 h-[calc(100vh-36px)]"><Sidebar /></aside>
        {mobileNav && (
          <div className="lg:hidden fixed inset-0 z-[65]">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileNav(false)} aria-hidden />
            <div className="anim-slide relative h-full w-[272px]"><Sidebar mobile onNavigate={() => setMobileNav(false)} /></div>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex h-12 items-center gap-3 border-b border-line bg-white px-4">
            <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="rounded-md p-1.5 hover:bg-canvas"><Menu className="h-4 w-4" /></button>
            <Wordmark />
          </div>
          <main id="main" className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 max-w-[1320px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
