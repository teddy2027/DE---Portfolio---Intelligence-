# Demo guide (5–7 minutes)

Start: `npm run dev`, open http://localhost:5173. If the demo was used before: **Controls → Reset entire demo**. Scenario: **QuickBooks** (default).

## Main story — QuickBooks graduate

**Act 1 · Understand the customer (45s)**
1. Welcome screen. Point at the right card: Sales already knows Northstar Labs, QuickBooks, 3 entities, 1–3 months. Nothing is re-asked.
2. **Continue evaluation**. On the profile, click **Xero** then back to **QuickBooks Online**: the copy changes. Click **Streamline month-end close** and watch the plan on the right add an approval step; switch back to **Reconcile accounts faster**.
3. **Continue → Choose how to evaluate**.

**Act 2 · Reduce the friction (60s)**
4. Path screen: own data is recommended *because* of QuickBooks + 3 entities. Note the honest labels: simulated migration, sample = proposed preview, no free trial.
5. **Validate my data → Request sandbox migration**. Stages progress (≈11s, or **Skip simulation**).
6. Show the separation: 2,436 imported, 2,431 mapped, 2 of 3 balances reconciled, 3 exceptions. **Review validation**.
7. Open **UK retained earnings differ…** → source detail, recommendation marked *Not applied* → **Request accounting assistance**. Close. **Continue evaluation**.

**Act 3 · Build accounting confidence (90s)**
8. Hub: one recommended step, progress with what verified each milestone, Tasks board, help with “Shown because…”. **Open reconciliation**.
9. GL $125,950.00, bank $125,450.00, difference $500.00. **Inspect source transaction**. Review the balanced entry and agent reasoning (“The agent cannot post this entry”).
10. Optional: **Reject** → nothing posts, ledger unchanged, Tasks shows “In progress”. Then **Reopen proposed entry**.
11. **Approve and post** → confirm.

**Act 4 · Turn progress into the next action (45s)**
12. Success screen: what was done, records, checks, what remains. Activation vs buying timeline vs purchase status shown separately. CTA is **Explore consolidated reporting** for Sarah.
13. Optional: in Reporting click **UK**, **NL**, **Inspect eliminations**, back to **Consolidated** — review completes itself.
14. Go to **Your evaluation**: next step changed; the reconciliation card is in **Done** with `reconciliation_verified`.

**Act 5 · Sales intelligence (75s)**
15. Click **Events** in the top strip: the stream, “CRM signal” events, and the allow-listed CRM payload.
16. Sidebar → **Growth & Sales Signals**. Northstar is **High priority (R3)** with verified activation. Open it: why, recommended action, fit/intent/activation evidence, recent events.
17. Back on the hub → **Next steps** (or `/evaluation/next-steps`) → **Request consultation**. Return to Signals: now **Route now (R1)**. **Mark Sales accepted**.

**Act 6 · Extend the loop (30s)**
18. Sidebar → **Referral (post-purchase)**: blocked for a prospect, with the reasons. **Switch to post-purchase scenario** → referral card, **Copy** (real clipboard), invite preview, adviser tab with consent.

## Optional — NetSuite scenario (60s)
Scenario menu → **Legacy ERP replacement**. Plan includes approval control and 8-entity consolidation. In validation, the high-severity exception is **4 NetSuite approval rules need to be recreated**. In **Approvals**, open supporting documents, then approve or return. After a reconciliation, the CTA reads **Review migration requirements with our team**.

## Lifecycle demonstration (60s)
**Engagement Journeys** → pick **Meridian Group**.
1. In Signals, open Meridian → **Completes reconciliation** (gives it a path), back to Journeys.
2. **Simulate 72 hours of inactivity** → “Qualified evaluation stalled” → **Simulate trigger**: *Would queue*, copy references the next incomplete task.
3. Trigger again → suppressed by **frequency cap**.
4. **Mark a meeting as scheduled** → trigger → suppressed: meeting already covers it.
5. Untick **Marketing email consent**: marketing journeys suppress; product/service ones still evaluate.

## Sales intelligence extras
In any live account drawer, **Simulate prospect activity** (blocker → Specialist R2; 30-day timeline → High R3; meeting request → Route now R1). Filters by priority; **Assign follow-up**.

## Likely objections

- **“Isn’t sample data just a free trial?”** It is labeled a proposed guided preview, never counts as activation, and never routes to Sales by itself (R6).
- **“Will this burn CPA time on tire-kickers?”** CPA intervention is reserved for high-fit accounts with a real blocker (R2); low-intent sample users are nurtured.
- **“Why rules, not a score?”** Sales must trust and act on it today. Rules are auditable; a model can come later, trained on these dispositions.
- **“Does AI post entries?”** No. Every agent entry is “Prepared for review,” needs an explicit approver, is checked for balance and segregation of duties, and is audit-logged.
- **“Is activation a buying signal?”** It’s one dimension. The model keeps fit, intent and activation separate; activation alone never routes to Sales unless fit, timeline or stakeholders support it.
- **“Numbers on Growth Insights?”** Illustrative. The experiment card claims no uplift.
