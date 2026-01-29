# Frappe Books - Accounting Components Extraction

This document outlines the core accounting modules and logic you can extract and reuse from Frappe Books for your own implementation.

---

## 1. CORE ACCOUNTING ARCHITECTURE

### 1.1 Double-Entry Accounting System

**File**: `models/Transactional/LedgerPosting.ts`

The foundation of accounting. Every transaction creates balanced ledger entries.

```typescript
class LedgerPosting {
  // Core methods
  async debit(account: string, amount: Money)
  async credit(account: string, amount: Money)
  async post() // Saves entries
  async postReverse() // Reverses entries
  
  // Validation
  _validateIsEqual() // Ensures Debit = Credit
  _getTotalDebitAndCredit() // Calculates totals
}
```

**Key concept**: For every transaction (Invoice, Payment, etc.), this class:
1. Creates matching debit/credit entries
2. Validates they balance (Debit = Credit)
3. Creates AccountingLedgerEntry records in database

---

## 2. TRANSACTION TYPES

### 2.1 Sales Invoice
**File**: `models/baseModels/SalesInvoice/SalesInvoice.ts`

A sales transaction that creates ledger entries:

```typescript
async getPosting() {
  const posting = new LedgerPosting(this, fyo);
  
  if (isReturn) {
    await posting.credit(account, total); // Customer returns goods
  } else {
    await posting.debit(account, total); // Customer owes us
  }
  
  // For each item
  for (const item of items) {
    if (isReturn) {
      await posting.debit(item.account, amount); // Stock back
    } else {
      await posting.credit(item.account, amount); // Stock out
    }
  }
  
  // Handle taxes
  for (const tax of taxes) {
    await posting.debit(tax.account, tax.amount);
  }
  
  // Round off differences
  await posting.makeRoundOffEntry();
}
```

**Ledger entries created**:
- Debit: Debtors (customer owes money)
- Credit: Revenue/Sales Account
- Debit/Credit: Tax accounts
- Debit/Credit: Discount accounts (if any)

### 2.2 Purchase Invoice
**File**: `models/baseModels/PurchaseInvoice/PurchaseInvoice.ts`

Mirror of sales invoice but from supplier perspective:

```typescript
async getPosting() {
  const posting = new LedgerPosting(this, fyo);
  
  if (isReturn) {
    await posting.debit(account, total); // We return goods
  } else {
    await posting.credit(account, total); // We owe supplier
  }
  
  // Items purchased
  for (const item of items) {
    if (isReturn) {
      await posting.credit(item.account, amount);
    } else {
      await posting.debit(item.account, amount);
    }
  }
}
```

### 2.3 Payment
**File**: `models/baseModels/Payment/Payment.ts`

Handles cash/bank transactions:

```typescript
async getPosting() {
  const posting = new LedgerPosting(this, fyo);
  
  const paymentAccount = this.paymentAccount; // Cash/Bank
  const account = this.account; // Debtors/Creditors
  
  // Money moves FROM account TO paymentAccount
  await posting.debit(paymentAccount, amount);
  await posting.credit(account, amount);
  
  // Handle taxes if any
  for (const tax of taxes) {
    await posting.debit(tax.from_account, tax.amount);
    await posting.credit(tax.account, tax.amount);
  }
}
```

**Example**: Receiving payment from customer
- Debit: Cash/Bank (money received)
- Credit: Debtors (customer owes less)

### 2.4 Journal Entry
**File**: `models/baseModels/JournalEntry/JournalEntry.ts`

Manual accounting entries for complex transactions:

```typescript
async getPosting() {
  const posting = new LedgerPosting(this, fyo);
  
  for (const row of accounts) {
    if (row.debit > 0) {
      await posting.debit(row.account, row.debit);
    } else if (row.credit > 0) {
      await posting.credit(row.account, row.credit);
    }
  }
  
  return posting;
}
```

**Common uses**:
- Bank reconciliation
- Opening balances
- Adjustments
- Inter-account transfers

---

## 3. DATABASE SCHEMA

### 3.1 Account Chart of Accounts
**File**: `schemas/app/Account.json`

Structure for defining accounts:

```json
{
  "name": "Account",
  "fields": [
    { "fieldname": "name", "fieldtype": "String", "label": "Account Name" },
    { "fieldname": "accountType", "fieldtype": "Link", "label": "Account Type" },
    { "fieldname": "parentAccount", "fieldtype": "Link", "label": "Parent Account" },
    { "fieldname": "isGroup", "fieldtype": "Check", "label": "Is Group" },
    { "fieldname": "currency", "fieldtype": "Link", "label": "Currency" },
    { "fieldname": "balance", "fieldtype": "Currency", "label": "Balance" }
  ]
}
```

