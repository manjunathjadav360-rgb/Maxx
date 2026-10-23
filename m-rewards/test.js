const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('m-rewards/index.html', 'utf8');
const schema = fs.readFileSync('m-rewards/supabase/migrations/202610230001_perkly_core_schema.sql', 'utf8');
const authSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230002_auth_profile_trigger.sql', 'utf8');
const transactionSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230003_perkly_secure_earning_redemption.sql', 'utf8');
const concurrencySchema = fs.readFileSync('m-rewards/supabase/migrations/202610230004_perkly_serialize_redemptions.sql', 'utf8');
const catalogSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230005_perkly_seed_original_catalog.sql', 'utf8');
const balanceSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230006_perkly_account_balance_rpc.sql', 'utf8');
const adminPolicySchema = fs.readFileSync('m-rewards/supabase/migrations/202610230007_perkly_admin_task_review_read_policy.sql', 'utf8');
const adminPolicyPerformanceSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230008_perkly_admin_policy_performance.sql', 'utf8');
const partnerSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230009_perkly_partner_collaboration_intake.sql', 'utf8');
const partnerThrottleSchema = fs.readFileSync('m-rewards/supabase/migrations/202610230010_perkly_partner_request_throttle_hardening.sql', 'utf8');
const checks = [
  ['document title', '<title>Perkly — Simple rewards, every day</title>'],
  ['account sign-in control', 'id="accountButton"'],
  ['account-backed points panel', 'id="accountBalance"'],
  ['account activity refresh control', 'id="refreshAccount"'],
  ['account activity status', 'id="accountStatus"'],
  ['admin review panel hidden by default', 'id="adminReviewPanel" hidden'],
  ['admin role claim gate', "currentUser.app_metadata?.role==='admin'"],
  ['admin review uses server RPC', "authClient.rpc('review_task_completion'"],
  ['admin review queue loads pending submissions', "item.status==='pending'"],
  ['task submission control', "data-account-task=\"'+t.id+'\""],
  ['server-backed task submission RPC', "authClient.rpc('submit_task_completion'"],
  ['account points balance RPC', "authClient.rpc('get_my_points_balance'"],
  ['separate demo and account points', 'Account points and demo points are separate.'],
  ['account form', 'id="authForm"'],
  ['Google sign-in control', 'id="googleSignIn"'],
  ['Google OAuth provider request', "provider:'google'"],
  ['Supabase publishable key only', 'sb_publishable_'],
  ['demo points separated from account', 'Demo points and rewards remain separate'],
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
  ['company partnership page', 'id="page-partners"'],
  ['company partnership form', 'id="partnerRequestForm"'],
  ['secure collaboration RPC', "authClient.rpc('submit_partner_request'"],
  ['admin collaboration queue', 'id="adminPartnerPanel"'],
  ['admin collaboration status RPC', "authClient.rpc('review_partner_request'"],
  ['partnership is not guaranteed disclaimer', 'does not create a contract or confirm a partnership'],
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
const ids=['accountButton','authMessage','authClose','authModeToggle','authSignOut','authSubmit','authForm','authBackdrop','authTitle','displayNameLabel','authEmail','authPassword','authDisplayName','balance','earnBalance','rewardBalance','historyBalance','completedCount','homeTasks','allTasks','recentActivity','historyList','catalog','toast','modalTitle','modalText','modalBackdrop','cancelModal','confirmModal','pageTitle'];
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
  ['task completion foreign-key index', 'task_completions_task_id_idx'],
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
const authChecks = [
  ['new user profile trigger', 'create trigger on_auth_user_created'],
  ['fixed trigger search path', "set search_path = ''"],
  ['profile name length limited', 'left(trim(coalesce(new.raw_user_meta_data ->> \'display_name\', \'\')), 60)'],
  ['trigger function not executable by client roles', 'revoke all on function public.handle_new_user() from public, anon, authenticated'],
];
for (const [name, expected] of authChecks) {
  assert.ok(authSchema.toLowerCase().includes(expected.toLowerCase()), 'Missing auth safeguard: ' + name);
  console.log('PASS:', name);
}


const transactionChecks = [
  ['task submissions require authentication', "if v_user_id is null then raise exception 'Sign in is required'"],
  ['only active tasks can be submitted', 't.id = p_task_id and t.active = true'],
  ['task credits require admin review', "auth.jwt() -> 'app_metadata' ->> 'role'"],
  ['task approval locks completion row', 'for update'],
  ['task award has an idempotent ledger key', "'task-completion:' || v_completion.id::text"],
  ['redemption locks reward inventory', 'where id = p_reward_id and active = true for update'],
  ['redemption checks ledger balance', 'sum(l.amount)'],
  ['redemption debits ledger transactionally', "'redemption_debit'"],
  ['client cannot run admin review', 'from public, anon, authenticated'],
  ['only authenticated users can submit and redeem', 'to authenticated'],
];
for (const [name, expected] of transactionChecks) {
  assert.ok(transactionSchema.toLowerCase().includes(expected.toLowerCase()), 'Missing transaction safeguard: ' + name);
  console.log('PASS:', name);
}
console.log('PASS: secure earning/redemption migration checks complete');

assert.ok(concurrencySchema.includes('pg_advisory_xact_lock'), 'Per-user redemption requests must serialize to prevent concurrent overspending');
console.log('PASS: per-user advisory lock prevents concurrent redemption overspending');
for (const taskId of ['welcome','profile','learn','daily','feedback','community']) assert.ok(catalogSchema.includes("('"+taskId+"'"), 'Seed catalog must include task '+taskId);
for (const rewardId of ['coffee','voucher','headphones','donate','book','movie']) assert.ok(catalogSchema.includes("('"+rewardId+"'"), 'Seed catalog must include reward '+rewardId);
assert.ok(balanceSchema.includes('auth.uid()'), 'Account balance must require an authenticated user');
assert.ok(balanceSchema.includes('sum(l.amount)'), 'Account balance must sum the ledger');
assert.ok(balanceSchema.includes('to authenticated'), 'Only authenticated users should execute the balance RPC');
console.log('PASS: original task and reward catalog seed checks complete');
console.log('PASS: account balance RPC authorization and ledger checks complete');
assert.ok(adminPolicySchema.includes("auth.jwt() -> 'app_metadata' ->> 'role'"), 'Admin task review read policy must check trusted app_metadata role');
assert.ok(adminPolicySchema.includes("= 'admin'"), 'Admin task review policy must restrict access to admins');
console.log('PASS: admin task-review read policy checks the trusted admin claim');

assert.ok(adminPolicyPerformanceSchema.includes('(select auth.jwt())'), 'Admin RLS policy should wrap auth.jwt() in a scalar subquery for performance');
assert.ok(adminPolicyPerformanceSchema.includes("= 'admin'"), 'Optimized admin RLS policy must still require the trusted admin claim');
console.log('PASS: optimized admin task-review RLS policy checks complete');

assert.ok(partnerSchema.includes('create table if not exists public.partner_requests'), 'Partner requests need a dedicated table');
assert.ok(partnerSchema.includes('enable row level security'), 'Partner requests table must enable RLS');
assert.ok(partnerSchema.includes('revoke all on public.partner_requests from public, anon, authenticated'), 'Direct public table access must be revoked');
assert.ok(partnerSchema.includes('function public.submit_partner_request'), 'Partner intake must use a validation RPC');
assert.ok(partnerSchema.includes("interval '15 minutes'"), 'Partner intake should throttle repeated submissions from the same email');
assert.ok(partnerSchema.includes('function public.review_partner_request'), 'Admin request review must use a protected RPC');
assert.ok(partnerSchema.includes("coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin'"), 'Request review must enforce trusted admin role server-side');
console.log('PASS: partner collaboration schema, privacy, throttling and admin authorization checks complete');

assert.ok(partnerThrottleSchema.includes('pg_advisory_xact_lock(hashtextextended(v_email, 0))'), 'Partner email cooldown must serialize concurrent submissions');
assert.ok(partnerThrottleSchema.includes("interval '15 minutes'"), 'Partner email cooldown must reject recent repeat requests');
console.log('PASS: concurrent collaboration-request throttling checks complete');
