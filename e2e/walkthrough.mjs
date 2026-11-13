// End-to-end walkthrough of the main demo story. Run with the dev server up:
//   node e2e/walkthrough.mjs [--shots]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const SHOTS = process.argv.includes('--shots');
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SHOTS ? 2 : 1, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const shot = async (n) => SHOTS && (await page.waitForTimeout(450), page.screenshot({ path: `docs/screenshots/${n}.png`, fullPage: false }));
const text = () => page.locator('body').innerText();

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();

// ACT 1 — Welcome, QuickBooks persona prefilled
await page.getByRole('heading', { name: 'Welcome to your DualEntry evaluation.' }).waitFor();
check('Welcome shows prefilled QuickBooks context', (await text()).includes('Northstar Labs') && (await text()).includes('QuickBooks'));
await shot('01-welcome');
await page.getByRole('button', { name: 'Continue evaluation' }).click();

// Profile: change ERP to Xero and back, observe copy change
await page.getByRole('heading', { name: 'Confirm what you want to evaluate' }).waitFor();
await page.getByText('Xero', { exact: true }).click();
check('ERP change updates onboarding copy', (await text()).includes('Tracking categories'));
await page.getByText('QuickBooks Online', { exact: true }).click();
await page.getByText('Streamline month-end close').click();
check('Goal change updates plan (approval step appears)', (await text()).includes('Review an agent-prepared entry'));
await page.getByText('Reconcile accounts faster').click();
await shot('02-profile');
await page.getByRole('button', { name: 'Continue', exact: true }).click();
await page.getByRole('button', { name: 'Choose how to evaluate' }).click();

// Path choice
await page.getByRole('heading', { name: 'How would you like to evaluate DualEntry?' }).waitFor();
check('Own-data path recommended for QuickBooks graduate', (await page.locator('article', { hasText: 'Validate your own financial data' }).innerText()).includes('Recommended for you'));
await shot('03-path');
await page.getByRole('button', { name: 'Validate my data' }).click();

// Migration
await page.getByRole('button', { name: 'Request sandbox migration' }).click();
await page.getByText('Your data is being prepared.').waitFor();
await shot('04a-migration-progress');
await page.getByText('Your data is ready for review.').waitFor({ timeout: 20000 });
const mig = await text();
check('Migration shows imported vs mapped vs reconciled separately', mig.includes('2,436') && mig.includes('2,431') && mig.includes('2 of 3'));
await shot('04b-migration-ready');
await page.getByRole('button', { name: 'Review validation' }).first().click();
await page.getByRole('heading', { name: 'Migration validation' }).waitFor();
await page.getByRole('button', { name: /UK retained earnings/ }).click();
await page.getByRole('button', { name: 'Request accounting assistance' }).click();
check('Exception assistance creates visible status', (await text()).includes('With a DualEntry accountant'));
await shot('05-validation');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Continue evaluation' }).click();

// ACT 2 — Hub
await page.getByText('Recommended next step').waitFor();
const hub = await text();
check('Hub headline matches goal', hub.includes("Let's validate how DualEntry reconciles your accounts."));
check('Recommended next step is reconciliation', hub.includes('Complete your first reconciliation'));
check('Tasks: reconciliation not yet done', !(await page.locator('#col-done').locator('..').innerText()).includes('Complete your first reconciliation'));
check('Assistance request appears in Tasks', hub.includes('With a DualEntry accountant') || hub.includes('Assistance:') || hub.includes('UK retained earnings'));
await shot('06-hub');

// ACT 3 — Reconciliation
await page.getByRole('button', { name: 'Open reconciliation' }).click();
await page.getByRole('heading', { name: /Bank reconciliation/ }).waitFor();
let rec = await text();
check('Recon shows GL $125,950.00 / bank $125,450.00 / diff $500.00', rec.includes('$125,950.00') && rec.includes('$125,450.00') && rec.includes('$500.00'));
await page.getByRole('button', { name: 'Inspect source transaction' }).click();
check('Source drawer explains the fee', (await text()).includes('None found'));
await page.keyboard.press('Escape');
await shot('07-reconciliation');

// Reject first: no ledger change
await page.getByRole('button', { name: 'Reject', exact: true }).click();
await page.getByRole('button', { name: 'Reject entry' }).click();
rec = await text();
check('Reject keeps ledger at $125,950.00', rec.includes('Adjustment rejected. Nothing was posted.') && rec.includes('$125,950.00'));
await page.goto(`${BASE}/evaluation/ledger`);
check('Ledger shows 0 posted after rejection', /posted in evaluation\s*0/i.test(await page.locator('main').innerText()));
await page.goto(`${BASE}/evaluation/reconciliation`);
await page.getByRole('button', { name: 'Reopen proposed entry' }).click();
await page.getByRole('button', { name: 'Approve and post' }).first().click();
await shot('08-approve-confirm');
await page.getByRole('dialog').getByRole('button', { name: 'Approve and post' }).click();

// Success
await page.getByRole('heading', { name: 'Your first reconciliation is complete.' }).waitFor();
const ms = await text();
check('Activation verified', ms.includes('Verified activation'));
check('QuickBooks CTA is consolidated reporting', ms.includes('Explore consolidated reporting'));
await shot('09-activation-success');

// Persistence: reload keeps state
await page.reload();
await page.getByRole('heading', { name: 'Your first reconciliation is complete.' }).waitFor();
check('Refresh persists progress', true);

// ACT 4 — next step changed on hub, tasks updated
await page.goto(`${BASE}/evaluation`);
await page.getByText('Recommended next step').waitFor();
const hub2 = await text();
check('Next step changed to consolidated reporting', hub2.includes('Review consolidated reporting'));
const doneCol = await page.locator('section[aria-labelledby="col-done"]').innerText();
check('Reconciliation task moved to Done automatically', doneCol.includes('Complete your first reconciliation'));

