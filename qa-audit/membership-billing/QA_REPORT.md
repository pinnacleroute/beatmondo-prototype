# Membership Billing QA

Validated in the local beatmondo Vite preview on 16 July 2026.

## Exercised workflows

- Public plans, monthly/annual pricing, annual savings, eligibility copy, and logged-out plan preservation.
- Discovery buyer Professional checkout with billing address, India 18% mock GST, safe card validation, invoice creation, transaction creation, notification, and Pending Verification access.
- Declined, insufficient-funds, successful, and authentication-required test-card outcomes.
- Invalid discount and `FOUNDING10` totals.
- Required order acknowledgements and separate-licence-fee disclosure.
- Generated invoice detail, preserved billing snapshot, print/PDF/email simulations, and legal-tax-invoice disclaimer.
- Past-due banner, failed retry, grace period, expired payment method, replacement method, successful retry, invoice resolution, and billing-state restoration.
- Effective-access enforcement confirmed that payment recovery did not override Rachel Kim’s suspended buyer verification.
- Administrator analytics, filters, active VIP detail, entitlements, billing schedule, invoices, transactions, activity, partial refund, complimentary grant, manual enterprise membership, plan change, cancellation, reactivation, and data reset.
- Existing authentication and administrator MFA remained functional.
- Existing buyer-verification records were used by checkout and effective-access calculations without duplication.

## Responsive checks

Checked membership plans and the administrator membership table at 320, 375, 768, 1024, and 1440 pixels. Page-level horizontal overflow was absent. Wide administration tables remain inside a controlled scrolling wrapper.

## Build

`npm run build` passes. Vite reports the existing advisory about the primary JavaScript bundle exceeding 500 kB.

## Simulation boundaries

No real card processing, secure authentication, PDF generation, tax compliance, email delivery, background retry, currency conversion, enterprise contract, or refund occurs. These outcomes are persistent mock records for demonstration.
