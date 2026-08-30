begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

set local role anon;
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

reset role;
set local role authenticated;
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

select * from finish();
rollback;
