-- Delte turer og sky-synkronisering for Utaktiv Tur-kurv
create table if not exists public.shared_trips (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  city text not null default 'Bergen',
  friend_name text,
  kurv jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_trips enable row level security;

grant select on public.shared_trips to anon, authenticated;
grant insert, update, delete on public.shared_trips to authenticated;

drop policy if exists "shared_trips_select_all" on public.shared_trips;
create policy "shared_trips_select_all" on public.shared_trips
  for select to anon, authenticated
  using (true);

drop policy if exists "shared_trips_write_own" on public.shared_trips;
create policy "shared_trips_write_own" on public.shared_trips
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
