-- Sol Uteliv: profiler, venner, spleis, lommebok og Stripe-kreditering.
-- Klienten bruker anon-nøkkelen. Webhooken bruker service role og går utenom RLS.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  city text,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.social_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.saving_goals (
  id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  goal jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.wallet_ledger (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  tx jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.stripe_credits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id text not null,
  points int not null,
  session_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table public.profiles enable row level security;
alter table public.social_state enable row level security;
alter table public.saving_goals enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.stripe_credits enable row level security;
alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.social_state to authenticated;
grant select, insert, update, delete on public.saving_goals to authenticated;
grant select, insert, update, delete on public.wallet_ledger to authenticated;
grant select on public.stripe_credits to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "social_select_own" on public.social_state;
create policy "social_select_own" on public.social_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "social_insert_own" on public.social_state;
create policy "social_insert_own" on public.social_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "social_update_own" on public.social_state;
create policy "social_update_own" on public.social_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "social_delete_own" on public.social_state;
create policy "social_delete_own" on public.social_state
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "goals_select_own" on public.saving_goals;
create policy "goals_select_own" on public.saving_goals
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "goals_insert_own" on public.saving_goals;
create policy "goals_insert_own" on public.saving_goals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "goals_update_own" on public.saving_goals;
create policy "goals_update_own" on public.saving_goals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "goals_delete_own" on public.saving_goals;
create policy "goals_delete_own" on public.saving_goals
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ledger_select_own" on public.wallet_ledger;
create policy "ledger_select_own" on public.wallet_ledger
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ledger_insert_own" on public.wallet_ledger;
create policy "ledger_insert_own" on public.wallet_ledger
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "ledger_update_own" on public.wallet_ledger;
create policy "ledger_update_own" on public.wallet_ledger
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "ledger_delete_own" on public.wallet_ledger;
create policy "ledger_delete_own" on public.wallet_ledger
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "stripe_credits_select_own" on public.stripe_credits;
create policy "stripe_credits_select_own" on public.stripe_credits
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "push_insert_own" on public.push_subscriptions;
create policy "push_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "push_update_own" on public.push_subscriptions;
create policy "push_update_own" on public.push_subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);
