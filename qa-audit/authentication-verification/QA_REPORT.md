# Authentication and Buyer Verification QA

Validated against the local Vite preview on 16 July 2026.

## Authentication coverage

- Logged-out guards for buyer, artist, admin, security, profile, notification, and user-management routes.
- Buyer, artist, and super-administrator sign-in, sign-out, session restoration, intended-route return, and role-aware navigation.
- Administrator MFA, invalid-code handling, recovery controls, optional user MFA, password change, forgot/reset password, lockout, suspension, session expiry, and device revocation.
- Registration, email verification, social-sign-in simulation, team invitation simulation, persistent profile updates, and demo reset.
- Responsive checks at 320, 375, 768, 1024, and 1440 pixels.

## Buyer verification coverage

- Queue analytics, search and status/tier/risk filters with five seeded status examples.
- Buyer states: Approved VIP, Under Review, Additional Information Required, Rejected, and Suspended.
- Ten-step draft wizard, step validation, save/exit persistence, projects, references, simulated document metadata, declarations, submission, withdrawal, and requested-information response.
- Admin summary, profile/company, usage/experience, project/reference, document, risk/checklist, notes/activity, reviewer assignment, information request, decision, restriction, suspension, reinstatement, and reverification controls.
- Buyer-safe decision copy was checked to ensure internal notes, reviewer rationale, and risk factors do not leak into buyer views.
- Catalog and licensing gating, dashboard entitlement changes, secure-delivery removal, and VIP capability display.
- Mobile checks at 320 pixels confirm page-level horizontal overflow is contained; the queue table scrolls inside its own responsive wrapper.
- Browser console remained clear of application errors during exercised routes.

## Build

`npm run build` passes. Vite reports only the existing advisory that the primary JavaScript bundle exceeds 500 kB.