// Reporting
await page.goto(`${BASE}/evaluation/reporting`);
await page.getByRole('tab', { name: /UK/ }).click();
await page.getByRole('tab', { name: /NL/ }).click();
await page.getByRole('button', { name: 'Inspect eliminations' }).click();
check('Eliminations balance', (await text()).includes('Both sides agree'));
await page.keyboard.press('Escape');
await page.getByRole('tab', { name: 'Consolidated' }).click();
check('Consolidation review auto-completes', (await text()).includes('Reporting review complete'));
await shot('10-consolidation');

// Sales handoff
await page.goto(`${BASE}/evaluation/next-steps`);
await page.getByRole('button', { name: 'Request consultation' }).click();
const ns = await text();
check('Sales request confirmed as simulated', ns.includes('No calendar event was created'));
check('CRM payload excludes ledger values', !ns.match(/"[^"]*":\s*"?\$?125,?950/));
await shot('11-sales-handoff');

// ACT 5 — Sales intelligence
await page.goto(`${BASE}/internal/sales`);
await page.getByRole('heading', { name: /Growth & Sales Signals/ }).waitFor();
const northRow = await page.locator('tr', { hasText: 'Northstar Labs' }).innerText();
check('Northstar routed now with verified activation', northRow.includes('Route now') && northRow.includes('Verified activation'));
await page.getByRole('button', { name: 'Inspect Northstar Labs' }).click();
check('Why-prioritized explanation shown', (await text()).toLowerCase().includes('why this account is prioritized'));
await shot('12-sales-intelligence');
await page.getByRole('button', { name: 'Mark Sales accepted' }).click();
await page.keyboard.press('Escape');
// Toggle persona events for Meridian
await page.getByRole('button', { name: 'Inspect Meridian Group' }).click();
await page.getByRole('button', { name: 'Hits accounting blocker' }).click();
check('Meridian blocker → Specialist intervention', (await page.getByRole('dialog').innerText()).includes('Specialist intervention'));
await page.keyboard.press('Escape');

// Lifecycle: meeting suppression
await page.goto(`${BASE}/internal/journeys`);
await page.getByRole('button', { name: 'Meridian Group' }).click();
await page.goto(`${BASE}/internal/sales`);
await page.getByRole('button', { name: 'Inspect Meridian Group' }).click();
await page.getByRole('button', { name: 'Completes reconciliation' }).click();
await page.goto(`${BASE}/internal/journeys`);
await page.getByRole('button', { name: 'Meridian Group' }).click();
await page.getByRole('button', { name: 'Simulate 72 hours of inactivity' }).click();
await page.locator('article, section').filter({ hasText: 'Qualified evaluation stalled' }).getByRole('button', { name: 'Simulate trigger' }).first().click();
const j1 = await page.getByRole('dialog').innerText();
check('Stalled journey queues for qualified inactive prospect', j1.includes('Would queue'));
await shot('13-journeys');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Mark a meeting as scheduled' }).click();
await page.locator('section').filter({ hasText: 'Qualified evaluation stalled' }).getByRole('button', { name: 'Simulate trigger' }).first().click();
const j2 = await page.getByRole('dialog').innerText();
check('Meeting scheduled suppresses duplicate nudge', j2.includes('Suppressed') && j2.toLowerCase().includes('meeting'));
await page.keyboard.press('Escape');

// ACT 6 — Referral gating then customer
await page.goto(`${BASE}/customer/referrals`);
check('Prospect does not get referral prompt', (await text()).includes('Referral prompt not shown'));
await page.getByRole('button', { name: 'Switch to post-purchase scenario' }).click();
await page.getByRole('heading', { name: 'Refer a colleague' }).waitFor();
await page.getByRole('button', { name: 'Copy', exact: true }).click();
check('Copy referral link', await page.getByRole('button', { name: 'Copied' }).waitFor({ timeout: 3000 }).then(() => true, () => false));
const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
check('Clipboard holds referral link', clip.includes('ref=DEMO-'));
await shot('14-referral');

// Persona switch: NetSuite shows controls & multi-entity plan (fresh demo)
await page.getByRole('button', { name: /^Controls/ }).click();
await page.getByRole('menuitem', { name: /Reset entire demo/ }).click();
await page.goto(BASE);
await page.getByRole('button', { name: /^NetSuite|^Customer/ }).first().click();
await page.getByRole('menuitem', { name: /Legacy ERP replacement/ }).click();
await page.getByRole('heading', { name: 'Welcome to your DualEntry evaluation.' }).waitFor();
check('NetSuite welcome', (await text()).includes('Meridian Group'));
await page.getByRole('button', { name: 'Continue evaluation' }).click();
const nsProfile = await text();
check('NetSuite plan includes controls + consolidation', nsProfile.includes('Validate an approval control') && nsProfile.includes('Review consolidated reporting'));

// Event inspector
await page.getByRole('button', { name: /^Events/ }).click();
check('Event inspector lists events', (await page.getByRole('dialog').innerText()).includes('evaluation_started'));
await page.keyboard.press('Escape');

// Reset
await page.getByRole('button', { name: /^Controls/ }).click();
await page.getByRole('menuitem', { name: /Reset entire demo/ }).click();
await page.goto(`${BASE}/internal/sales`);
const afterReset = await page.locator('tr', { hasText: 'Northstar Labs' }).innerText();
check('Reset restores Northstar to not-activated', afterReset.includes('Not started'));

// Mobile layout
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/internal/sales`);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check('No horizontal page overflow on mobile (sales)', !overflow);
await page.goto(BASE);
const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check('No horizontal page overflow on mobile (welcome)', !overflow2);

check('No runtime console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
