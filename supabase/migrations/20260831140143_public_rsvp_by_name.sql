-- RSVP by exact normalized name and clearly marked public submissions.
-- Additive only: token invitations remain available as a fallback.

create or replace function public.normalize_guest_name(p_name text)
returns text
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select lower(
    regexp_replace(
      trim(
        translate(
          lower(p_name),
          'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
          'aaaaaaeeeeiiiiooooouuuucnyy'
        )
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  )
$$;

alter table public.guests
  add column if not exists source text not null default 'admin',
  add column if not exists review_status text not null default 'approved',
  add column if not exists rsvp_adults integer,
  add column if not exists rsvp_children integer,
  add column if not exists rsvp_message text,
  add column if not exists rsvp_responded_at timestamptz,
  add column if not exists name_search_key text generated always as (public.normalize_guest_name(name)) stored;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_source_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_source_check
      check (source in ('admin', 'public_rsvp'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_review_status_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_review_status_check
      check (review_status in ('pending', 'approved'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_rsvp_adults_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_rsvp_adults_check
      check (rsvp_adults is null or rsvp_adults between 0 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_rsvp_children_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_rsvp_children_check
      check (rsvp_children is null or rsvp_children between 0 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_rsvp_message_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_rsvp_message_check
      check (char_length(coalesce(rsvp_message, '')) <= 1000);
  end if;
end $$;

create index if not exists guests_name_search_key_idx
  on public.guests (name_search_key);

create unique index if not exists guests_pending_public_rsvp_name_key_idx
  on public.guests (name_search_key)
  where source = 'public_rsvp' and review_status = 'pending';

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
begin
  if char_length(normalized_name) < 3 or char_length(p_name) > 120 then
    raise exception 'invalid guest name' using errcode = '22023';
  end if;
  if p_status not in ('confirmado', 'recusado') then
    raise exception 'invalid RSVP status' using errcode = '22023';
  end if;
  if p_adults not between 0 and 6 or p_children not between 0 and 6 then
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
    6,
    6,
    case when p_status = 'recusado' then 0 else p_adults end,
    case when p_status = 'recusado' then 0 else p_children end,
    p_status,
    nullif(p_message, ''),
    now(),
    now()
  from public.celebration_events event
  where event.state = 'published'
  on conflict (guest_id, event_id) do nothing;

  insert into public.notifications (type, title, message, link)
  values (
    'public_rsvp',
    'Nova confirmação pelo site',
    'Uma pessoa que não estava previamente cadastrada enviou uma resposta.',
    '/guests'
  );

  return new_guest_id;
end;
$$;

revoke all on function public.normalize_guest_name(text) from public, anon, authenticated;
grant execute on function public.normalize_guest_name(text) to service_role;
revoke all on function public.create_public_rsvp_guest(text, text, integer, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_public_rsvp_guest(text, text, integer, integer, text, text) to service_role;
