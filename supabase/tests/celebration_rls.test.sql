begin;

create extension if not exists pgtap with schema extensions;
select plan(40);

select ok(
  (select public from storage.buckets where id = 'celebration-media'),
  'celebration media is publicly readable for crawlers'
);
select is(
  (select file_size_limit from storage.buckets where id = 'celebration-media'),
  5242880::bigint,
  'celebration media enforces a five megabyte final file limit'
);

set local role anon;
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('celebration-media', 'hero/anonymous.webp')$$,
  '42501',
  null,
  'anon cannot upload celebration media'
);
select throws_ok('select * from public.guests', '42501', null, 'anon cannot read guests');
select throws_ok('select * from public.app_config', '42501', null, 'anon cannot read config');
select throws_ok('select * from public.bridal_shower_guests', '42501', null, 'anon cannot read legacy guests');
select throws_ok('select * from public.bridal_shower_gifts', '42501', null, 'anon cannot read gifts directly');
select throws_ok('select * from public.notifications', '42501', null, 'anon cannot read notifications');
select throws_ok('select * from public.push_subscriptions', '42501', null, 'anon cannot read push subscriptions');
select throws_ok('select * from public.celebration_events', '42501', null, 'anon cannot read events directly');
select throws_ok('select * from public.guest_event_rsvps', '42501', null, 'anon cannot read RSVP rows');
select throws_ok('select * from public.guest_invite_tokens', '42501', null, 'anon cannot read invite tokens');
select throws_ok('select * from public.gift_reservations', '42501', null, 'anon cannot read reservation owners');
select throws_ok('select * from public.security_rate_limits', '42501', null, 'anon cannot read rate limits');
select throws_ok('select * from public.message_wall', '42501', null, 'anon cannot read legacy public messages');
select throws_ok('select * from public.pix_confirmations', '42501', null, 'anon cannot read legacy PIX confirmations');
select ok(not has_function_privilege('anon', 'public.rotate_guest_invite_token(uuid,text)', 'execute'), 'anon cannot rotate invite tokens');
select ok(not has_function_privilege('anon', 'public.create_public_rsvp_guest(text,text,integer,integer,text,text)', 'execute'), 'anon cannot create public RSVP guests directly');

reset role;
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('celebration-media', 'hero/authenticated.webp')$$,
  '42501',
  null,
  'authenticated cannot upload celebration media directly'
);
select throws_ok('select * from public.guests', '42501', null, 'authenticated cannot read guests without app authorization');
select throws_ok('select * from public.app_config', '42501', null, 'authenticated cannot read config directly');
select throws_ok('select * from public.bridal_shower_guests', '42501', null, 'authenticated cannot read legacy guests');
select throws_ok('select * from public.bridal_shower_gifts', '42501', null, 'authenticated cannot read gifts directly');
select throws_ok('select * from public.notifications', '42501', null, 'authenticated cannot read notifications');
select throws_ok('select * from public.push_subscriptions', '42501', null, 'authenticated cannot read push subscriptions');
select throws_ok('select * from public.celebration_events', '42501', null, 'authenticated cannot read events directly');
select throws_ok('select * from public.guest_event_rsvps', '42501', null, 'authenticated cannot read RSVP rows');
select throws_ok('select * from public.guest_invite_tokens', '42501', null, 'authenticated cannot read invite tokens');
select throws_ok('select * from public.gift_reservations', '42501', null, 'authenticated cannot read reservations');
select throws_ok('select * from public.security_rate_limits', '42501', null, 'authenticated cannot read rate limits');
select throws_ok('select * from public.message_wall', '42501', null, 'authenticated cannot read legacy public messages');
select throws_ok('select * from public.pix_confirmations', '42501', null, 'authenticated cannot read legacy PIX confirmations');
select ok(not has_function_privilege('authenticated', 'public.rotate_guest_invite_token(uuid,text)', 'execute'), 'authenticated cannot rotate invite tokens');
select ok(not has_function_privilege('authenticated', 'public.create_public_rsvp_guest(text,text,integer,integer,text,text)', 'execute'), 'authenticated cannot create public RSVP guests directly');

reset role;
select ok(has_function_privilege('service_role', 'public.rotate_guest_invite_token(uuid,text)', 'execute'), 'service role can rotate invite tokens');
select ok(has_function_privilege('service_role', 'public.create_public_rsvp_guest(text,text,integer,integer,text,text)', 'execute'), 'service role can create public RSVP guests');

insert into public.guests (id, name, group_name, adults_count, children_count, rsvp_status)
values ('00000000-0000-4000-8000-000000000001', 'Convite de teste', 'Outros', 1, 0, 'pendente');
insert into public.guest_invite_tokens (guest_id, token_hash)
values ('00000000-0000-4000-8000-000000000001', repeat('0', 64));

set local role service_role;
select lives_ok(
  $$select public.rotate_guest_invite_token('00000000-0000-4000-8000-000000000001'::uuid, repeat('1', 64))$$,
  'service role rotates an active invite atomically'
);
select is(
  (select count(*) from public.guest_invite_tokens where guest_id = '00000000-0000-4000-8000-000000000001' and revoked_at is null),
  1::bigint,
  'rotation leaves exactly one active invite'
);
select isnt(
  (select token_hash::text from public.guest_invite_tokens where guest_id = '00000000-0000-4000-8000-000000000001' and revoked_at is null),
  repeat('0', 64),
  'the previous link hash is no longer active'
);
select ok(
  (select revoked_at is not null from public.guest_invite_tokens where guest_id = '00000000-0000-4000-8000-000000000001' and token_hash = repeat('0', 64)),
  'rotation preserves the previous token as revoked history'
);

reset role;
select * from finish();
rollback;
