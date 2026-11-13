import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { EventInspector } from '../components/layout/EventInspector';
import { Announcer } from '../components/layout/Announcer';
import { useMigrationTicker } from '../hooks/useMigrationTicker';
import Welcome from '../pages/Welcome';
import Profile from '../pages/Profile';
import PathSelect from '../pages/PathSelect';
import DataReadiness from '../pages/DataReadiness';
import Validation from '../pages/Validation';
import Hub from '../pages/Hub';
import Reconciliation from '../pages/Reconciliation';
import Reporting from '../pages/Reporting';
import Approvals from '../pages/Approvals';
import Ledger from '../pages/Ledger';
import TasksPage from '../pages/TasksPage';
import InvitePage from '../pages/InvitePage';
import Milestone from '../pages/Milestone';
import NextSteps from '../pages/NextSteps';
import Journeys from '../pages/Journeys';
import SalesSignals from '../pages/SalesSignals';
const Insights = lazy(() => import('../pages/Insights'));
import Referrals, { CustomerHome } from '../pages/Customer';

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Welcome'], [/profile/, 'Your evaluation'], [/path/, 'How to evaluate'], [/validation/, 'Migration validation'],
  [/\/data/, 'Migration'], [/reconciliation/, 'Reconciliation'], [/reporting/, 'Reporting'], [/approvals/, 'Approvals'],
  [/ledger/, 'General Ledger'], [/tasks/, 'Tasks'], [/milestone/, 'Reconciliation complete'], [/next-steps/, 'Next steps'],
  [/journeys/, 'Engagement Journeys'], [/sales/, 'Growth & Sales Signals'], [/insights/, 'Growth Insights'],
  [/referrals/, 'Refer a colleague'], [/customer/, 'Home'], [/evaluation/, 'Your evaluation'],
];

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = TITLES.find(([r]) => r.test(pathname))?.[1] ?? 'Evaluation';
    document.title = `${t} · Your DualEntry Evaluation (demo)`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  useMigrationTicker();
  return (
    <BrowserRouter>
      <RouteEffects />
      <Announcer />
      <EventInspector />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/evaluation/profile" element={<Profile />} />
        <Route path="/evaluation/path" element={<PathSelect />} />
        <Route element={<AppShell />}>
          <Route path="/evaluation" element={<Hub />} />
          <Route path="/evaluation/data" element={<DataReadiness />} />
          <Route path="/evaluation/data/validation" element={<Validation />} />
          <Route path="/evaluation/reconciliation" element={<Reconciliation />} />
          <Route path="/evaluation/reporting" element={<Reporting />} />
          <Route path="/evaluation/approvals" element={<Approvals />} />
          <Route path="/evaluation/ledger" element={<Ledger />} />
          <Route path="/evaluation/tasks" element={<TasksPage />} />
          <Route path="/evaluation/invite" element={<InvitePage />} />
          <Route path="/evaluation/milestone" element={<Milestone />} />
          <Route path="/evaluation/next-steps" element={<NextSteps />} />
          <Route path="/internal/journeys" element={<Journeys />} />
          <Route path="/internal/sales" element={<SalesSignals />} />
          <Route path="/internal/insights" element={<Suspense fallback={<div className="skeleton h-64 w-full" aria-label="Loading" />}><Insights /></Suspense>} />
          <Route path="/customer" element={<CustomerHome />} />
          <Route path="/customer/referrals" element={<Referrals />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
