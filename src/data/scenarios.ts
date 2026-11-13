import type { ScenarioFixture, ScenarioId, MigrationFixture } from '../types';

/**
 * Deterministic, fictional fixtures. Companies, people, vendors and figures are invented for the prototype.
 * Reconciliation balances are NOT hard-coded: they are computed from opening balance + transactions
 * (see lib/accounting/reconciliation.ts) so the numbers always tie out.
 */

const northstarMigration: MigrationFixture = {
  source: 'QuickBooks Online',
  entities: 3,
  accountsReviewed: 128,
  recordsImported: 2436,
  recordsMapped: 2431,
  entitiesBalanced: 2,
  historyRange: 'Jan 2023 – Oct 2026',
  checks: [
    { id: 'c1', label: 'Record counts match source export', detail: '2,436 of 2,436 records received from the QuickBooks Online export.', status: 'passed' },
    { id: 'c2', label: 'Chart of accounts mapped', detail: '128 of 128 accounts mapped to DualEntry account types.', status: 'passed' },
    { id: 'c3', label: 'Journal entries balance', detail: 'Debits equal credits on every imported entry.', status: 'passed', tooltip: 'Each imported journal entry is checked so total debits equal total credits.' },
    { id: 'c4', label: 'Closed periods preserved', detail: 'Periods locked in QuickBooks remain locked in the sandbox.', status: 'passed' },
    { id: 'c5', label: 'Transaction mapping', detail: '2,431 of 2,436 records mapped. 5 reference a QuickBooks class with no matching dimension.', status: 'review' },
    { id: 'c6', label: 'Trial balance tie-out by entity', detail: 'US and Netherlands tie to source. UK differs on retained earnings.', status: 'review', tooltip: 'The trial balance for each entity is compared with the source trial balance at the cut-over date.' },
  ],
  exceptions: [
    {
      id: 'ns-e1', severity: 'high', entity: 'Northstar Labs UK Ltd',
      title: 'UK retained earnings differ from source by £1,312.40',
      explanation: 'The imported opening retained earnings for the UK entity do not match the QuickBooks trial balance. The source audit log shows a December 2025 journal entry was edited after the migration snapshot was taken.',
      sourceDetail: [
        { label: 'Account', value: '3200 · Retained Earnings' },
        { label: 'Source balance', value: '£412,906.18 CR' },
        { label: 'Imported balance', value: '£411,593.78 CR' },
        { label: 'Variance', value: '£1,312.40' },
        { label: 'Likely cause', value: 'JE-2025-1219 edited in source on Nov 3' },
      ],
      suggestedNextStep: 'Confirm which version of JE-2025-1219 is correct, then re-import it from the latest source snapshot.',
      recommendation: 'Re-import JE-2025-1219 from the latest source snapshot and re-run the UK tie-out.',
    },
    {
      id: 'ns-e2', severity: 'medium', entity: 'Northstar Labs, Inc.',
      title: '5 transactions use the QuickBooks class “Events” with no matching dimension',
      explanation: 'QuickBooks classes are mapped to DualEntry dimensions. The class “Events” has no target value yet, so these 5 records are imported but not fully mapped.',
      sourceDetail: [
        { label: 'Source field', value: 'Class = Events' },
        { label: 'Records affected', value: '5' },
        { label: 'Target', value: 'Department dimension (no value)' },
      ],
      suggestedNextStep: 'Create an “Events” department value, or map the class to Marketing.',
      recommendation: 'Create an “Events” value under the Department dimension and apply it to the 5 records.',
    },
    {
      id: 'ns-e3', severity: 'low', entity: 'Northstar Labs, Inc.',
      title: 'Possible duplicate vendor: “Brightline Cloud” and “Brightline Cloud Inc.”',
      explanation: 'Two vendor records share a tax ID and remittance address. Merging keeps reporting by vendor accurate.',
      sourceDetail: [
        { label: 'Records', value: '2 vendor records, 41 bills' },
        { label: 'Match basis', value: 'Same tax ID and remittance address' },
      ],
      suggestedNextStep: 'Merge the vendor records. Bill history is preserved on the surviving record.',
      recommendation: 'Merge into “Brightline Cloud Inc.” and preserve history from both records.',
    },
  ],
};

