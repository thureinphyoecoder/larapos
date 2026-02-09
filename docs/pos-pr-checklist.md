# POS PR Checklist

## 1) Security & Access
- [ ] RBAC and permission gates enforced for every new endpoint/action.
- [ ] Branch/device authentication is separate from user auth.
- [ ] Rate limits configured for login, OTP, and sync endpoints.
- [ ] Incident logs do not expose PII or secrets.

## 2) Financial Integrity
- [ ] Payments remain append-only (no update/delete on payment events).
- [ ] Refund/discount actions require manager approval workflow.
- [ ] Invoice/receipt/job numbers are generated via sequence service (unique per branch/date).
- [ ] Order totals are derived from line items + discount + tax (no manual override).

## 3) Inventory Integrity
- [ ] Stock writes run in DB transaction and use row lock (`lockForUpdate`) where needed.
- [ ] Decrement uses guard condition (`stock_level >= qty`) to prevent oversell.
- [ ] Every stock change writes a stock movement event (`sale/transfer/adjust/...`).
- [ ] Restock/cancel paths are idempotent and use consistent qty fields.

## 4) Offline & Sync
- [ ] Offline queue handles create-order and replay safely on reconnect.
- [ ] Sync endpoint is idempotent and rejects duplicates.
- [ ] Conflict policy is documented (server wins / merge / reject with reason).
- [ ] Backup plan verified: local backup + server backup + restore test.

## 5) Observability & Audit
- [ ] Audit log captures who/what/when and old/new value snapshots.
- [ ] High-risk actions (refund, verify/reject payment, stock adjust) are audited.
- [ ] Daily close report available per branch and cashier shift.

## 6) UX / QA
- [ ] POS scan flow works with barcode gun and camera scan.
- [ ] Scan resolves exact variant SKU (not only first active variant).
- [ ] Cart qty cannot exceed current stock.
- [ ] Build/tests pass (`web + electron`) and key flows smoke-tested.
