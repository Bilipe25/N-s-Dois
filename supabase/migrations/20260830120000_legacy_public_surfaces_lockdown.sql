-- The restored public experience does not reactivate these legacy surfaces.
-- Keep their historical data private even when the tables still exist remotely.

do $$
declare
  table_name text;
begin
  foreach table_name in array array['message_wall', 'pix_confirmations'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
    end if;
  end loop;
end
$$;