const meridianMigration: MigrationFixture = {
  source: 'NetSuite',
  entities: 8,
  accountsReviewed: 412,
  recordsImported: 48912,
  recordsMapped: 48870,
  entitiesBalanced: 7,
  historyRange: 'Jan 2022 – Oct 2026',
  checks: [
    { id: 'c1', label: 'Record counts match source export', detail: '48,912 of 48,912 records received from the NetSuite saved-search export.', status: 'passed' },
    { id: 'c2', label: 'Subsidiaries mapped to entities', detail: '8 of 8 NetSuite subsidiaries mapped to DualEntry entities, including the parent/child hierarchy.', status: 'passed' },
    { id: 'c3', label: 'Journal entries balance', detail: 'Debits equal credits on every imported entry, in transaction and functional currency.', status: 'passed' },
    { id: 'c4', label: 'Transaction mapping', detail: '48,870 of 48,912 records mapped. 42 use the custom segment “Project”.', status: 'review', tooltip: 'NetSuite custom segments become DualEntry dimensions. A segment without a target dimension is imported but not fully mapped.' },
    { id: 'c5', label: 'Trial balance tie-out by entity', detail: '7 of 8 entities tie to source. Meridian México differs.', status: 'review' },
    { id: 'c6', label: 'Intercompany pairs balance', detail: 'One Holdings ↔ Canada pair differs in September 2026.', status: 'review', tooltip: 'Intercompany receivables in one entity should equal the matching payables in the counterparty entity.' },
    { id: 'c7', label: 'Approval rules recreated', detail: 'Approval workflows are configuration, not data, and are not migrated automatically.', status: 'pending' },
  ],
  exceptions: [
    {
      id: 'mg-e1', severity: 'high', entity: 'Approval controls',
      title: '4 NetSuite approval rules need to be recreated in DualEntry',
      explanation: 'Approval routing in NetSuite is workflow configuration, so it is not part of the data migration. Four rules were identified from your control documentation and have proposed DualEntry equivalents that need your confirmation.',
      sourceDetail: [
        { label: 'Rules identified', value: '4 (JE > $50k, vendor bills > $25k, intercompany, new vendor)' },
        { label: 'Proposed equivalents', value: '4 drafted, 0 confirmed' },
        { label: 'Control owner', value: 'Corporate Controller' },
      ],
      suggestedNextStep: 'Review each rule mapping with an implementation specialist before relying on approvals in the sandbox.',
      recommendation: 'Accept the 4 drafted approval rules as a starting point, pending controller sign-off.',
    },
    {
      id: 'mg-e2', severity: 'high', entity: 'Meridian México S. de R.L.',
      title: 'Meridian México trial balance differs by MXN 18,240.00',
      explanation: 'NetSuite applied a manual exchange-rate override for August 2026. The sandbox used the standard rate table, which changes the revaluation of foreign-currency balances.',
      sourceDetail: [
        { label: 'Account', value: '7900 · Unrealized FX Gain/Loss' },
        { label: 'Variance', value: 'MXN 18,240.00' },
        { label: 'Likely cause', value: 'Manual rate override, Aug 2026' },
      ],
      suggestedNextStep: 'Confirm which rate source governs historical revaluation. A CPA review is recommended.',
      recommendation: 'Apply the NetSuite August override rate for historical periods only.',
    },
    {
      id: 'mg-e3', severity: 'medium', entity: 'All entities',
      title: '42 transactions use the custom segment “Project”',
      explanation: 'The custom segment has no target dimension yet. Records are imported, but project reporting will be incomplete until it is mapped.',
      sourceDetail: [{ label: 'Records affected', value: '42' }, { label: 'Target', value: 'None' }],
      suggestedNextStep: 'Create a Project dimension and map the segment values.',
      recommendation: 'Create a Project dimension with the 11 existing segment values.',
    },
    {
      id: 'mg-e4', severity: 'medium', entity: 'Holdings ↔ Canada',
      title: 'Intercompany pair differs by CAD 3,400.00 (September 2026)',
      explanation: 'The receivable recorded by Holdings does not equal the payable recorded by Meridian Canada for September.',
      sourceDetail: [{ label: 'Period', value: 'Sep 2026' }, { label: 'Difference', value: 'CAD 3,400.00' }],
      suggestedNextStep: 'Identify the unmatched intercompany invoice before relying on September eliminations.',
      recommendation: 'Flag September eliminations as provisional until the pair is resolved.',
    },
    {
      id: 'mg-e5', severity: 'low', entity: 'Meridian Logistics Services LLC',
      title: 'Inactive subsidiary included in migration',
      explanation: 'This subsidiary has had no activity since 2025. Confirm whether it should be included in consolidation.',
      sourceDetail: [{ label: 'Last activity', value: 'Mar 2025' }],
      suggestedNextStep: 'Confirm inclusion or mark the entity as inactive.',
      recommendation: 'Keep the entity for history and mark it inactive.',
    },
  ],
};

