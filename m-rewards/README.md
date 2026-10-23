# Perkly — rewards app

Perkly is an original rewards-product concept with a restrained, responsive interface. It is not affiliated with or endorsed by any other rewards brand.

## Run it
Open `index.html` in a modern browser, or serve this folder with a static web server.

## Current state
- Responsive demo dashboard, sample earning activities, sample rewards and activity history.
- Demo points persist in this browser only. They have no cash value.
- A Supabase project is active and the core schema migration has been applied.
- Row-level security is enabled on the six application tables: profiles, earning_tasks, rewards, points_ledger, task_completions and redemptions.
- Users can read their own account-related records; the client has no policy to award points, edit the points ledger, or fulfil redemptions.
- Email/password sign-up and sign-in are connected to Supabase Auth; new accounts receive a profile row through a database trigger.
- Demo points are still local and are not connected to the account. Server-verified earning/redemption flows are not yet implemented.

## Originality and third-party rights
- Use project-created copy, layout, code and simple interface symbols; do not copy another app's logo, artwork, screenshots, source code, or distinctive branding.
- Keep any future third-party images, fonts, libraries and reward-provider assets only when their licence or written permission permits the intended use. Track attribution and licence terms where required.
- Before public launch, check the Perkly name and logo for conflicts and obtain an appropriate legal review. No automated check can guarantee that a product is free from every possible copyright or trademark claim.

## Before public launch
1. Implement server-side, transactional task completion and redemption flows with abuse controls.
2. Add an admin review process and proper access controls.
3. Publish privacy, terms, reward eligibility and redemption rules.
4. Choose legitimate reward providers only after reviewing their contracts, pricing and permissions.
5. Test on real phones and desktops, review security advisories and confirm costs before enabling paid services.

## Tests
From the repository root, run twice:
```sh
node m-rewards/test.js
node m-rewards/test.js
```
GitHub Actions also runs the automated checks twice on qualifying changes. These are automated smoke tests, not a substitute for full browser, device or security testing.
