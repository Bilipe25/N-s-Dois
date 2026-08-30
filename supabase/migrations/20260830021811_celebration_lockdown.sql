-- Run only after the server-only data layer is deployed and verified.
-- Grants and RLS are separate defenses; both are set explicitly.

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_config',
    'guests',
    'bridal_shower_guests',
    'bridal_shower_gifts',
    'notifications',
    'push_subscriptions',
    'celebration_events',
    'guest_event_rsvps',
    'guest_invite_tokens',
    'gift_reservations',
    'security_rate_limits'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
    end if;
  end loop;
end
$$;

grant execute on function public.consume_rate_limit(char(64), integer, integer) to service_role;
revoke all on function public.consume_rate_limit(char(64), integer, integer) from public, anon, authenticated;