const orbitMigration: MigrationFixture = {
  source: 'Spreadsheets / other',
  entities: 1,
  accountsReviewed: 64,
  recordsImported: 1182,
  recordsMapped: 1174,
  entitiesBalanced: 1,
  historyRange: 'Jan 2026 – Oct 2026',
  checks: [
    { id: 'c1', label: 'Rows received', detail: '1,182 rows received from your spreadsheet template.', status: 'passed' },
    { id: 'c2', label: 'Starter chart of accounts', detail: '64 accounts created from a standard SaaS chart of accounts.', status: 'passed' },
    { id: 'c3', label: 'Entries balance', detail: 'Debits equal credits on every imported entry.', status: 'passed' },
    { id: 'c4', label: 'Rows mapped to accounts', detail: '1,174 of 1,182 rows mapped. 8 rows have no account code.', status: 'review' },
  ],
  exceptions: [
    {
      id: 'or-e1', severity: 'medium', entity: 'Orbit AI, Inc.',
      title: '8 spreadsheet rows have no account code',
      explanation: 'These rows were imported but could not be posted to an account.',
      sourceDetail: [{ label: 'Rows', value: '8' }, { label: 'Sheet', value: 'Expenses_2026' }],
      suggestedNextStep: 'Assign account codes, or let an accountant suggest them.',
      recommendation: 'Assign suggested account codes based on vendor history.',
    },
    {
      id: 'or-e2', severity: 'low', entity: 'Orbit AI, Inc.',
      title: 'Opening balance date assumed to be Jan 1, 2026',
      explanation: 'Your template did not include an opening balance date.',
      sourceDetail: [{ label: 'Assumed date', value: 'Jan 1, 2026' }],
      suggestedNextStep: 'Confirm the date your books should start in DualEntry.',
      recommendation: 'Keep Jan 1, 2026 as the opening balance date.',
    },
  ],
};