**Account Types**:
- Asset (Debtors, Cash, Bank, Inventory, Fixed Assets)
- Liability (Creditors, Loans, Provisions)
- Equity (Capital, Retained Earnings)
- Income (Sales, Service Revenue)
- Expense (COGS, Salaries, Rent, etc.)

### 3.2 Accounting Ledger Entry
**File**: `schemas/app/AccountingLedgerEntry.json`

The actual ledger record:

```json
{
  "name": "AccountingLedgerEntry",
  "fields": [
    { "fieldname": "account", "fieldtype": "Link", "label": "Account" },
    { "fieldname": "date", "fieldtype": "Date", "label": "Date" },
    { "fieldname": "party", "fieldtype": "String", "label": "Party" },
    { "fieldname": "debit", "fieldtype": "Currency", "label": "Debit" },
    { "fieldname": "credit", "fieldtype": "Currency", "label": "Credit" },
    { "fieldname": "referenceType", "fieldtype": "String", "label": "Reference Type" },
    { "fieldname": "referenceName", "fieldtype": "String", "label": "Reference Name" },
    { "fieldname": "reverted", "fieldtype": "Check", "label": "Reverted" }
  ]
}
```

### 3.3 Payment Schema
**File**: `schemas/app/Payment.json`

```json
{
  "name": "Payment",
  "fields": [
    { "fieldname": "party", "fieldtype": "Link", "label": "Party" },
    { "fieldname": "paymentType", "fieldtype": "Select", "options": "Pay\nReceive" },
    { "fieldname": "paymentMethod", "fieldtype": "String", "label": "Method" },
    { "fieldname": "amount", "fieldtype": "Currency", "label": "Amount" },
    { "fieldname": "account", "fieldtype": "Link", "label": "From Account" },
    { "fieldname": "paymentAccount", "fieldtype": "Link", "label": "To Account" },
    { "fieldname": "date", "fieldtype": "Date" },
    { "fieldname": "for", "fieldtype": "Table", "label": "Payment For" }
  ]
}
```

### 3.4 Invoice Schemas

**Sales Invoice** (`schemas/app/SalesInvoice.json`):
```json
{
  "name": "SalesInvoice",
  "fields": [
    { "fieldname": "party", "fieldtype": "Link", "label": "Customer" },
    { "fieldname": "items", "fieldtype": "Table", "childtype": "SalesInvoiceItem" },
    { "fieldname": "taxes", "fieldtype": "Table", "childtype": "TaxSummary" },
    { "fieldname": "netTotal", "fieldtype": "Currency" },
    { "fieldname": "grandTotal", "fieldtype": "Currency" },
    { "fieldname": "outstandingAmount", "fieldtype": "Currency" },
    { "fieldname": "account", "fieldtype": "Link", "label": "Debtors Account" },
    { "fieldname": "date", "fieldtype": "Date" }
  ]
}
```

**Purchase Invoice** (`schemas/app/PurchaseInvoice.json`):
- Same structure but for suppliers
- `account` field typically points to Creditors

### 3.5 Journal Entry
**File**: `schemas/app/JournalEntry.json`

```json
{
  "name": "JournalEntry",
  "fields": [
    { "fieldname": "entryType", "fieldtype": "String", "label": "Type" },
    { "fieldname": "date", "fieldtype": "Date" },
    { "fieldname": "accounts", "fieldtype": "Table", "childtype": "JournalEntryAccount" }
  ]
}
```

---

## 4. KEY ACCOUNTING LOGIC

### 4.1 Invoice Outstanding Amount Calculation

**File**: `models/baseModels/Invoice/Invoice.ts`

```typescript
// Outstanding = Grand Total - Paid Amount
get outstandingAmount(): Money {
  const totalPaymentAmount = this.getTotalPaymentAmount();
  return this.grandTotal!.sub(totalPaymentAmount);
}

// Can create payment for remaining outstanding
getPayment(): Payment | null {
  const paymentAmount = this.outstandingAmount;
  
  // Creates payment doc with reference to invoice
  return this.fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: this.party,
    amount: paymentAmount,
    referenceType: this.schemaName,
    referenceName: this.name,
  });
}
```

### 4.2 Tax Calculation

**File**: `models/baseModels/Invoice/Invoice.ts`

