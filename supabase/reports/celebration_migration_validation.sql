-- Aggregate-only validation after the additive backfill. No PII is returned.
select 'celebration_events' as metric, count(*)::bigint as value from public.celebration_events
union all select 'guest_event_rsvps', count(*) from public.guest_event_rsvps
union all select 'active_invite_tokens', count(*) from public.guest_invite_tokens where revoked_at is null
union all select 'active_gift_reservations', count(*) from public.gift_reservations where status = 'active'
union all select 'cancelled_legacy_reservations', count(*) from public.gift_reservations where status = 'cancelled' and legacy_source;

select
  count(*) filter (where state = 'published') as automatically_published,
  count(*) filter (where state = 'draft') as draft_events
from public.celebration_events
where source_legacy_key is not null;

select
  count(*) as gifts_with_multiple_active_reservations
from (
  select gift_id from public.gift_reservations where status = 'active' group by gift_id having count(*) > 1
) conflicts;
