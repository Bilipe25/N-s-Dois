-- Keep public RSVP creation atomic, but move human-readable notifications to
-- the server service so the database event and push share one unique identity.
create or replace function public.create_public_rsvp_guest(
  p_name text,
  p_status text,
  p_adults integer,
  p_children integer,
  p_message text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  normalized_name text := public.normalize_guest_name(p_name);
  new_guest_id uuid;
  configured_adult_limit integer := 6;
  configured_child_limit integer := 6;
begin
  select
    coalesce(config.celebration_public_rsvp_adult_limit, 6),
    coalesce(config.celebration_public_rsvp_child_limit, 6)
  into configured_adult_limit, configured_child_limit
  from public.app_config config
  limit 1;

  if char_length(normalized_name) < 3 or char_length(p_name) > 120 then
    raise exception 'invalid guest name' using errcode = '22023';
  end if;
  if p_status not in ('confirmado', 'recusado') then
    raise exception 'invalid RSVP status' using errcode = '22023';
  end if;
  if p_adults not between 0 and configured_adult_limit
     or p_children not between 0 and configured_child_limit then
    raise exception 'invalid public RSVP party size' using errcode = '22023';
  end if;
  if p_status = 'confirmado' and p_adults < 1 then
    raise exception 'an attending party needs one adult' using errcode = '22023';
  end if;
  if char_length(coalesce(p_message, '')) > 1000 then
    raise exception 'message too long' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_name, 0));

  if exists (
    select 1 from public.guests where name_search_key = normalized_name
  ) then
    raise exception 'guest name already exists' using errcode = '23505';
  end if;

  insert into public.guests (
    name,
    group_name,
    rsvp_status,
    adults_count,
    children_count,
    contact_phone,
    source,
    review_status,
    rsvp_adults,
    rsvp_children,
    rsvp_message,
    rsvp_responded_at
  ) values (
    trim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g')),
    'Outros',
    p_status,
    case when p_status = 'recusado' then 0 else p_adults end,
    case when p_status = 'recusado' then 0 else p_children end,
    nullif(p_phone, ''),
    'public_rsvp',
    'pending',
    case when p_status = 'recusado' then 0 else p_adults end,
    case when p_status = 'recusado' then 0 else p_children end,
    nullif(p_message, ''),
    now()
  ) returning id into new_guest_id;

  insert into public.guest_event_rsvps (
    guest_id,
    event_id,
    adult_limit,
    child_limit,
    confirmed_adults,
    confirmed_children,
    status,
    private_message,
    responded_at,
    updated_at
  )
  select
    new_guest_id,
    event.id,
    configured_adult_limit,
    configured_child_limit,
    case when p_status = 'recusado' then 0 else p_adults end,
    case when p_status = 'recusado' then 0 else p_children end,
    p_status,
    nullif(p_message, ''),
    now(),
    now()
  from public.celebration_events event
  where event.state = 'published'
  on conflict (guest_id, event_id) do nothing;

  return new_guest_id;
end;
$$;

revoke all on function public.create_public_rsvp_guest(text, text, integer, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.create_public_rsvp_guest(text, text, integer, integer, text, text)
  to service_role;