```typescript
// Get tax for item
getTaxAmount(item: InvoiceItem): Money {
  return item.amount!.mul(taxRate / 100);
}

// Summary of all taxes
getTaxSummary(): TaxSummary[] {
  const taxMap = {}; // Group by account
  
  for (const item of items) {
    for (const detail of item.taxes) {
      if (!taxMap[detail.account]) {
        taxMap[detail.account] = 0;
      }
      taxMap[detail.account] += getTaxAmount(item);
    }
  }
  
  return Object.entries(taxMap).map(([account, amount]) => ({
    account,
    amount,
  }));
}
```

### 4.3 Ledger Entry Reversal

**File**: `models/baseModels/AccountingLedgerEntry/AccountingLedgerEntry.ts`

```typescript
async revert() {
  if (this.reverted) return;
  
  // Mark original as reverted
  await this.set('reverted', true);
  
  // Create reversing entry (debit becomes credit and vice versa)
  const reversing = new AccountingLedgerEntry({
    account: this.account,
    date: new Date(),
    debit: this.credit, // Swap
    credit: this.debit,
    reverts: this.name,
    reverted: true,
  });
  
  await this.sync();
  await reversing.sync();
}
```

This is how cancellations work - the original entry is marked reverted and a reversing entry is created.

### 4.4 Rounding Off Differences

```typescript
async makeRoundOffEntry() {
  const { debit, credit } = this._getTotalDebitAndCredit();
  const difference = debit.sub(credit);
  
  if (difference.isZero()) return;
  
  const roundOffAccount = await this._getRoundOffAccount();
  
  if (difference.isPositive()) {
    await this.credit(roundOffAccount, difference.abs());
  } else {
    await this.debit(roundOffAccount, difference.abs());
  }
}
```

Handles rounding errors from currency conversions.

---

## 5. FINANCIAL REPORTS

### 5.1 General Ledger
**File**: `reports/GeneralLedger/GeneralLedger.ts`

Shows all transactions for each account:

```typescript
async getData() {
  // Group ledger entries by account
  const entries = await this.fyo.db.getAll('AccountingLedgerEntry', {
    filters: { account: selectedAccount },
    orderBy: { date: 'asc' },
  });
  
  // Calculate running balance
  let balance = 0;
  return entries.map(entry => ({
    date: entry.date,
    debit: entry.debit,
    credit: entry.credit,
    balance: balance += (entry.debit - entry.credit),
  }));
}
```

### 5.2 Trial Balance
**File**: `reports/TrialBalance/TrialBalance.ts`

Shows debit/credit totals per account to verify balance:

```typescript
async getData() {
  const accounts = await this.fyo.db.getAll('Account');
  
  const result = accounts.map(account => {
    const entries = await this.fyo.db.getAll('AccountingLedgerEntry', {
      filters: { account: account.name },
    });
    
    const debitTotal = entries.reduce((sum, e) => sum + e.debit, 0);
    const creditTotal = entries.reduce((sum, e) => sum + e.credit, 0);
    
    return {
      account: account.name,
      debit: debitTotal,
      credit: creditTotal,
    };
  });
  
  // Total debit should equal total credit
  return result;
}
```

### 5.3 Balance Sheet
**File**: `reports/BalanceSheet/BalanceSheet.ts`

Shows Assets = Liabilities + Equity:

```typescript
async getBalanceSheet() {
  const assets = await this.getAccountBalance('Asset');
  const liabilities = await this.getAccountBalance('Liability');
  const equity = await this.getAccountBalance('Equity');
  
  return {
    assets: assets, // Should equal liabilities + equity
    liabilities: liabilities,
    equity: equity,
    totalAssets: assets,
    totalLiabilities: liabilities + equity,
  };
}
```

### 5.4 Profit & Loss
**File**: `reports/ProfitAndLoss/ProfitAndLoss.ts`

Shows Income - Expense = Profit:

```typescript
async getProfitLoss() {
  const income = await this.getAccountBalance('Income');
  const expense = await this.getAccountBalance('Expense');
  
  return {
    income: income,
    expense: expense,
    netProfit: income - expense,
  };
}
```

---

## 6. TRANSACTIONAL SYSTEM

### 6.1 Transactional Base Class
**File**: `models/Transactional/Transactional.ts`

Base for all accounting documents (Invoice, Payment, Journal Entry):

```typescript
abstract class Transactional extends Doc {
  // Must implement this
  abstract async getPosting(): Promise<LedgerPosting>;
  
  async afterSubmit() {
    const posting = await this.getPosting();
    await posting.post(); // Save ledger entries
  }
  
  async afterCancel() {
    // Reverse all ledger entries
    const entries = await this.fyo.db.getAll('AccountingLedgerEntry', {
      filters: {
        referenceType: this.schemaName,
        referenceName: this.name,
        reverted: false,
      },
    });
    
    for (const entry of entries) {
      const doc = await this.fyo.doc.getDoc('AccountingLedgerEntry', entry.name);
      await doc.revert();
    }
  }
}
```

