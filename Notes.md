so nakakabobo accounting pero nakita kong mga inputs and outputs across all shits na mga nakita kong csv mga examples 

## Transactions
- sales (mainly receipts, invoices, mga customer sales at payments)
- purchases (vendors bills, suppliers

## purchases and cost)
- cash, checksm and payment vouchers(tracking lng ng cash from sale or collection, mula sa pag kakaintindi ko. pretty much monitoring to ng cashflow kung san napupunta )
- credit/debits (returns, discounts at errors lng.)

## operation cost
- sales order 
- payroll 
- inventory (nakita ko to across shits csv's for finer details lang naman)
- Expense reports
- banks statements 
- deposits
- withdrawals
- loans
- taxes


## calculations

| Metric                    | Formula                                              | Inputs Used                                            |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Total Revenue/Income      | Sum of all sales + other income                      | Sales invoices, receiptsscribd+1                       |
| Cost of Goods Sold (COGS) | Beginning inventory + Purchases - Ending inventory   | Purchases, inventory recordsinvestopedia+1             |
| Gross Profit              | Total Revenue - COGS                                 | Revenue, COGSinvestopedia+2                            |
| Operating Expenses        | Sum of payroll + expenses + other indirect costs     | Payroll, expense reports, rent/utilitiesinvestopedia+1 |
| Net Profit/Income         | Gross Profit - Operating Expenses - Taxes - Interest | All above + taxes, loansinvestopedia+3                 |


more organization lng 


- [ ] 

> tong Accounting backend na to tinatanggap lng neto mga financial events at kinoconvert neto to double entry journal entries, tinatabi neto sa isang general ledger which is yung traditional SQL/NOSQL database natin, tyaka lahat ng mga derives, outputs or totals galing lahat sa ledger data natin. Operational records nakatabi to separately saka neto maapektohan yung accounting pag posted.

( yung credit at debit lng naman to need lng mag match bawat galaw ng pera. Holidng lng naman to, panget na lagay natin per purchase or sale whether maliit or malaki endorsed agad sa blockchain, makain sa space yun. So pinaka magandang nakita ko is gamitin yung merkle root type to ng algo para makapag endorsed tayo in bulk, yung mga i-endorsed lng is journal entries may certain limit to per journal, let's say mga 50,000 pesos maga trigger na yung backend to endorsed it at ma-stores sa blockchain. Mga Computation lng daily, monthly, quarterly, semi annually, and annually maganda pala na aggregation nalang pag hinihingi instead of saving it sa mga database at blockchain natin. In terms of auditability, cross referencing sa blockchain at yung sa SQL/NOSQL database. ) 

### Source Events

1. Revenue Source Events

- Sales invoice issued
- Customer payment received 
- Sales return / refund

2. Purchase Source Events

- Vendor Bill received
- vendor Payment made
- Purchase return

3. Cash & back Source events

- Cash Received 
- Cash paid
- Bank deposits 
- Bank withdrawal 
- Bank fee 

4. Inventory Source Events

- Inventory Received
- Inventory Sold
- Inventory Adjusted

5. Operating Cost Source Events

- Payroll run 
- Expense claim submitted
- Expense paid

6. Financing & statutory Source Events

- Loan received
- Loan repayment
- Tax assessed 
- Tax paid 

### Accounting Events

> example accounting events

| Source Event              | Debit Account                 | Credit Account                            |
| ------------------------- | ----------------------------- | ----------------------------------------- |
| Revenue                   |                               |                                           |
| Sales invoice issued      | Accounts Receivable           | Sales Revenue patriotsoftware+1           |
| Customer payment received | Cash/Bank                     | Accounts Receivable patriotsoftware​       |
| Sales return/refund       | Sales Returns/Revenue         | Accounts Receivable/Cash hourly​           |
| Purchases                 |                               |                                           |
| Vendor bill received      | Purchases/Inventory/Expense   | Accounts Payable unleashedsoftware​        |
| Vendor payment made       | Accounts Payable              | Cash/Bank unleashedsoftware​               |
| Purchase return           | Accounts Payable              | Purchases/Inventory unleashedsoftware​     |
| Cash/Bank                 |                               |                                           |
| Cash received             | Cash                          | (From other credits)                      |
| Cash paid                 | Expense                       | Cash germanna​                             |
| Bank deposit              | Bank                          | Cash/Receivables                          |
| Bank withdrawal/fee       | Expense/Bank Fee              | Bank germanna​                             |
| Inventory                 |                               |                                           |
| Inventory received        | Inventory                     | Accounts Payable/Cash unleashedsoftware+1 |
| Inventory sold            | COGS                          | Inventory patriotsoftware+1               |
| Inventory adjusted        | Inventory Loss/COGS           | Inventory                                 |
| Operating Costs           |                               |                                           |
| Payroll run               | Payroll Expense/Salaries      | Cash/Accrued Payroll germanna​             |
| Expense claim submitted   | Expense (e.g., Utilities)     | Accrued Expenses                          |
| Expense paid              | Accrued Expenses              | Cash/Bank                                 |
| Financing/Statutory       |                               |                                           |
| Loan received             | Cash                          | Loan Payable                              |
| Loan repayment            | Loan Payable/Interest Expense | Cash                                      |
| Tax assessed              | Tax Expense                   | Tax Payable                               |
| Tax paid                  | Tax Payable                   | Cash germanna​                             |


### Core Derived Outputs

1. Trial Balance per period 
- Sum of Debit/Credit per account for a period (YTD)

2. Income Statements 
- Revenue - COGS = Gross Profit 
- Gross Profit - Operating Expenses - Taxes - Interest = Net income.

3. Balance Sheet 
- Assets, liabilities, Equity as of a date. 

4. Cash Flow Statements
- Cash from operation, investing, Financing activities. 

## aggregations 

> Daily / monthly / quarterly / Semi annually / annually

- Revenue totals by account, by customer, by product.
- COGS and gross margin
- Operating expenses by category
- Cash-in / cash-out.
- Tax liability over a period.


(Umm wait lng sa functional at non functional requirements medj burnt out utak ko di ako makapag isip ng ayos)

(btw yung sa Accounting_Exatraction.md ano lng yan extracted core shits lng yan sa frappe books gusto ko pa matutunan yung accounting system kaso sobrang haba at nakakaligaw yung docs so ganyan ginawa ko. Siguro before mid night nagawa ko na yung functional at non functional requirements at rekta nako nun sa HLD architecture ng backend natin)