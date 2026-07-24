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
  visited_at date,
  fiqry_rating integer check (fiqry_rating between 1 and 5),
  isyana_rating integer check (isyana_rating between 1 and 5),
  fiqry_note text,
  isyana_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.places
add column if not exists visited_at date;

alter table public.places
add column if not exists fiqry_rating integer check (fiqry_rating between 1 and 5);

alter table public.places
add column if not exists isyana_rating integer check (isyana_rating between 1 and 5);

alter table public.places
add column if not exists fiqry_note text;

alter table public.places
add column if not exists isyana_note text;

alter table public.places enable row level security;

drop policy if exists "Anyone can read places" on public.places;
drop policy if exists "Authenticated admins can insert places" on public.places;
drop policy if exists "Authenticated admins can update places" on public.places;
drop policy if exists "Authenticated admins can delete places" on public.places;
drop policy if exists "Authenticated users can insert places" on public.places;
drop policy if exists "Authenticated users can update places" on public.places;
drop policy if exists "Authenticated users can delete places" on public.places;

create policy "Anyone can read places"
on public.places
for select
using (true);

create policy "Authenticated users can insert places"
on public.places
for insert
to authenticated
with check (true);

create policy "Authenticated users can update places"
on public.places
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete places"
on public.places
for delete
to authenticated
using (true);

drop function if exists public.mark_place_visited(uuid);
drop function if exists public.mark_place_visited(uuid, date, integer, integer);
drop function if exists public.mark_place_visited(uuid, date, integer, integer, text, text);
drop function if exists public.save_place_review(uuid, date, text, integer, text);

create or replace function public.mark_place_visited(
  place_id uuid,
  visited_date date,
  bf_score integer,
  gf_score integer,
  bf_note text default '',
  gf_note text default ''
)
returns public.places
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_place public.places;
begin
  if visited_date is null then
    raise exception 'Visited date is required';
  end if;

  if bf_score is null or bf_score < 1 or bf_score > 5 then
    raise exception 'Fiqry rating must be between 1 and 5';
  end if;

  if gf_score is null or gf_score < 1 or gf_score > 5 then
    raise exception 'Isyana rating must be between 1 and 5';
  end if;

  update public.places
  set
    status = 'visited',
    visited_at = visited_date,
    fiqry_rating = bf_score,
    isyana_rating = gf_score,
    fiqry_note = nullif(trim(bf_note), ''),
    isyana_note = nullif(trim(gf_note), ''),
    updated_at = now()
  where id = place_id
  returning * into updated_place;

  if updated_place.id is null then
    select * into updated_place
    from public.places
    where id = place_id;
  end if;

  return updated_place;
end;
$$;

revoke all on function public.mark_place_visited(uuid, date, integer, integer, text, text) from public;
grant execute on function public.mark_place_visited(uuid, date, integer, integer, text, text) to authenticated;

create or replace function public.save_place_review(
  place_id uuid,
  visited_date date,
  reviewer_name text,
  reviewer_score integer,
  reviewer_note text default ''
)
returns public.places
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_place public.places;
begin
  if visited_date is null then
    raise exception 'Visited date is required';
  end if;

  if reviewer_name not in ('fiqry', 'isyana') then
    raise exception 'Reviewer must be fiqry or isyana';
  end if;

  if reviewer_score is null or reviewer_score < 1 or reviewer_score > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  update public.places
  set
    status = 'visited',
    visited_at = coalesce(public.places.visited_at, visited_date),
    fiqry_rating = case when reviewer_name = 'fiqry' then reviewer_score else fiqry_rating end,
    isyana_rating = case when reviewer_name = 'isyana' then reviewer_score else isyana_rating end,
    fiqry_note = case when reviewer_name = 'fiqry' then nullif(trim(reviewer_note), '') else fiqry_note end,
    isyana_note = case when reviewer_name = 'isyana' then nullif(trim(reviewer_note), '') else isyana_note end,
    updated_at = now()
  where id = place_id
  returning * into updated_place;

  return updated_place;
end;
$$;

revoke all on function public.save_place_review(uuid, date, text, integer, text) from public;
grant execute on function public.save_place_review(uuid, date, text, integer, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('place-images', 'place-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Anyone can read place images" on storage.objects;
drop policy if exists "Authenticated admins can upload place images" on storage.objects;
drop policy if exists "Authenticated admins can update place images" on storage.objects;
drop policy if exists "Authenticated admins can delete place images" on storage.objects;
drop policy if exists "Authenticated users can upload place images" on storage.objects;
drop policy if exists "Authenticated users can update place images" on storage.objects;
drop policy if exists "Authenticated users can delete place images" on storage.objects;

create policy "Anyone can read place images"
on storage.objects
for select
using (bucket_id = 'place-images');

create policy "Authenticated users can upload place images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'place-images');

create policy "Authenticated users can update place images"
on storage.objects
for update
to authenticated
using (bucket_id = 'place-images')
with check (bucket_id = 'place-images');

create policy "Authenticated users can delete place images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'place-images');
