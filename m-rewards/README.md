# Perkly — rewards app

Perkly is an original rewards-product concept with a restrained, responsive interface. It is not affiliated with or endorsed by any other rewards brand.

## Run it
Open `index.html` in a modern browser, or serve this folder with a static web server.

## Current state
- Responsive demo dashboard, sample earning activities, sample rewards and activity history.
- Demo points persist in this browser only. They have no cash value.
- A Supabase project is active; the core schema and server-side earning/redemption migrations are applied.
- Row-level security is enabled on the six application tables: profiles, earning_tasks, rewards, points_ledger, task_completions and redemptions.
- Users can read their own account-related records; direct client writes cannot award points, edit the points ledger, or fulfil redemptions.
- Email/password sign-up and sign-in are connected to Supabase Auth; new accounts receive a profile row through a database trigger.
- Database RPCs now accept authenticated task submissions for review, award points only after an authorized admin approves a task, and process redemption requests transactionally. Per-user redemption locking prevents concurrent overspending; idempotency keys protect repeated requests.
- The activity page displays account-backed points and recent ledger entries separately from local demo points. Signed-in users can submit a sample task for review; a role-gated admin review panel can approve/reject pending submissions. Approval is enforced by the database role claim as well as the UI.
- Redemption requests are not actual vouchers, cash payouts or fulfilled rewards.
- Admin approval currently requires a trusted Supabase Auth `app_metadata.role = admin` claim; there is no admin dashboard or user-facing review workflow yet.

## Originality and third-party rights
- Use project-created copy, layout, code and simple interface symbols; do not copy another app's logo, artwork, screenshots, source code, or distinctive branding.
- Keep any future third-party images, fonts, libraries and reward-provider assets only when their licence or written permission permits the intended use. Track attribution and licence terms where required.
- Before public launch, check the Perkly name and logo for conflicts and obtain an appropriate legal review. No automated check can guarantee that a product is free from every possible copyright or trademark claim.

## Before public launch
1. Connect the signed-in web UI to the new RPCs and show account-backed ledger balances separately from demo data.
2. Provision admin claims securely and build a restricted admin review interface.
3. Add abuse controls, auditability, and cancellation/reversal rules before any live reward fulfillment.
4. Publish privacy, terms, reward eligibility and redemption rules.
5. Choose legitimate reward providers only after reviewing their contracts, pricing and permissions.
6. Test on real phones and desktops, review security advisories and confirm costs before enabling paid services.

## Tests
From the repository root, run twice:
```sh
node m-rewards/test.js
node m-rewards/test.js
```
GitHub Actions also runs the automated checks twice on qualifying changes. These are automated smoke tests, not a substitute for full browser, device or security testing.
