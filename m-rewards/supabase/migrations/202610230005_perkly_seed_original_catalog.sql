-- Seed original Perkly sample tasks and reward concepts with stable IDs for the web client.
-- These are sample activities/reward concepts, not paid offers or fulfilment promises.
insert into public.earning_tasks (id, title, description, points, category, active, slug)
values
 ('welcome','Explore Perkly','Take a quick look around the demo.',50,'engagement',true,'welcome'),
 ('profile','Complete your profile','Preview the profile-completion journey.',100,'engagement',true,'profile'),
 ('learn','Learn something new','Open the learning activity and mark it done.',150,'learning',true,'learn'),
 ('daily','Daily check-in','Try a simple daily engagement activity.',25,'engagement',true,'daily'),
 ('feedback','Share product feedback','Simulate sending feedback about the experience.',75,'feedback',true,'feedback'),
 ('community','Community kindness','Preview a positive community action.',100,'community',true,'community')
on conflict (id) do update set title=excluded.title, description=excluded.description, points=excluded.points, category=excluded.category, active=excluded.active, slug=excluded.slug;

insert into public.rewards (id, title, description, points_cost, reward_type, active, slug, inventory)
values
 ('coffee','Coffee treat','Sample reward concept only; no voucher or product is issued.',500,'sample',true,'coffee',null),
 ('voucher','Shopping voucher','Sample voucher concept only; no voucher is issued.',900,'sample',true,'voucher',null),
 ('headphones','Audio upgrade','Sample tech reward concept only; no product is issued.',1500,'sample',true,'headphones',null),
 ('donate','Plant a tree','Sample impact reward concept only; no donation is made.',700,'sample',true,'donate',null),
 ('book','Book credit','Sample learning reward concept only; no credit is issued.',650,'sample',true,'book',null),
 ('movie','Movie night','Sample entertainment reward concept only; no ticket is issued.',800,'sample',true,'movie',null)
on conflict (id) do update set title=excluded.title, description=excluded.description, points_cost=excluded.points_cost, reward_type=excluded.reward_type, active=excluded.active, slug=excluded.slug, inventory=excluded.inventory;
