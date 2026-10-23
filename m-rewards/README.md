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

## Planned phases
1. Test and refine the prototype.
2. Add a server-backed database and secure authentication, with server-controlled points ledger and audit trail.
3. Add an admin review workflow, abuse controls, terms/privacy information, and legitimate reward-provider integration.
4. Conduct security and user testing before a public launch.

## Tests
From the repository root:
```sh
node m-rewards/test.js
node m-rewards/test.js
```
GitHub Actions runs the checks twice on each qualifying push or pull request. Automated checks are smoke tests; manually test on a phone and desktop before launch.
