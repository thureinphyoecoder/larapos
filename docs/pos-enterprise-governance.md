# POS Enterprise Governance Rules

## 1) Immutable Money Records
- `orders.total_amount`, `invoice_no`, `receipt_no`, `job_no`, and `payment_slip` are immutable after creation.
- Any correction must be stored in `financial_adjustments` with `adjustment_type`:
  - `reversal`
  - `adjustment`

## 2) Unique Numbering
- Order creation auto-generates:
  - `invoice_no`
  - `receipt_no`
  - `job_no`
- Format: `{BRANCH_CODE}-{YYYYMMDD}-{SEQUENCE}`
- Sequence state is managed in `document_sequences`.

## 3) Role Separation
- Staff roles now include `cashier`, `manager`, `accountant`, `technician` (plus existing legacy roles).
- Refund approval authority is restricted to `admin|manager|accountant`.

## 4) Audit Trail
- `audit_logs` records:
  - actor (`who`)
  - event (`what`)
  - timestamp (`when`)
  - `old_values` / `new_values`
  - request metadata (ip, user_agent)

## 5) Approval Flow
- `approval_requests` supports `discount` and `refund` requests.
- Refund status transitions require manager/accountant-level approval.

## 6) Stock as Event Stream
- `stock_movements` stores immutable movement events:
  - `receive`
  - `transfer`
  - `sale`
  - `consume`
  - `adjust`
- Order placement logs `sale`; restock/cancel logs `adjust`; inter-branch transfer logs paired `transfer` entries.

## 7) Daily & Shift Close
- `daily_branch_closings`: per-branch end-of-day reconciliation snapshot.
- `shift_closings`: per-cashier shift close record.
- Command: `php artisan pos:daily-close --date=YYYY-MM-DD`

## 8) Backup Governance
- See `docs/pos-backup-plan.md` for local + server backup policy, verification, retention, and restore runbook.
