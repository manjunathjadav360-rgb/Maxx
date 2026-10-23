const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('resolveloop/index.html', 'utf8');
const checks = [
  ['page title', /<title>ResolveLoop — Purchase support, made clearer<\/title>/],
  ['case identifier', /Case RL-2048/],
  ['four resolution options', /data-key="replacement"/],
  ['partial refund option', /data-key="partial"/],
  ['full refund option', /data-key="full"/],
  ['evidence request option', /data-key="evidence"/],
  ['reset control', /onclick="resetDemo\(\)"/],
  ['explicit demo-only safeguard', /No live PayPal account is connected/],
  ['human approval safeguard', /Human approval/],
  ['known vs unverified facts', /Not verified: the reported damage/],
];
for (const [name, pattern] of checks) {
  assert.match(html, pattern, 'Missing or broken feature: ' + name);
  console.log('PASS:', name);
}
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'Inline application script exists');
new vm.Script(script[1], { filename: 'resolveloop-inline.js' });
console.log('PASS: inline JavaScript parses');
console.log('PASS: all ' + (checks.length + 2) + ' prototype checks passed');
