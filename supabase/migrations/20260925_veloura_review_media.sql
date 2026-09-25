-- Veloura V13 verified-review media
-- Creates one Veloura-prefixed public-read bucket with authenticated owner writes.

select hub.assert_app_scope('veloura','veloura');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'veloura-review-media',
  'veloura-review-media',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public=excluded.public,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists veloura_review_media_select on storage.objects;
drop policy if exists veloura_review_media_insert_own on storage.objects;
drop policy if exists veloura_review_media_update_own on storage.objects;
drop policy if exists veloura_review_media_delete_own on storage.objects;

create policy veloura_review_media_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id='veloura-review-media');

create policy veloura_review_media_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id='veloura-review-media'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

create policy veloura_review_media_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id='veloura-review-media'
    and owner_id=(select auth.uid())::text
  )
  with check (
    bucket_id='veloura-review-media'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

create policy veloura_review_media_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id='veloura-review-media'
    and owner_id=(select auth.uid())::text
  );
