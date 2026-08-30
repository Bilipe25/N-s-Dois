-- Celebrando o Amor e o Novo Lar
-- Additive, idempotent schema and legacy reconciliation. No legacy object is removed.

create extension if not exists pgcrypto;

alter table public.app_config
  add column if not exists celebration_title text default 'Celebrando o Amor e o Novo Lar',
  add column if not exists celebration_subtitle text,
  add column if not exists celebration_story text,
  add column if not exists celebration_post_event_message text,
  add column if not exists celebration_hero_url text,
  add column if not exists celebration_og_url text,
  add column if not exists celebration_hero_focal_x smallint default 50,
  add column if not exists celebration_hero_focal_y smallint default 50,
  add column if not exists celebration_rsvp_enabled boolean not null default false,
  add column if not exists celebration_gifts_enabled boolean not null default false,
  add column if not exists celebration_reservations_enabled boolean not null default false,
  add column if not exists celebration_pix_enabled boolean not null default false,
  add column if not exists pix_recipient_name text,
  add column if not exists pix_city text;

alter table public.app_config drop constraint if exists app_config_celebration_hero_focal_x_check;
alter table public.app_config add constraint app_config_celebration_hero_focal_x_check
  check (celebration_hero_focal_x between 0 and 100) not valid;
alter table public.app_config validate constraint app_config_celebration_hero_focal_x_check;
alter table public.app_config drop constraint if exists app_config_celebration_hero_focal_y_check;
alter table public.app_config add constraint app_config_celebration_hero_focal_y_check
  check (celebration_hero_focal_y between 0 and 100) not valid;
alter table public.app_config validate constraint app_config_celebration_hero_focal_y_check;

alter table public.bridal_shower_gifts
  add column if not exists price_cents integer;

alter table public.bridal_shower_gifts drop constraint if exists bridal_shower_gifts_price_cents_check;
alter table public.bridal_shower_gifts add constraint bridal_shower_gifts_price_cents_check
  check (price_cents is null or price_cents > 0) not valid;
alter table public.bridal_shower_gifts validate constraint bridal_shower_gifts_price_cents_check;

create table if not exists public.celebration_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'celebration' check (kind in ('ceremony', 'reception', 'gathering', 'celebration')),
  title text not null,
  starts_at timestamptz,
  venue_name text,
  address text,
  map_url text,
  dress_code text,
  schedule_note text,
  sort_order integer not null default 0,
  state text not null default 'draft' check (state in ('draft', 'published', 'archived')),
  source_legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  event_id uuid not null references public.celebration_events(id) on delete cascade,
  adult_limit integer not null default 1 check (adult_limit >= 0),
  child_limit integer not null default 0 check (child_limit >= 0),
  confirmed_adults integer not null default 0 check (confirmed_adults >= 0),
  confirmed_children integer not null default 0 check (confirmed_children >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'recusado')),
  private_message text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id, event_id),
  check (confirmed_adults <= adult_limit),
  check (confirmed_children <= child_limit),
  check (char_length(coalesce(private_message, '')) <= 1000)
);

create table if not exists public.guest_invite_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  token_hash char(64) not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  check (token_hash ~ '^[0-9a-f]{64}$')
);

create unique index if not exists guest_invite_tokens_one_active_per_guest
  on public.guest_invite_tokens (guest_id)
  where revoked_at is null;

create table if not exists public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.bridal_shower_gifts(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  reserved_by_name_snapshot text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz,
  legacy_source boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists gift_reservations_one_active_per_gift
  on public.gift_reservations (gift_id)
  where status = 'active';

create index if not exists gift_reservations_guest_id_idx
  on public.gift_reservations (guest_id);

create table if not exists public.security_rate_limits (
  rate_key char(64) primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rate_key ~ '^[0-9a-f]{64}$'),
  check (request_count >= 0)
);

