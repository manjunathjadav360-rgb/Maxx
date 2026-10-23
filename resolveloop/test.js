const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('resolveloop/index.html', 'utf8');
const checks = [
  ['page title', '<title>ResolveLoop — Purchase support, made clearer</title>'],
  ['case identifier', 'Case RL-2048'],
  ['replacement option', 'data-key="replacement"'],
  ['partial refund option', 'data-key="partial"'],
  ['full refund option', 'data-key="full"'],
  ['evidence request option', 'data-key="evidence"'],
  ['reset control', 'onclick="resetDemo()"'],
  ['demo-only PayPal safeguard', 'No live PayPal account is connected'],
  ['human approval safeguard', 'Human approval'],
  ['known vs unverified facts', 'Not verified: the reported damage'],
  ['accessible approval dialog', 'id="approvalModal" role="presentation"><div class="modal" role="dialog" aria-modal="true"'],
  ['accessible policy dialog label', 'aria-labelledby="policyTitle"'],
  ['Escape key dismissal', "document.addEventListener('keydown'"],
  ['dialog focus on open', "modal.querySelector('[role=\"dialog\"]').focus()"],
  ['focus restored after close', "document.getElementById('approve').focus()"],
];
for (const [name, expected] of checks) {
  assert.ok(html.includes(expected), 'Missing or broken feature: ' + name);
  console.log('PASS:', name);
}
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'Inline application script exists');
new vm.Script(script[1], { filename: 'resolveloop-inline.js' });
console.log('PASS: inline JavaScript parses');
console.log('PASS: all ' + (checks.length + 2) + ' prototype checks passed');