export const SCENARIOS: Record<ScenarioId, ScenarioFixture> = {
  quickbooks: {
    id: 'quickbooks',
    label: 'QuickBooks graduate',
    shortLabel: 'QuickBooks',
    personaSummary: 'Sarah Mitchell · VP Finance · Northstar Labs · 3 entities',
    user: { id: 'usr_sarah', name: 'Sarah Mitchell', firstName: 'Sarah', role: 'VP Finance', email: 'sarah@northstarlabs.example' },
    account: {
      id: 'acct_northstar', name: 'Northstar Labs', industry: 'B2B SaaS', currentERP: 'QuickBooks Online',
      entityCount: 3, currencies: ['USD', 'GBP', 'EUR'], annualRevenueBand: '$20M–$50M (demo)',
      purchaseTimeline: '1_3_months', acquisitionSource: 'sales_invitation', assignedSalesOwner: 'Jordan Ellis',
    },
    defaultProfile: {
      currentERP: 'QuickBooks Online', goal: 'reconcile', timeline: '1_3_months', entityCount: 3,
      currencies: ['USD', 'GBP', 'EUR'], buyingRole: 'decision_maker', mainBlocker: 'Confidence that balances carry over correctly',
    },
    recommendedPath: 'own_data',
    messaging: { headline: 'See how your books translate into DualEntry.', subhead: 'Validate your balances before making a decision.' },
    sampleCompanyName: 'Harbor Analytics (sample)',
    migration: northstarMigration,
    reconciliation: {
      entity: 'Northstar Labs, Inc.',
      ledgerAccount: '1010 · Operating Cash — US',
      bankAccountLabel: 'US operating account (details masked)',
      period: 'October 2026',
      openingBalance: 117920,
      matched: [
        { id: 't1', date: 'Oct 2', description: 'Customer payment — Halvorsen Analytics', reference: 'INV-1042', amount: 24500 },
        { id: 't2', date: 'Oct 6', description: 'Payroll funding — Oct 1–15', reference: 'PR-1001', amount: -38200 },
        { id: 't3', date: 'Oct 9', description: 'Customer payment — Peakline Systems', reference: 'INV-1047', amount: 31750 },
        { id: 't4', date: 'Oct 14', description: 'Vendor payment — Brightline Cloud Inc.', reference: 'BILL-3318', amount: -6180 },
        { id: 't5', date: 'Oct 17', description: 'Customer payment — Brightwater Health', reference: 'INV-1051', amount: 18900 },
        { id: 't6', date: 'Oct 20', description: 'Payroll funding — Oct 16–31', reference: 'PR-1002', amount: -38200 },
        { id: 't7', date: 'Oct 24', description: 'Customer payment — Tessellate Inc.', reference: 'INV-1055', amount: 27400 },
        { id: 't8', date: 'Oct 28', description: 'Rent — HQ office', reference: 'BILL-3324', amount: -11940 },
      ],
      bankOnly: [{ id: 'b1', date: 'Oct 31', description: 'Bank service fee — international wire & account analysis', reference: 'BNK-1031', amount: -500 }],
      proposedEntry: {
        id: 'JE-2026-1031', date: 'Oct 31, 2026', description: 'Record October bank service fee', entity: 'Northstar Labs, Inc.',
        preparedBy: 'Reconciliation agent', status: 'prepared',
        lines: [
          { account: '6810 · Bank Fees', debit: 500, credit: 0, memo: 'Bank service fee, Oct 2026 (BNK-1031)' },
          { account: '1010 · Operating Cash — US', debit: 0, credit: 500, memo: 'Bank service fee, Oct 2026 (BNK-1031)' },
        ],
      },
      exceptionExplanation: 'The bank recorded a $500.00 service fee on Oct 31 that has not been recorded in the general ledger.',
      agentReasoning: [
        'Bank line BNK-1031 has no matching ledger entry within ±5 days or ±$0.01.',
        'Description and amount match the bank service fee recorded in July, August and September.',
        'Prior fees were coded to 6810 · Bank Fees, so the same account is proposed.',
      ],
    },
    consolidation: {
      period: 'October 2026',
      eliminationNote: 'Northstar Labs, Inc. charges a monthly management fee to the UK and Netherlands entities. It is eliminated on consolidation.',
      entities: [
        { id: 'ns-us', name: 'Northstar Labs, Inc.', shortName: 'US', country: 'United States', currency: 'USD', fxRate: 1,
          lines: { revenue: 1842000, cogs: 368400, salesMarketing: 512000, rnd: 604000, ga: 241000, icIncome: 122900, icExpense: 0 } },
        { id: 'ns-uk', name: 'Northstar Labs UK Ltd', shortName: 'UK', country: 'United Kingdom', currency: 'GBP', fxRate: 1.27,
          lines: { revenue: 412000, cogs: 86500, salesMarketing: 118000, rnd: 0, ga: 64000, icIncome: 0, icExpense: 50000 } },
        { id: 'ns-nl', name: 'Northstar Labs B.V.', shortName: 'NL', country: 'Netherlands', currency: 'EUR', fxRate: 1.08,
          lines: { revenue: 268000, cogs: 59000, salesMarketing: 72000, rnd: 41000, ga: 38500, icIncome: 0, icExpense: 55000 } },
      ],
    },
    approval: {
      title: 'Annual software subscription — Larkspur Data Platform',
      kind: 'agent_coding',
      amount: 14820,
      policy: 'Vendor bills over $10,000 require VP Finance approval before posting.',
      requiredApproverRole: 'VP Finance',
      preparer: 'Payables agent',
      supportingDocs: [
        { name: 'Invoice LDP-20931.pdf (fictional)', detail: '12-month subscription, Nov 1, 2026 – Oct 31, 2027, $14,820.00' },
        { name: 'Order form (fictional)', detail: 'Annual prepay, net 30' },
      ],
      agentReasoning: [
        'Service period spans 12 months, so the bill is coded to Prepaid Expenses rather than expensed immediately.',
        'A straight-line amortization schedule of $1,235.00 per month is proposed for Nov 2026 – Oct 2027.',
        'The vendor and amount match the purchase order approved in September.',
      ],
      confidenceNote: 'Prepared for review. Nothing posts until an approver accepts it.',
      entry: {
        id: 'BILL-3341', date: 'Nov 1, 2026', description: 'Larkspur Data Platform — annual subscription', entity: 'Northstar Labs, Inc.',
        preparedBy: 'Payables agent', status: 'prepared',
        lines: [
          { account: '1310 · Prepaid Expenses', debit: 14820, credit: 0 },
          { account: '2000 · Accounts Payable', debit: 0, credit: 14820 },
        ],
      },
    },
    blockerTemplate: {
      id: 'blk-ns', title: 'UK opening balance variance is unresolved',
      detail: 'Sarah cannot sign off on migrated balances until the £1,312.40 retained earnings variance is explained.',
      relatedMilestone: 'validate',
    },
    initialStakeholders: [{ id: 'sh_sarah', name: 'Sarah Mitchell', email: 'sarah@northstarlabs.example', role: 'VP Finance', status: 'active' }],
  },

  netsuite: {
    id: 'netsuite',
    label: 'Legacy ERP replacement',
    shortLabel: 'NetSuite',
    personaSummary: 'David Chen · Corporate Controller · Meridian Group · 8 entities',
    user: { id: 'usr_david', name: 'David Chen', firstName: 'David', role: 'Corporate Controller', email: 'david.chen@meridiangroup.example' },
    account: {
      id: 'acct_meridian', name: 'Meridian Group', industry: 'Diversified industrial operations', currentERP: 'NetSuite',
      entityCount: 8, currencies: ['USD', 'CAD', 'GBP', 'EUR', 'MXN', 'AUD'], annualRevenueBand: '$150M–$300M (demo)',
      purchaseTimeline: '3_6_months', acquisitionSource: 'sales_invitation', assignedSalesOwner: 'Priya Raman',
    },
    defaultProfile: {
      currentERP: 'NetSuite', goal: 'consolidate', timeline: '3_6_months', entityCount: 8,
      currencies: ['USD', 'CAD', 'GBP', 'EUR', 'MXN', 'AUD'], buyingRole: 'evaluator', mainBlocker: 'Implementation complexity and preserving controls',
    },
    recommendedPath: 'own_data',
    messaging: { headline: 'Validate your data. Preserve your controls.', subhead: 'Prove your most important workflows before committing.' },
    sampleCompanyName: 'Ridgeline Industrial (sample)',
    migration: meridianMigration,
    reconciliation: {
      entity: 'Meridian Group Holdings, Inc.',
      ledgerAccount: '1000 · Operating Cash — US',
      bankAccountLabel: 'US treasury operating account (details masked)',
      period: 'October 2026',
      openingBalance: 2104615,
      matched: [
        { id: 't1', date: 'Oct 1', description: 'Customer receipt — Ardent Manufacturing', reference: 'INV-88213', amount: 412880 },
        { id: 't2', date: 'Oct 3', description: 'Payroll — Holdings & Industrial', reference: 'PR-2219', amount: -486240 },
        { id: 't3', date: 'Oct 7', description: 'Intercompany funding — Meridian Canada Ltd', reference: 'IC-0412', amount: -150000 },
        { id: 't4', date: 'Oct 10', description: 'Customer receipt — Coastal Freight Partners', reference: 'INV-88240', amount: 268450 },
        { id: 't5', date: 'Oct 15', description: 'Vendor payment — Steelworks Supply Co.', reference: 'BILL-55108', amount: -194310 },
        { id: 't6', date: 'Oct 17', description: 'Payroll — Holdings & Industrial', reference: 'PR-2220', amount: -486240 },
        { id: 't7', date: 'Oct 21', description: 'Customer receipt — Northgate Distribution', reference: 'INV-88277', amount: 533920 },
        { id: 't8', date: 'Oct 29', description: 'Insurance premium — Q4', reference: 'BILL-55131', amount: -88600 },
      ],
      bankOnly: [{ id: 'b1', date: 'Oct 31', description: 'Treasury management fees — October', reference: 'BNK-7731', amount: -1225 }],
      proposedEntry: {
        id: 'JE-2026-7731', date: 'Oct 31, 2026', description: 'Record October treasury management fees', entity: 'Meridian Group Holdings, Inc.',
        preparedBy: 'Reconciliation agent', status: 'prepared',
        lines: [
          { account: '6810 · Bank Service Charges', debit: 1225, credit: 0, memo: 'Treasury mgmt fees, Oct 2026 (BNK-7731)' },
          { account: '1000 · Operating Cash — US', debit: 0, credit: 1225, memo: 'Treasury mgmt fees, Oct 2026 (BNK-7731)' },
        ],
      },
      exceptionExplanation: 'The bank charged $1,225.00 in treasury management fees on Oct 31 that are not yet recorded in the general ledger.',
      agentReasoning: [
        'Bank line BNK-7731 has no matching ledger entry within ±5 days or ±$0.01.',
        'The fee matches the monthly treasury management analysis charge recorded in each of the prior 6 months.',
        'Prior charges were coded to 6810 · Bank Service Charges in the Holdings entity.',
      ],
    },
    consolidation: {
      period: 'October 2026',
      eliminationNote: 'Meridian Group Holdings charges a monthly management fee to six operating subsidiaries. Fees are eliminated on consolidation.',
      entities: [
        { id: 'mg-hold', name: 'Meridian Group Holdings, Inc.', shortName: 'Holdings', country: 'United States', currency: 'USD', fxRate: 1,
          lines: { revenue: 4820000, cogs: 2410000, salesMarketing: 382000, rnd: 0, ga: 516000, icIncome: 309800, icExpense: 0 } },
        { id: 'mg-ind', name: 'Meridian Industrial US LLC', shortName: 'Industrial US', country: 'United States', currency: 'USD', fxRate: 1,
          lines: { revenue: 3140000, cogs: 1884000, salesMarketing: 214000, rnd: 46000, ga: 198000, icIncome: 0, icExpense: 120000 } },
        { id: 'mg-ca', name: 'Meridian Canada Ltd', shortName: 'Canada', country: 'Canada', currency: 'CAD', fxRate: 0.73,
          lines: { revenue: 2260000, cogs: 1356000, salesMarketing: 148000, rnd: 0, ga: 132000, icIncome: 0, icExpense: 100000 } },
        { id: 'mg-uk', name: 'Meridian UK Ltd', shortName: 'UK', country: 'United Kingdom', currency: 'GBP', fxRate: 1.27,
          lines: { revenue: 1480000, cogs: 858000, salesMarketing: 121000, rnd: 0, ga: 96000, icIncome: 0, icExpense: 30000 } },
        { id: 'mg-eu', name: 'Meridian Europe B.V.', shortName: 'Europe', country: 'Netherlands', currency: 'EUR', fxRate: 1.08,
          lines: { revenue: 1720000, cogs: 1014800, salesMarketing: 132000, rnd: 22000, ga: 104000, icIncome: 0, icExpense: 25000 } },
        { id: 'mg-mx', name: 'Meridian México S. de R.L.', shortName: 'México', country: 'Mexico', currency: 'MXN', fxRate: 0.055,
          lines: { revenue: 18400000, cogs: 11960000, salesMarketing: 920000, rnd: 0, ga: 1104000, icIncome: 0, icExpense: 400000 } },
        { id: 'mg-au', name: 'Meridian Australia Pty Ltd', shortName: 'Australia', country: 'Australia', currency: 'AUD', fxRate: 0.66,
          lines: { revenue: 1150000, cogs: 690000, salesMarketing: 84000, rnd: 0, ga: 71000, icIncome: 0, icExpense: 45000 } },
        { id: 'mg-log', name: 'Meridian Logistics Services LLC', shortName: 'Logistics', country: 'United States', currency: 'USD', fxRate: 1,
          lines: { revenue: 0, cogs: 0, salesMarketing: 0, rnd: 0, ga: 4200, icIncome: 0, icExpense: 0 } },
      ],
    },
    approval: {
      title: 'Intercompany management fee accrual — Meridian Industrial US',
      kind: 'controls',
      amount: 120000,
      policy: 'Journal entries over $50,000 require Corporate Controller approval. Preparer and approver must differ.',
      requiredApproverRole: 'Corporate Controller',
      preparer: 'Accruals agent',
      supportingDocs: [
        { name: 'Intercompany services agreement, Schedule B (fictional)', detail: 'Fixed monthly management fee of $120,000.00' },
        { name: 'Prior-period accruals (Jul–Sep 2026)', detail: 'Same amount, approved by Corporate Controller each month' },
        { name: 'Counterparty confirmation', detail: 'Matching payable drafted in Meridian Industrial US LLC' },
      ],
      agentReasoning: [
        'Schedule B of the services agreement sets a fixed monthly fee of $120,000.00.',
        'The matching intercompany payable has been drafted in Meridian Industrial US LLC so the pair eliminates.',
        'Amount exceeds $50,000, so the entry is routed to the Corporate Controller under the migrated approval rule.',
      ],
      confidenceNote: 'Prepared for review. The entry stays unposted until the required approver decides.',
      entry: {
        id: 'JE-2026-IC-1031', date: 'Oct 31, 2026', description: 'October intercompany management fee — Industrial US', entity: 'Meridian Group Holdings, Inc.',
        preparedBy: 'Accruals agent', status: 'prepared',
        lines: [
          { account: '1450 · Intercompany Receivable — Industrial US', debit: 120000, credit: 0 },
          { account: '4900 · Intercompany Management Fee Income', debit: 0, credit: 120000 },
        ],
      },
    },
    blockerTemplate: {
      id: 'blk-mg', title: 'Approval routing parity not yet confirmed',
      detail: 'David will not rely on sandbox approvals until the 4 NetSuite approval rules are confirmed against DualEntry equivalents.',
      relatedMilestone: 'approval',
    },
    initialStakeholders: [{ id: 'sh_david', name: 'David Chen', email: 'david.chen@meridiangroup.example', role: 'Corporate Controller', status: 'active' }],
  },

  startup: {
    id: 'startup',
    label: 'Startup / new ERP',
    shortLabel: 'Startup',
    personaSummary: 'Alex Rivera · Head of Finance · Orbit AI · 1 entity',
    user: { id: 'usr_alex', name: 'Alex Rivera', firstName: 'Alex', role: 'Head of Finance', email: 'alex@orbitai.example' },
    account: {
      id: 'acct_orbit', name: 'Orbit AI', industry: 'AI software (Series A)', currentERP: 'Spreadsheets / other',
      entityCount: 1, currencies: ['USD'], annualRevenueBand: '$2M–$5M (demo)',
      purchaseTimeline: 'later', acquisitionSource: 'website_guided_evaluation', assignedSalesOwner: 'Marcus Webb',
    },
    defaultProfile: {
      currentERP: 'Spreadsheets / other', goal: 'scale', timeline: 'later', entityCount: 1,
      currencies: ['USD'], buyingRole: 'decision_maker', mainBlocker: 'Understanding what setup requires',
    },
    recommendedPath: 'sample',
    messaging: { headline: 'Build the finance foundation for your next stage.', subhead: 'Explore the workflows your team will need as it grows.' },
    sampleCompanyName: 'Tidewater Software (sample)',
    migration: orbitMigration,
    reconciliation: {
      entity: 'Orbit AI, Inc.',
      ledgerAccount: '1000 · Operating Cash',
      bankAccountLabel: 'Operating account (details masked)',
      period: 'October 2026',
      openingBalance: 3412000,
      matched: [
        { id: 't1', date: 'Oct 1', description: 'Customer payment — Lumen Retail (annual)', reference: 'INV-0214', amount: 96000 },
        { id: 't2', date: 'Oct 3', description: 'Payroll — Oct 1–15', reference: 'PR-0019', amount: -212400 },
        { id: 't3', date: 'Oct 8', description: 'Vendor payment — Cloudline Compute', reference: 'BILL-0388', amount: -41860.22 },
        { id: 't4', date: 'Oct 15', description: 'Customer payment — Fieldnote Health', reference: 'INV-0221', amount: 38500 },
        { id: 't5', date: 'Oct 17', description: 'Payroll — Oct 16–31', reference: 'PR-0020', amount: -212400 },
        { id: 't6', date: 'Oct 24', description: 'Contractor — brand design studio', reference: 'BILL-0397', amount: -18000 },
      ],
      bankOnly: [{ id: 'b1', date: 'Oct 31', description: 'Wire & account analysis fees', reference: 'BNK-0031', amount: -350 }],
      proposedEntry: {
        id: 'JE-2026-0031', date: 'Oct 31, 2026', description: 'Record October bank fees', entity: 'Orbit AI, Inc.',
        preparedBy: 'Reconciliation agent', status: 'prepared',
        lines: [
          { account: '6810 · Bank Fees', debit: 350, credit: 0, memo: 'Bank fees, Oct 2026 (BNK-0031)' },
          { account: '1000 · Operating Cash', debit: 0, credit: 350, memo: 'Bank fees, Oct 2026 (BNK-0031)' },
        ],
      },
      exceptionExplanation: 'The bank charged $350.00 in wire and account fees on Oct 31 that are not yet in the general ledger.',
      agentReasoning: [
        'Bank line BNK-0031 has no matching ledger entry within ±5 days or ±$0.01.',
        'The description matches standard wire and account analysis fees.',
        '6810 · Bank Fees is the standard account for this charge in the starter chart of accounts.',
      ],
    },
    consolidation: {
      period: 'October 2026',
      eliminationNote: 'Single-entity company. Consolidation becomes relevant when you add a subsidiary.',
      entities: [
        { id: 'or-us', name: 'Orbit AI, Inc.', shortName: 'Orbit AI', country: 'United States', currency: 'USD', fxRate: 1,
          lines: { revenue: 412000, cogs: 96000, salesMarketing: 118000, rnd: 236000, ga: 71000, icIncome: 0, icExpense: 0 } },
      ],
    },
    approval: {
      title: 'Cloud usage invoice — Cloudline Compute (October)',
      kind: 'agent_coding',
      amount: 8412.37,
      policy: 'Agent-prepared bills require approval by the Head of Finance before posting.',
      requiredApproverRole: 'Head of Finance',
      preparer: 'Payables agent',
      supportingDocs: [
        { name: 'Invoice CC-118204.pdf (fictional)', detail: 'October usage, $8,412.37' },
        { name: 'Usage export by tag (fictional)', detail: '80% production, 20% research clusters' },
      ],
      agentReasoning: [
        'Usage tagged “production” serves customers, so 80% ($6,729.90) is coded to Cost of Revenue — Hosting.',
        'Usage tagged “research” supports model development, so 20% ($1,682.47) is coded to R&D — Cloud Infrastructure.',
        'This split matches how the September invoice was approved.',
      ],
      confidenceNote: 'Prepared for review. Nothing posts until you approve it.',
      entry: {
        id: 'BILL-0412', date: 'Oct 31, 2026', description: 'Cloudline Compute — October usage', entity: 'Orbit AI, Inc.',
        preparedBy: 'Payables agent', status: 'prepared',
        lines: [
          { account: '5100 · Cost of Revenue — Hosting', debit: 6729.9, credit: 0 },
          { account: '6120 · R&D — Cloud Infrastructure', debit: 1682.47, credit: 0 },
          { account: '2000 · Accounts Payable', debit: 0, credit: 8412.37 },
        ],
      },
    },
    blockerTemplate: {
      id: 'blk-or', title: 'Unclear what implementation would require',
      detail: 'Alex is unsure what data, time and people a move to DualEntry would take for a single-entity company.',
      relatedMilestone: 'reconcile',
    },
    initialStakeholders: [{ id: 'sh_alex', name: 'Alex Rivera', email: 'alex@orbitai.example', role: 'Head of Finance', status: 'active' }],
  },

  // Post-purchase scenario: Northstar Labs some months later, as a live customer.
  customer: {
    id: 'customer',
    label: 'Post-purchase customer',
    shortLabel: 'Customer',
    personaSummary: 'Sarah Mitchell · Northstar Labs · Customer, first close complete',
    user: { id: 'usr_sarah', name: 'Sarah Mitchell', firstName: 'Sarah', role: 'VP Finance', email: 'sarah@northstarlabs.example' },
    account: {
      id: 'acct_northstar_customer', name: 'Northstar Labs', industry: 'B2B SaaS', currentERP: 'QuickBooks Online',
      entityCount: 3, currencies: ['USD', 'GBP', 'EUR'], annualRevenueBand: '$20M–$50M (demo)',
      purchaseTimeline: 'within_30', acquisitionSource: 'sales_invitation', assignedSalesOwner: 'Jordan Ellis',
    },
    defaultProfile: {
      currentERP: 'QuickBooks Online', goal: 'close', timeline: 'within_30', entityCount: 3,
      currencies: ['USD', 'GBP', 'EUR'], buyingRole: 'decision_maker', mainBlocker: '',
    },
    recommendedPath: 'own_data',
    messaging: { headline: 'Your October close is complete.', subhead: 'All three entities closed and consolidated in DualEntry.' },
    sampleCompanyName: 'Harbor Analytics (sample)',
    migration: northstarMigration,
    reconciliation: null as unknown as ScenarioFixture['reconciliation'],
    consolidation: null as unknown as ScenarioFixture['consolidation'],
    approval: null as unknown as ScenarioFixture['approval'],
    blockerTemplate: { id: 'blk-cust', title: '', detail: '', relatedMilestone: 'reconcile' },
    initialStakeholders: [{ id: 'sh_sarah', name: 'Sarah Mitchell', email: 'sarah@northstarlabs.example', role: 'VP Finance', status: 'active' }],
  },
};

// The customer scenario reuses Northstar's accounting fixtures where a screen needs them.
SCENARIOS.customer.reconciliation = SCENARIOS.quickbooks.reconciliation;
SCENARIOS.customer.consolidation = SCENARIOS.quickbooks.consolidation;
SCENARIOS.customer.approval = SCENARIOS.quickbooks.approval;

export const PROSPECT_SCENARIOS = ['quickbooks', 'netsuite', 'startup'] as const;
export const ALL_SCENARIOS: ScenarioId[] = ['quickbooks', 'netsuite', 'startup', 'customer'];
