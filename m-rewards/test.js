const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('m-rewards/index.html', 'utf8');
const schema = fs.readFileSync('m-rewards/supabase/migrations/202610230001_perkly_core_schema.sql', 'utf8');
const checks = [
  ['document title', '<title>Perkly — Simple rewards, every day</title>'],
  ['mobile navigation', 'class="mobile-nav"'],
  ['demo mode label', 'Demo mode'],
  ['no cash value disclosure', 'Demo points · no cash value'],
  ['sample rewards disclosure', 'No real reward, voucher or cash will be issued.'],
  ['local persistence implementation', 'localStorage'],
  ['earn page', 'id="page-earn"'],
  ['rewards page', 'id="page-rewards"'],
  ['activity page', 'id="page-activity"'],
  ['reset demo', 'function resetDemo()'],
  ['accessible modal', 'role="dialog" aria-modal="true"'],
  ['keyboard escape', "e.key==='Escape'"],
  ['no real money disclaimer', 'No real-money rewards are enabled'],
];
for (const [name, expected] of checks) {
  assert.ok(html.includes(expected), 'Missing feature or safeguard: ' + name);
  console.log('PASS:', name);
}
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'Inline application script exists');
new vm.Script(match[1], { filename: 'perkly-inline.js' });
console.log('PASS: inline JavaScript parses');

// Evaluate the actual app code with a minimal DOM/localStorage test double.
class Element {
  constructor(id='') { this.id=id; this.textContent=''; this.innerHTML=''; this.dataset={}; this.disabled=false; this.classList={items:new Set(),add(x){this.items.add(x)},remove(x){this.items.delete(x)},contains(x){return this.items.has(x)},toggle(x,on){if(on)this.items.add(x);else this.items.delete(x)}}; this.listeners={}; this.value=''; }
  addEventListener(type,fn){(this.listeners[type] ||= []).push(fn)}
  focus(){document.activeElement=this}
}
const ids=['balance','earnBalance','rewardBalance','historyBalance','completedCount','homeTasks','allTasks','recentActivity','historyList','catalog','toast','modalTitle','modalText','modalBackdrop','cancelModal','confirmModal','pageTitle'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const document={
 activeElement:null,
 getElementById(id){assert.ok(elements[id], 'Unexpected DOM id: '+id);return elements[id]},
 querySelectorAll(selector){if(selector===' .page')return[];return [];},
 querySelector(){return null},
 addEventListener(type,fn){(this.listeners ||= {})[type]=fn},
};
const storage={data:{},getItem(k){return this.data[k]??null},setItem(k,v){this.data[k]=v}};
const window={scrollTo(){}};
const context={document,window,localStorage:storage,console,setTimeout:()=>1,clearTimeout(){},Intl,Date,JSON,Number,Array,String,Math,structuredClone};
vm.createContext(context);
vm.runInContext(match[1],context,{filename:'perkly-inline.js'});
assert.equal(elements.balance.textContent,'1,250');
assert.equal(String(elements.completedCount.textContent),'2');
console.log('PASS: initial demo balance and completed task count render');
context.claimTask('profile');
assert.equal(vm.runInContext('state.balance',context),1350);
assert.equal(vm.runInContext("state.completed.includes('profile')",context),true);
assert.equal(vm.runInContext('state.history.at(-1).points',context),100);
console.log('PASS: claiming a task adds points once and records history');
context.claimTask('profile');
assert.equal(vm.runInContext('state.balance',context),1350);
console.log('PASS: duplicate task claim does not award points twice');
context.openReward('coffee');
assert.equal(elements.modalBackdrop.classList.contains('show'),true);
context.confirmReward();
assert.equal(vm.runInContext('state.balance',context),850);
assert.equal(vm.runInContext("state.redeemed.includes('coffee')",context),true);
assert.equal(vm.runInContext('state.history.at(-1).type',context),'debit');
console.log('PASS: reward redemption deducts points and records a debit');
context.openReward('coffee');
assert.equal(elements.modalBackdrop.classList.contains('show'),false);
context.resetDemo();
assert.equal(vm.runInContext('state.balance',context),1250);
assert.equal(vm.runInContext('state.completed.length',context),2);
assert.equal(vm.runInContext('state.redeemed.length',context),0);
console.log('PASS: reset restores initial demo state');
assert.ok(storage.data['perkly-demo-state']);
console.log('PASS: demo state saves to local storage');
console.log('PASS: all '+(checks.length+7)+' prototype checks passed');

const schemaChecks = [
  ['profile table extension', 'alter table public.profiles'],
  ['earning tasks extension', 'alter table public.earning_tasks'],
  ['rewards extension', 'alter table public.rewards'],
  ['points ledger extension', 'alter table public.points_ledger'],
  ['idempotency for ledger entries', 'points_ledger(user_id, idempotency_key)'],
  ['redemption records extension', 'alter table public.redemptions add column if not exists idempotency_key'],
  ['RLS enabled for profiles', 'alter table public.profiles enable row level security'],
  ['RLS enabled for points ledger', 'alter table public.points_ledger enable row level security'],
  ['own-user ledger policy', 'using ((select auth.uid()) = user_id)'],
  ['no client points-award policy', 'Client roles receive no policies'],
  ['server-side flow warning', 'Client roles receive no policies to'],
];
for (const [name, expected] of schemaChecks) {
  assert.ok(schema.toLowerCase().includes(expected.toLowerCase()), 'Missing schema safeguard: ' + name);
  console.log('PASS:', name);
}
assert.equal((schema.match(/enable row level security/gi) || []).length, 6, 'RLS must be enabled on all six tables');
console.log('PASS: RLS enabled on all six application tables');
console.log('PASS: schema checks complete');
