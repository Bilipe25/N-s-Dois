create or replace function public.rotate_guest_invite_token(
  p_guest_id uuid,
  p_token_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_token_id uuid;
  rotated_at timestamptz := now();
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid invite token hash' using errcode = '22023';
  end if;

  select id
  into previous_token_id
  from public.guest_invite_tokens
  where guest_id = p_guest_id
    and revoked_at is null
  for update;

  if previous_token_id is null then
    raise exception 'active invite token not found' using errcode = 'P0002';
  end if;

  update public.guest_invite_tokens
  set revoked_at = rotated_at
  where id = previous_token_id;

  insert into public.guest_invite_tokens (guest_id, token_hash, created_at)
  values (p_guest_id, p_token_hash, rotated_at);

  return true;
end;
$$;

revoke all on function public.rotate_guest_invite_token(uuid, text) from public, anon, authenticated;
grant execute on function public.rotate_guest_invite_token(uuid, text) to service_role;
