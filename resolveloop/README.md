# ResolveLoop

ResolveLoop is a small, responsive prototype for making purchase-issue resolution clearer for buyers and merchants.

## Try it

Open `index.html` in a modern browser. Choose a proposed outcome (replacement, partial refund, full refund, or request for evidence), review the note, and record the demo decision. Use **Reset sample case** to try another path.

## What this prototype demonstrates

- A shared case view with the order amount, buyer report, sample policy, and case progress.
- A plain-language summary that separates reported information from facts that have not been verified.
- Four explicit next-step options, followed by a human review step.
- A local-only decision note and status update, plus a resettable sample case.
- Responsive layout for phone and desktop.

## Important limitations

This is a front-end prototype using illustrative data. It does **not** connect to PayPal, verify transactions or merchant policies, persist cases to a server, send evidence requests, issue refunds, or arrange shipments. No real payment action occurs. A production version would need authenticated server-side transaction access, role-based authorisation, audit logs, privacy controls, and PayPal sandbox integration before any live integration.

## Tests

The repository includes a lightweight Node.js check that validates key UI safeguards and confirms the inline JavaScript parses. GitHub Actions runs the same checks twice for each qualifying push or pull request. You can also run them locally from the repository root:

```sh
node resolveloop/test.js
node resolveloop/test.js
```

These checks are automated smoke tests, not a replacement for manually testing each button and layout in a browser.
