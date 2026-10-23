# Perkly — rewards app prototype

Perkly is an original M Rewards-inspired concept for exploring a rewards experience. This is Phase 1: a responsive front-end prototype, not a production rewards business.

## Run it
Open `index.html` in a modern browser, or serve this folder with any static web server. No build step is required.

## Included
- Responsive overview dashboard and mobile navigation
- Demo earning activities and points balance
- Sample reward catalogue and confirmation dialog
- Activity history and local demo-state persistence
- Reset demo action
- Accessible labels, keyboard dismissal, and explicit demo-only notices

## Important limitations
- All activities, points and rewards are illustrative. There is no real money value or payout.
- State is stored in browser local storage and can be changed by the user; it is not trusted or secure.
- No account authentication, server, database, ad network, survey provider, payment service, or gift-card partner is connected.
- Do not use it to collect real user data or promise cash/rewards.

## Phase 2 preparation
- A Supabase/Postgres migration draft is available at `supabase/migrations/202610230001_perkly_core_schema.sql`.
- It defines profiles, earning tasks, rewards, a points ledger, task completions and redemptions.
- Row-level security is enabled on all six tables. Client roles can read only their own account records and active catalogues; clients cannot directly award points or write the ledger.
- The migration has **not yet been applied** to a database. Server-side transactional task-completion and redemption flows, authentication UI, admin authorization, and production security review are still required.

## Planned phases
1. Test and refine the prototype.
2. Create a dedicated backend project, review and apply the schema, then add authentication.
3. Implement secure server-side earning/redemption flows, admin review, abuse controls, and privacy/terms information.
4. Investigate legitimate reward-provider integrations and complete security/user testing before public launch.

## Tests
From the repository root:
```sh
node m-rewards/test.js
node m-rewards/test.js
```
GitHub Actions runs the checks twice on each qualifying push or pull request. Automated checks are smoke tests; manually test on a phone and desktop before launch.
