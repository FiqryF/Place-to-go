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

create policy "Authenticated admins can insert places"
on public.places for insert
to authenticated
with check (true);

create policy "Authenticated admins can update places"
on public.places for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete places"
on public.places for delete
to authenticated
using (true);
```

For Storage, allow public reads and authenticated uploads to the `place-images` bucket.

## Pages

- `index.html`: public home, search, filters, cards, statistics
- `details.html`: public detail page, admin controls when logged in
- `login.html`: Supabase Auth login
- `admin.html`: admin dashboard after login
- `add.html`: admin add/edit form with image upload
