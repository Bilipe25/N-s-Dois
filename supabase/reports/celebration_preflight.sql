-- Aggregate-only preflight. Run before the additive migration and save outside the repository.
select 'guests' as metric, count(*)::bigint as value from public.guests
union all select 'legacy_guests', count(*) from public.bridal_shower_guests
union all select 'gifts', count(*) from public.bridal_shower_gifts
union all select 'legacy_reserved_status', count(*) from public.bridal_shower_gifts where status = 'comprado'
union all select 'legacy_reservation_metadata', count(*) from public.bridal_shower_gifts where nullif(trim(reserved_by), '') is not null;

select
  count(*) filter (where confirmed is distinct from is_confirmed) as confirmation_divergences
from public.bridal_shower_guests;

select
  count(*) as unique_normalized_matches
from public.bridal_shower_guests legacy
where 1 = (
  select count(*) from public.guests candidate
  where lower(trim(regexp_replace(candidate.name, '\s+', ' ', 'g')))
      = lower(trim(regexp_replace(legacy.name, '\s+', ' ', 'g')))
);
