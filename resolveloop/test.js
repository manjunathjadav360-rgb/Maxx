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
  ['dialog focus on open', "modal.querySelector("],
  ['focus restored after close', "document.getElementById('approve').focus()"],
];
for (const [name, expected] of checks) {
  assert.ok(html.includes(expected), 'Missing or broken feature: ' + name);
  console.log('PASS:', name);
}

const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'Inline application script exists');
new vm.Script(match[1], { filename: 'resolveloop-inline.js' });
console.log('PASS: inline JavaScript parses');

// Run the real application functions against a small DOM test double.
class FakeClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    const shouldAdd = force === undefined ? !this.values.has(value) : Boolean(force);
    shouldAdd ? this.values.add(value) : this.values.delete(value);
    return shouldAdd;
  }
}
class FakeElement {
  constructor(id = '') {
    this.id = id; this.textContent = ''; this.value = ''; this.disabled = false;
    this.style = {}; this.dataset = {}; this.classList = new FakeClassList();
    this.listeners = {}; this.focused = false; this.children = {};
  }
  set className(value) {
    this._className = value;
    this.classList = new FakeClassList(String(value).split(' ').filter(Boolean));
  }
  get className() { return this._className || [...this.classList.values].join(' '); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  focus() { this.focused = true; }
  querySelector(selector) { return this.children[selector] || null; }
}
const ids = ['summary','approve','notice','approvalModal','policyModal','modalTitle','modalDesc','reason','progress','progressText','status','statusSub','bar','steps','percent','lastMark','lastTitle','lastDesc','pill','toast'];
const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id)]));
elements.approvalModal.classList.add('modalbg');
elements.policyModal.classList.add('modalbg');
const dialog = new FakeElement('approval-dialog');
elements.approvalModal.children['[role="dialog"]'] = dialog;
elements.reason.value = 'initial note';
const choices = ['replacement','partial','full','evidence'].map(key => {
  const e = new FakeElement(key); e.dataset.key = key; return e;
});
const modalBackgrounds = [elements.approvalModal, elements.policyModal];
let keydownHandler;
const document = {
  getElementById(id) { assert.ok(elements[id], 'Unexpected element id: ' + id); return elements[id]; },
  querySelectorAll(selector) {
    if (selector === '.choice') return choices;
    if (selector === '.modalbg') return modalBackgrounds;
    return [];
  },
  querySelector(selector) {
    if (selector === '.modalbg.show') return modalBackgrounds.find(e => e.classList.contains('show')) || null;
    return null;
  },
  addEventListener(type, fn) { if (type === 'keydown') keydownHandler = fn; },
};
const context = { document, window: {}, setTimeout: () => 1, clearTimeout: () => {}, console };
vm.createContext(context);
vm.runInContext(match[1], context, { filename: 'resolveloop-inline.js' });

context.choose('replacement');
assert.equal(elements.summary.textContent, 'The buyer is open to a replacement. The merchant should confirm stock and shipping details. No refund is requested in this path.');
assert.equal(choices.find(e => e.dataset.key === 'replacement').classList.contains('selected'), true);
console.log('PASS: choosing an option updates the case summary and selection');

context.openModal();
assert.equal(elements.approvalModal.classList.contains('show'), true);
assert.equal(dialog.focused, true);
console.log('PASS: review action opens and focuses the approval dialog');

elements.reason.value = 'Confirm stock before offering replacement.';
context.confirmOutcome();
assert.equal(elements.status.textContent, 'Replacement proposed');
assert.equal(elements.approve.disabled, true);
assert.equal(elements.notice.classList.contains('show'), true);
assert.match(elements.notice.textContent, /no live payment was changed/i);
console.log('PASS: confirming records a local-only decision and locks the case');

context.resetDemo();
assert.equal(elements.status.textContent, 'Decision needed');
assert.equal(elements.approve.disabled, false);
assert.equal(choices.every(e => !e.disabled), true);
assert.equal(elements.progress.textContent, '67%');
console.log('PASS: reset restores the sample case');

context.choose('evidence');
context.openModal();
elements.reason.value = 'Please provide a photo of the damaged item.';
context.confirmOutcome();
assert.equal(elements.status.textContent, 'Evidence requested');
assert.equal(elements.progress.textContent, '75%');
console.log('PASS: evidence-request path updates status and progress');

context.resetDemo();
context.openModal();
keydownHandler({ key: 'Escape' });
assert.equal(elements.approvalModal.classList.contains('show'), false);
assert.equal(elements.approve.focused, true);
console.log('PASS: Escape closes the approval dialog and restores focus');

console.log('PASS: all ' + (checks.length + 8) + ' prototype and behavior checks passed');