create or replace function public.consume_rate_limit(
  p_key char(64),
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.security_rate_limits as limits (rate_key, request_count, window_started_at, updated_at)
  values (p_key, 1, now(), now())
  on conflict (rate_key) do update
  set request_count = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else limits.request_count + 1
      end,
      window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else limits.window_started_at
      end,
      updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(char(64), integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(char(64), integer, integer) to service_role;

-- Preserve the previous wedding record as a draft. A future event must be explicitly published.
insert into public.celebration_events (
  kind, title, starts_at, venue_name, address, state, source_legacy_key
)
select
  'ceremony',
  'Celebração',
  config.wedding_date,
  null,
  config.wedding_address,
  'draft',
  'legacy-wedding'
from public.app_config config
where config.wedding_date is not null
on conflict (source_legacy_key) do nothing;

-- Keep a draft home-celebration event even when the legacy location/date is incomplete.
insert into public.celebration_events (
  kind, title, starts_at, venue_name, address, map_url, state, source_legacy_key
)
select
  'gathering',
  'Celebração do novo lar',
  config.bridal_shower_date,
  config.bridal_shower_location,
  config.bridal_shower_address_1,
  config.bridal_shower_map_link_1,
  'draft',
  'legacy-new-home-1'
from public.app_config config
where exists (select 1 from public.bridal_shower_guests)
   or config.bridal_shower_date is not null
on conflict (source_legacy_key) do nothing;

insert into public.celebration_events (
  kind, title, starts_at, venue_name, address, map_url, state, source_legacy_key, sort_order
)
select
  'gathering',
  coalesce(nullif(config.bridal_shower_location_2, ''), 'Segundo encontro'),
  config.bridal_shower_date_2,
  config.bridal_shower_location_2,
  config.bridal_shower_address_2,
  config.bridal_shower_map_link_2,
  'draft',
  'legacy-new-home-2',
  1
from public.app_config config
where config.bridal_shower_date_2 is not null
   or nullif(config.bridal_shower_location_2, '') is not null
on conflict (source_legacy_key) do nothing;

-- Preserve the existing groups and admit the explicit reconciliation bucket.
alter table public.guests
  drop constraint if exists guests_group_name_check;

alter table public.guests
  add constraint guests_group_name_check check (
    group_name = any (array[
      'Família Noivo'::text,
      'Família Noiva'::text,
      'Amigos Noivo'::text,
      'Amigos Noiva'::text,
      'Igreja'::text,
      'Trabalho'::text,
      'Outros'::text,
      'Legado — Chá de Casa Nova'::text
    ])
  );

-- Insert only legacy guests that do not have a unique normalized name match.
insert into public.guests (name, group_name, adults_count, children_count, rsvp_status)
select
  legacy.name,
  'Legado — Chá de Casa Nova',
  1,
  0,
  case when legacy.confirmed then 'confirmado' else 'pendente' end
from public.bridal_shower_guests legacy
where not exists (
  select 1
  from public.guests current_guest
  where lower(trim(regexp_replace(current_guest.name, '\\s+', ' ', 'g')))
      = lower(trim(regexp_replace(legacy.name, '\\s+', ' ', 'g')))
)
and not exists (
  select 1
  from public.bridal_shower_guests duplicate
  where duplicate.id <> legacy.id
    and lower(trim(regexp_replace(duplicate.name, '\\s+', ' ', 'g')))
      = lower(trim(regexp_replace(legacy.name, '\\s+', ' ', 'g')))
)
on conflict do nothing;

-- Main guest list maps to the legacy wedding event when it exists.
insert into public.guest_event_rsvps (
  guest_id, event_id, adult_limit, child_limit, confirmed_adults, confirmed_children, status, responded_at
)
select
  guest.id,
  event.id,
  greatest(coalesce(guest.adults_count, 1), 0),
  greatest(coalesce(guest.children_count, 0), 0),
  case when guest.rsvp_status = 'confirmado' then greatest(coalesce(guest.adults_count, 1), 0) else 0 end,
  case when guest.rsvp_status = 'confirmado' then greatest(coalesce(guest.children_count, 0), 0) else 0 end,
  coalesce(guest.rsvp_status, 'pendente'),
  case when guest.rsvp_status in ('confirmado', 'recusado') then now() else null end
from public.guests guest
join public.celebration_events event on event.source_legacy_key = 'legacy-wedding'
where guest.group_name <> 'Legado — Chá de Casa Nova'
on conflict (guest_id, event_id) do nothing;

-- Correct an interrupted earlier rollout that associated legacy-only guests
-- with the wedding event before the reconciliation bucket was excluded.
delete from public.guest_event_rsvps rsvp
using public.guests guest, public.celebration_events event
where rsvp.guest_id = guest.id
  and rsvp.event_id = event.id
  and guest.group_name = 'Legado — Chá de Casa Nova'
  and event.source_legacy_key = 'legacy-wedding';

-- Legacy home responses use the field written by the current application: confirmed.
insert into public.guest_event_rsvps (
  guest_id, event_id, adult_limit, child_limit, confirmed_adults, confirmed_children, status, responded_at
)
select
  current_guest.id,
  event.id,
  greatest(coalesce(current_guest.adults_count, 1), 0),
  greatest(coalesce(current_guest.children_count, 0), 0),
  case when legacy.confirmed then greatest(coalesce(current_guest.adults_count, 1), 0) else 0 end,
  case when legacy.confirmed then greatest(coalesce(current_guest.children_count, 0), 0) else 0 end,
  case when legacy.confirmed then 'confirmado' else 'pendente' end,
  case when legacy.confirmed then now() else null end
from public.bridal_shower_guests legacy
join public.guests current_guest
  on lower(trim(regexp_replace(current_guest.name, '\\s+', ' ', 'g')))
   = lower(trim(regexp_replace(legacy.name, '\\s+', ' ', 'g')))
join public.celebration_events event on event.source_legacy_key = 'legacy-new-home-1'
where 1 = (
  select count(*)
  from public.guests candidate
  where lower(trim(regexp_replace(candidate.name, '\\s+', ' ', 'g')))
      = lower(trim(regexp_replace(legacy.name, '\\s+', ' ', 'g')))
)
on conflict (guest_id, event_id) do nothing;

-- Preserve reservation truth and inconsistent metadata without exposing the name publicly.
insert into public.gift_reservations (
  gift_id, guest_id, reserved_by_name_snapshot, status, reserved_at, cancelled_at, legacy_source
)
select
  gift.id,
  matched_guest.id,
  nullif(trim(gift.reserved_by), ''),
  case when gift.status = 'comprado' then 'active' else 'cancelled' end,
  coalesce(gift.reserved_at, now()),
  case when gift.status = 'comprado' then null else coalesce(gift.reserved_at, now()) end,
  true
from public.bridal_shower_gifts gift
left join lateral (
  select candidate.id
  from public.guests candidate
  where nullif(trim(gift.reserved_by), '') is not null
    and lower(trim(regexp_replace(candidate.name, '\\s+', ' ', 'g')))
      = lower(trim(regexp_replace(gift.reserved_by, '\\s+', ' ', 'g')))
    and 1 = (
      select count(*)
      from public.guests all_candidates
      where lower(trim(regexp_replace(all_candidates.name, '\\s+', ' ', 'g')))
        = lower(trim(regexp_replace(gift.reserved_by, '\\s+', ' ', 'g')))
    )
  limit 1
) matched_guest on true
where gift.status = 'comprado' or nullif(trim(gift.reserved_by), '') is not null
on conflict do nothing;
