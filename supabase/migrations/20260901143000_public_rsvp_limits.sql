-- Limites configuráveis para cadastros espontâneos, mantendo 6/6 como compatibilidade.
alter table public.app_config
  add column if not exists celebration_public_rsvp_adult_limit smallint,
  add column if not exists celebration_public_rsvp_child_limit smallint;

update public.app_config
set
  celebration_public_rsvp_adult_limit = coalesce(celebration_public_rsvp_adult_limit, 6),
  celebration_public_rsvp_child_limit = coalesce(celebration_public_rsvp_child_limit, 6)
where celebration_public_rsvp_adult_limit is null
   or celebration_public_rsvp_child_limit is null;

alter table public.app_config
  alter column celebration_public_rsvp_adult_limit set default 6,
  alter column celebration_public_rsvp_adult_limit set not null,
  alter column celebration_public_rsvp_child_limit set default 6,
  alter column celebration_public_rsvp_child_limit set not null;

alter table public.app_config drop constraint if exists app_config_public_rsvp_adult_limit_check;
alter table public.app_config add constraint app_config_public_rsvp_adult_limit_check
  check (celebration_public_rsvp_adult_limit between 0 and 20) not valid;
alter table public.app_config validate constraint app_config_public_rsvp_adult_limit_check;

alter table public.app_config drop constraint if exists app_config_public_rsvp_child_limit_check;
alter table public.app_config add constraint app_config_public_rsvp_child_limit_check
  check (celebration_public_rsvp_child_limit between 0 and 20) not valid;
alter table public.app_config validate constraint app_config_public_rsvp_child_limit_check;
