# Product notes — Your DualEntry Evaluation

## Problem

DualEntry sells a high-consideration ERP switch. Its evaluation is sales-assisted: real data is migrated into a sandbox with CPA help, and DualEntry publicly says it does not offer a conventional free trial. The leak is not sign-up; it is the gap between “sandbox ready” and “prospect has proven something that matters to them.” A prospect dropped into a full ERP with their data and no direction either stalls or explores shallowly, and Sales cannot tell which.

The goal is more qualified prospects reaching a **credible accounting proof point**, and a clean, explainable path from that proof to a commercial conversation. Not more clicks, steps, or emails.

## Personas (fictional)

| | Sarah · Northstar Labs | David · Meridian Group | Alex · Orbit AI |
|---|---|---|---|
| Source | QuickBooks Online | NetSuite | Spreadsheets |
| Complexity | 3 entities, 3 currencies | 8 entities, 6 currencies, approvals | 1 entity |
| Timeline | 1–3 months | 3–6 months | Exploring |
| Needs to prove | Balances carry over; reconciliation; consolidation | Data parity; **controls preserved**; consolidation | What a modern workflow looks like; what setup takes |
| Default path | Own data | Own data | Sample |

## Journey

Invite (prefilled) → confirm goal (3 questions, details optional) → choose path → [own data: request migration → review validation & exceptions] → hub with **one** recommended step → first workflow (reconciliation) → activation success with intent-sensitive next step → optional Sales handoff. Post-purchase, after a successful close: referral.

## Existing vs proposed vs simulated

| Existing DualEntry (public) | Proposed in this prototype | Simulated here |
|---|---|---|
| Sales-assisted demo, CPA-led migration into a free evaluation sandbox; ~24h migration and 4–6 week implementation described publicly (not guaranteed) | Goal-based evaluation hub; progressive profiling that reuses Sales-known data | The migration lifecycle and its figures |
| **Tasks**: central workspace for tasks, agent activity, exceptions, approvals | Evaluation milestones expressed as Tasks cards that move from real workflow state | Agent proposals (fixtures with reasoning) |
| Reconciliation, multi-entity, approvals, audit trails, agents | Contextual help chosen by rules; exception review UX that separates imported / mapped / reconciled | Assistance requests, invitations, meetings |
| Referral program, $1,000 each side, subject to terms | Event-based lifecycle journeys with suppression; explainable fit/intent/activation prioritization; contextual referral moment | Email/in-product messages (never sent); CRM payloads |
| No conventional free trial | Sample workspace as a **proposed** guided preview | Sample company data |

## Activation definition

**Verified activation** = a posted, balanced, human-approved accounting outcome on the prospect’s **own (migrated) data**:
reconciliation reconciled (ledger = bank after an approved adjustment) **or** a controlled entry approved under policy.

- The same outcome on sample data is **“Sample evaluation completed”** — tracked, never counted as verified.
- Not activation: sign-up, login, page views, email opens, viewing a dashboard, rejecting an entry, or viewing reports. Consolidation review is a milestone and proof point but not activation on its own (it is a read, not a validated outcome).
- Activation ≠ buying readiness ≠ purchase status. The UI shows all three separately.

## Tasks connection

Milestones are derived from state (`lib/evaluation/engine.ts`) and rendered as Tasks cards in To do / In progress / Waiting on me / Done. There is no checkbox: a card moves because the reconciliation actually reconciled, the consolidation review actually happened, etc. Agent-prepared work and CPA assistance appear with their source.

## Sales signal logic

Fit, intent and activation are scored separately (`lib/qualification/model.ts`). Priority = first matching rule:

1. **R1** Explicit Sales request → route now, regardless of sandbox engagement
2. **R2** High fit + accounting blocker → specialist (CPA) intervention, not a sales pitch
3. **R3** High fit + purchase within 90 days → high
4. **R4** High fit + verified activation + ≥2 stakeholders → high
5. **R5** High fit, nothing else → monitor
6. **R6** Low intent + sample exploration → nurture (no Sales alert)
7. **R7** default → monitor/nurture by intent

Every account shows the rule fired, “why prioritized” built from evidence, and a recommended action. Assumptions to validate: fit points (≥3 entities, multi-currency, NetSuite/Sage Intacct replacement, QuickBooks/Xero with multiple entities).

## Lifecycle triggers and suppression

| Journey | Trigger | Class / channel |
|---|---|---|
| Data ready, not validated | `migration.completed AND validation.started = false` | Product/service · email |
| Reconciliation exception | open reconciliation difference | Product/service · in-product |
| Qualified evaluation stalled | ≥72h without meaningful activity AND no meeting | **Marketing** · email |
| First value achieved | `activation.verified` | Product/service · in-product |

Suppressed when: action already done; rep has an active follow-up on the same issue; marketing opt-out (marketing class only); meeting scheduled/requested; frequency cap (1 marketing email per 72h); nothing specific to reference. Product/service messages are not blocked by a marketing opt-out but are still suppressed when redundant.

## Referral trigger logic

Shown only if: paying customer AND onboarding complete AND success milestone (e.g., first month-end close). Never during evaluation, regardless of activation. Partner (adviser) variant shows referral status only; evaluation details require the client’s opt-in.

## Success metrics

- **North Star**: monthly Sales-accepted qualified opportunities originating from website/product evaluation.
- **Leading**: qualified evaluation start rate; verified activation rate; median time to first value; activated → Sales-accepted conversion; qualified evaluation recovery rate after intervention.
- **Guardrails**: Sales acceptance quality; reconciliation/exception correctness; CPA and support load; unwanted communications; false-positive high-intent signals.
- **Experiment**: generic post-migration landing (control) vs goal-based hub with recommended first workflow and contextual help (treatment). Primary: verified activation within 14 days of data ready. No uplift is claimed.

## Main tradeoffs

- **Own-data first for complex buyers** costs CPA time before commitment. It is DualEntry’s existing bet; the hub aims to make that time convert, and blocker routing aims to spend CPA time where it unblocks real deals.
- **Sample workspace** risks being read as a trial and attracting low-intent users. Mitigated by labeling and by never counting it as activation or routing it to Sales.
- **One next step** hides breadth. Modules remain one click away; the recommendation is about focus, not restriction.
- **Rules over ML scoring**: less predictive in theory, but trusted and debuggable by Sales on day one; a model can later be trained against the same labeled dispositions.
- **Explicit requests always route** even with zero activation; some will be early. Speed beats false negatives for hand-raisers.

## Questions requiring DualEntry internal data

1. Current evaluation funnel by stage, and where qualified sandboxes stall.
2. Which first workflow best predicts close: reconciliation, consolidation, or controls, by segment.
3. CRM fields and disposition definitions actually in use (Salesforce/HubSpot), and SLA for hand-raisers.
4. Win/loss by source ERP, entity count, currency count and revenue band (to set fit thresholds).
5. CPA/implementation capacity per sandbox; cost of an exception review.
6. Consent model and email categories in use; existing nurture cadence.
7. Real Tasks object model and API, so evaluation milestones can be native Tasks.
8. Referral program eligibility terms and current referral volume/quality.
