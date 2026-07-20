create extension if not exists pgcrypto;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  category text not null,
  description text not null,
  maps_url text not null,
  image_url text,
  status text not null default 'wishlist' check (status in ('wishlist', 'visited')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.places enable row level security;

drop policy if exists "Anyone can read places" on public.places;
drop policy if exists "Authenticated admins can insert places" on public.places;
drop policy if exists "Authenticated admins can update places" on public.places;
drop policy if exists "Authenticated admins can delete places" on public.places;

create policy "Anyone can read places"
on public.places
for select
using (true);

create policy "Authenticated admins can insert places"
on public.places
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update places"
on public.places
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete places"
on public.places
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('place-images', 'place-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Anyone can read place images" on storage.objects;
drop policy if exists "Authenticated admins can upload place images" on storage.objects;
drop policy if exists "Authenticated admins can update place images" on storage.objects;
drop policy if exists "Authenticated admins can delete place images" on storage.objects;

create policy "Anyone can read place images"
on storage.objects
for select
using (bucket_id = 'place-images');

create policy "Authenticated admins can upload place images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'place-images');

create policy "Authenticated admins can update place images"
on storage.objects
for update
to authenticated
using (bucket_id = 'place-images')
with check (bucket_id = 'place-images');

create policy "Authenticated admins can delete place images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'place-images');
