# Your DualEntry Evaluation — prototype

A high-fidelity, fully interactive prototype of a **proposed** guided evaluation and onboarding system for DualEntry. It shows how a qualified prospect can reach a credible accounting proof point, and how the same events drive lifecycle messaging, explainable Sales prioritization and, later, a referral moment.

> **This is not DualEntry software and connects to nothing.** All companies, people, vendors and figures are fictional. No ERP, bank, CRM, calendar or email service is called. Migrations, assistance requests, invitations, meetings and messages are simulated and clearly labeled.

## Run it

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| Script | What it does |
|---|---|
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint |
| `npm test` | 19 Vitest logic tests (incl. the 7 required scenarios) |
| `npm run e2e` | 38-check Playwright walkthrough of the full demo (dev server must be running) |
| `npm run e2e:shots` | Same, and writes screenshots to `docs/screenshots/` |
| `npm run build` | Production build into `dist/` |

## What it demonstrates

| # | Screen | Route |
|---|---|---|
| 1 | Welcome / evaluation entry (invited, prefilled) | `/` |
| 2 | Progressive profiling and goal (≤3 questions per step, live plan preview) | `/evaluation/profile` |
| 3 | Evaluation path: sample vs CPA-assisted own data | `/evaluation/path` |
| 4 | Migration readiness + validation detail with exceptions | `/evaluation/data`, `/evaluation/data/validation` |
| 5 | **Personalized evaluation hub** (one next step, progress, Tasks, help, modules) | `/evaluation` |
| 6a | **Bank reconciliation** with agent-prepared entry, approve / reject | `/evaluation/reconciliation` |
| 6b | Multi-entity consolidated reporting (FX + eliminations) | `/evaluation/reporting` |
| 6c | Approval controls / agent-prepared entry with audit trail | `/evaluation/approvals` |
| 7 | Activation success + intent-sensitive next step | `/evaluation/milestone` |
| 8 | Sales handoff with privacy-safe CRM context | `/evaluation/next-steps` |
| 9 | Engagement Journeys (internal) | `/internal/journeys` |
| 10 | Growth & Sales Signals (internal) | `/internal/sales` |
| — | Growth Insights + proposed A/B test (internal, illustrative) | `/internal/insights` |
| 11 | Post-purchase home + referral (customer and adviser variants) | `/customer`, `/customer/referrals` |
| — | Tasks board, General Ledger | `/evaluation/tasks`, `/evaluation/ledger` |

## Demo scenarios

Switch from the dark **Demo environment** strip at the top (scenario menu), which also holds **Controls** (simulate blocker, resolve blocker, simulate 72h inactivity, reset scenario, reset demo) and the **Events** inspector.

| Scenario | Persona | Distinctive behavior |
|---|---|---|
| QuickBooks graduate | Sarah Mitchell, VP Finance, Northstar Labs (3 entities, USD/GBP/EUR, 1–3 months) | Own-data path recommended; GL $125,950 vs bank $125,450; consolidation is the next step after activation; R3 high priority |
| Legacy ERP replacement | David Chen, Controller, Meridian Group (NetSuite, 8 entities, 6 currencies, 3–6 months) | Approval-rule migration exception, controls workflow, 8-entity consolidation; CTA “Review migration requirements with our team” |
| Startup / new ERP | Alex Rivera, Orbit AI (spreadsheets, 1 entity, exploring) | Sample path recommended; no consolidation/validation steps; agent-coded bill; R6 nurture |
| Post-purchase customer | Northstar Labs after first close | Only scenario where the referral module appears |

Each scenario keeps its own state; switching never leaks progress between personas. Progress persists in `localStorage` (`dualentry-evaluation-demo-v1`).

## Important simulated behaviors

- **Migration**: a compressed ~11-second timeline derived from the request timestamp (so it survives refresh). “Skip simulation” is available.
- **Agent proposals**: fixtures with stated reasoning. Nothing posts without an explicit human approval dialog; approving twice cannot double-post; reject never mutates the ledger.
- **Balances** are computed from opening balance + transactions + posted entries, never hard-coded.
- **Assistance, invitations, meetings, referral invites** create visible state and events but send nothing.
- **Lifecycle messages** are evaluated by a rules engine and logged as “Would queue” / “Suppressed” / “Not triggered”.
- **CRM** forwarding is simulated: events marked “CRM signal” show an allow-listed payload in the event inspector.

## Known limitations

- DualEntry’s site was not reachable from the build environment, so the palette (teal accents on light neutral surfaces) and Inter typography are **approximations**, and a text wordmark is used instead of the official logo. Public claims (24-hour migration, free sandbox, 4–6 week implementation, no free trial, $1,000/$1,000 referral) come from the brief and a web search, and are phrased as non-guarantees.
- Fit/intent thresholds and segment definitions are assumptions; see `PRODUCT_NOTES.md`.
- Growth Insights numbers are illustrative, labeled as such; only the priority distribution is live.
- Single browser-local state: no multi-user collaboration; “invited” stakeholders never actually join.
- Close Management is represented as an assisted walkthrough entry point, not a built module.

## Code map

```
src/
  types/            domain model (Account, Evaluation, ProductEvent, SalesSignal, LifecycleMessage …)
  data/             deterministic fixtures (personas, migrations, ledgers, entities)
  store/            Zustand store + persistence; every action emits events and re-prioritizes
  lib/accounting/   reconciliation, journal balancing, consolidation + eliminations
  lib/evaluation/   milestones by goal, derived tasks, activation, single next action
  lib/qualification fit / intent / activation and ordered priority rules
  lib/lifecycle/    journeys, eligibility, suppression, frequency cap
  lib/help/         contextual help recommender
  lib/analytics/    event catalog, CRM allow-list
  lib/referral/     eligibility
  pages/, components/
e2e/walkthrough.mjs Playwright demo walkthrough
```

Docs: `PRODUCT_NOTES.md`, `EVENTS.md`, `DEMO_GUIDE.md`.
