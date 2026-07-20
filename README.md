# Place To Go

Mobile-first travel wishlist app for Fiqry & Isyana. It is hosted on GitHub Pages and uses Supabase for database, auth, and image storage.

## Setup

Edit `js/config.js`:

```js
supabaseUrl: "https://your-project.supabase.co",
supabaseAnonKey: "your-anon-key",
supabaseStorageBucket: "place-images"
```

Create a public Supabase Storage bucket named `place-images`.

## Database

Run `supabase/schema.sql` in the Supabase SQL Editor, or create the `places` table manually:

```sql
create table public.places (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Suggested RLS:

```sql
alter table public.places enable row level security;

create policy "Anyone can read places"
on public.places for select
using (true);

create policy "Authenticated users can insert places"
on public.places for insert
to authenticated
with check (true);

create policy "Authenticated users can update places"
on public.places for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete places"
on public.places for delete
to authenticated
using (true);
```

For Storage, allow public reads and authenticated uploads to the `place-images` bucket.

## Pages

- `index.html`: welcome screen before login
- `home.html`: logged-in user home with wishlist/search/filter cards
- `details.html`: logged-in detail page with visited date and Fiqry/Isyana ratings
- `login.html`: Supabase Auth login
- `manage.html`: logged-in create/edit/delete page
- `add.html`: logged-in add/edit form with image upload
- Logged-in users can mark wishlist places as visited through a restricted Supabase RPC.
