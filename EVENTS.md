# Event taxonomy

Source of truth: `src/lib/analytics/catalog.ts`. Every event carries:

```ts
{ eventId, eventName, category, accountId, userId, timestamp, sourceScreen,
  metadata, demoMode: true, meaningful: boolean, crmForwarded: boolean }
```

- **meaningful** events reset the inactivity clock used by the stalled-evaluation journey.
- **crmForwarded** events become account-level CRM signals through an allow-list (below).

## Events

| Category | Event | Trigger | Meaningful | CRM |
|---|---|---|---|---|
| Entry | `evaluation_started` | First “Continue evaluation” | ✓ | ✓ |
| | `evaluation_goal_selected` | Goal chosen or profile confirmed | ✓ | ✓ |
| | `qualification_updated` | Source system, timeline, entities, currencies, role or blocker changed | | ✓ |
| | `evaluation_path_selected` | Sample vs own data | ✓ | ✓ |
| Migration | `migration_requested` | Sandbox migration requested | ✓ | ✓ |
| | `migration_simulation_started` / `_completed` | Simulated timeline start / ready | | completed ✓ |
| | `migration_validation_started` | Validation screen opened with data ready | ✓ | ✓ |
| | `migration_exception_viewed` | Exception drawer opened (once per exception) | ✓ | |
| | `migration_exception_recommendation_accepted` | Recommendation accepted (pending CPA) | ✓ | |
| | `specialist_assistance_requested` | Any assistance request | ✓ | ✓ |
| Activation | `accounting_workflow_started` | Reconciliation opened / approval docs opened | ✓ | |
| | `journal_entry_proposed` | Agent entry presented for review | | |
| | `reconciliation_exception_reviewed`, `reconciliation_source_inspected` | Inspecting the unmatched line | ✓ | |
| | `journal_entry_approved` / `journal_entry_rejected` | Explicit human decision | ✓ | |
| | `reconciliation_verified` | Ledger = bank after posting | ✓ | ✓ |
| | `report_viewed` | Entity / consolidated / elimination views | ✓ | |
| | `consolidation_reviewed` | Consolidated + eliminations + ≥2 entities viewed | ✓ | ✓ |
| | `approval_workflow_decided` | Approve / reject / return | ✓ | ✓ |
| | `evaluation_first_value_achieved` | First verified activation (own data) | ✓ | ✓ |
| | `sample_evaluation_completed` | Same outcome on sample data | ✓ | ✓ |
| Engagement | `stakeholder_invited` | Colleague invited (simulated) | ✓ | ✓ |
| | `contextual_help_viewed` / `_accepted` | Help item shown / acted on | accepted ✓ | |
| | `lifecycle_message_queued` / `_suppressed` / `_previewed` | Journey evaluation | | |
| | `evaluation_resumed` | Returning or saving and continuing | ✓ | |
| | `evaluation_blocker_detected` | Blocker recorded | | ✓ |
| | `inactivity_simulated` | Demo control only | | |
| Sales | `sales_intent_declared`, `sales_meeting_requested` | Handoff submitted | ✓ | ✓ |
| | `sales_meeting_scheduled` | Rep marks scheduled (simulated) | | ✓ |
| | `sales_signal_generated` | Computed priority changed | | ✓ |
| | `sales_opportunity_accepted` / `_rejected`, `sales_followup_assigned` | Rep disposition | | ✓ |
| Referral | `referral_prompt_viewed`, `referral_link_copied`, `referral_invitation_prepared` | Only for eligible customers | | |

## Account-level attribution

- Every event carries `accountId`; personas map 1:1 to accounts. Multiple users per account roll up to the account; stakeholder count is an account property.
- `sales_signal_generated` is emitted by the store whenever re-running the qualification model on the account changes its priority, so the CRM sees state changes, not raw clickstream.
- Production: identify users at invitation (Sales already knows them) and attribute anonymous website sessions on the first authenticated evaluation event.

## Recommended analytics properties

`goal`, `path`, `sourceSystem`, `entityCount`, `currencyCount`, `timeline`, `role`, `milestone`, `workflow`, `decision`, `proofPoint`, `activation`, `severity`, `stakeholderCount`, `priority`, `rule`, `topic`, `experimentVariant`, `daysSinceDataReady`.

## Privacy constraints

- CRM allow-list (`CRM_ALLOWED_KEYS`): no amounts, balances, account numbers, entry IDs, transaction descriptions or exception values. A unit test asserts this.
- The Sales handoff payload is account-level only and lists what is never included.
- No credentials, uploads or bank details are collected anywhere.
- Partner/adviser views show referral status only; evaluation details require client opt-in.
- Marketing vs product/service communication class is part of the lifecycle model; marketing requires consent.
