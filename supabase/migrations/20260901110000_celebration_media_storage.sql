-- Public delivery for celebration imagery; all writes stay server-authorized through signed upload tokens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'celebration-media',
  'celebration-media',
  true,
  5242880,
  array['image/webp', 'image/jpeg']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No INSERT, UPDATE or DELETE policy is created for anon/authenticated.
-- The server service role creates short-lived, one-object signed upload tokens.