---

## 7. ACCOUNTING SETTINGS

**File**: `schemas/app/AccountingSettings.json`

Configuration for accounting behavior:

```json
{
  "fields": [
    { "fieldname": "roundOffAccount", "fieldtype": "Link", "label": "Rounding Adjustment Account" },
    { "fieldname": "enableDiscounting", "fieldtype": "Check" },
    { "fieldname": "roundToTheNearestInteger", "fieldtype": "Check" },
    { "fieldname": "costOfGoodsSold", "fieldtype": "Link" },
    { "fieldname": "stockInHand", "fieldtype": "Link" }
  ]
}
```

---

## 8. EXTRACTION GUIDE

To build your own system:

### Step 1: Database Schema
- Create tables for: Account, AccountingLedgerEntry, SalesInvoice, PurchaseInvoice, Payment, JournalEntry
- Structure mirroring `schemas/app/`

### Step 2: Core Logic
```
1. Implement LedgerPosting class
   - debit() / credit() methods
   - Validation (total debit = total credit)
   - Posting to database

2. Implement Document classes
   - SalesInvoice.getPosting()
   - PurchaseInvoice.getPosting()
   - Payment.getPosting()
   - JournalEntry.getPosting()

3. Implement Transactional base
   - afterSubmit() → create ledger entries
   - afterCancel() → reverse ledger entries
```

### Step 3: Reports
```
1. General Ledger - group entries by account
2. Trial Balance - verify debit = credit totals
3. Balance Sheet - assets vs liabilities + equity
4. Profit & Loss - income vs expense
```

### Step 4: Features
```
- Invoice to Payment linking
- Outstanding amount tracking
- Tax calculation and posting
- Currency conversion (if needed)
- Batch operations
```

---

## 9. PHILIPPINE-SPECIFIC CONSIDERATIONS

The current schema has regional support in:
- `schemas/regional/in/` - India GST compliance
- `models/regionalModels/in/` - India-specific models

For Philippine Peso (PHP) implementation:

**You'll need to add**:
1. BIR (Bureau of Internal Revenue) compliance
   - Withholding Tax (BIR Form 2307)
   - VAT treatment
   - Filing requirements

2. Philippine account chart structure
   - Standard account codes
   - Required accounts for BIR

3. Tax calculations specific to Philippines
   - EVATs, expanded withholding taxes
   - Monthly/quarterly returns

4. Reports for BIR filing
   - Tax returns
   - Monthly/quarterly statements

---

## 10. FILES TO REVIEW IN DETAIL

Priority order for extraction:

1. **Core Logic**:
   - `models/Transactional/LedgerPosting.ts` (50 lines for core debit/credit logic)
   - `models/Transactional/Transactional.ts` (80 lines for submit/cancel workflow)

2. **Transaction Types**:
   - `models/baseModels/Invoice/Invoice.ts` (base invoice logic)
   - `models/baseModels/SalesInvoice/SalesInvoice.ts` (posting logic)
   - `models/baseModels/Payment/Payment.ts` (payment logic)
   - `models/baseModels/JournalEntry/JournalEntry.ts` (journal entry logic)

3. **Database**:
   - `schemas/app/Account.json`
   - `schemas/app/AccountingLedgerEntry.json`
   - `schemas/app/Invoice.json`
   - `schemas/app/Payment.json`
   - `schemas/app/JournalEntry.json`

4. **Reports**:
   - `reports/GeneralLedger/GeneralLedger.ts`
   - `reports/TrialBalance/TrialBalance.ts`
   - `reports/BalanceSheet/BalanceSheet.ts`
   - `reports/ProfitAndLoss/ProfitAndLoss.ts`

---

## 11. IMPLEMENTATION STRATEGY

**Recommended approach for PHP-based accounting app**:

```typescript
// Phase 1: Core
class LedgerPosting { /* debit/credit */ }
class Transactional { /* submit/cancel */ }

// Phase 2: Basic Transactions
class Invoice extends Transactional { }
class Payment extends Transactional { }
class JournalEntry extends Transactional { }

// Phase 3: Reports
class GeneralLedger { }
class TrialBalance { }
class BalanceSheet { }
class ProfitAndLoss { }

// Phase 4: PH-Specific
class WithholdingTax { }
class BIRCompliance { }
class VAT { }
```

This allows you to reuse proven logic while customizing for Philippines requirements.
