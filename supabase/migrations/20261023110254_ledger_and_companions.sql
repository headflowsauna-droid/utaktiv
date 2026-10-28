-- Kjøpte poeng skrives bare av service role (Stripe-webhook).
-- Opptjente poeng går gjennom credit_earned, med tak per hendelse og per Oslo-døgn.
-- Turfølge viser grove bånd. Navn kommer bare fra companion_names etter gjensidig ja.

drop policy if exists "ledger_insert_own" on public.wallet_ledger;
drop policy if exists "ledger_update_own" on public.wallet_ledger;
drop policy if exists "ledger_delete_own" on public.wallet_ledger;

revoke insert, update, delete on public.wallet_ledger from authenticated;
revoke insert, update, delete on public.wallet_ledger from anon;
revoke insert, update, delete on public.wallet_ledger from public;

create table if not exists public.point_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pot text not null check (pot in ('purchased', 'earned')),
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('stripe_topup', 'daylight', 'checkin', 'chore', 'spend')),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists point_entries_user_created_idx
  on public.point_entries (user_id, created_at desc);

alter table public.point_entries enable row level security;

revoke all on public.point_entries from public;
revoke all on public.point_entries from anon;
revoke all on public.point_entries from authenticated;
grant select on public.point_entries to authenticated;

drop policy if exists "point_entries_select_own" on public.point_entries;
create policy "point_entries_select_own"
  on public.point_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.credit_earned(
  p_reason text,
  p_points integer,
  p_key text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  event_cap integer;
  day_start timestamptz;
  used_today integer;
  requested integer;
  room integer;
  granted integer;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_reason not in ('daylight', 'checkin', 'chore') then
    raise exception 'earned_reason_only';
  end if;
  if p_key is null or char_length(p_key) < 8 or char_length(p_key) > 200 then
    raise exception 'invalid_key';
  end if;

  perform pg_advisory_xact_lock(42021, hashtext(uid::text));

  event_cap := case p_reason
    when 'daylight' then 40
    when 'checkin' then 50
    when 'chore' then 80
    else 0
  end;

  day_start := date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo';

  select coalesce(sum(delta), 0)
    into used_today
  from public.point_entries
  where user_id = uid
    and pot = 'earned'
    and delta > 0
    and created_at >= day_start;

  requested := least(event_cap, greatest(0, coalesce(p_points, 0)));
  room := greatest(0, 300 - used_today);
  requested := least(requested, room);
  if requested <= 0 then
    return 0;
  end if;

  insert into public.point_entries (user_id, pot, delta, reason, idempotency_key)
  values (uid, 'earned', requested, p_reason, p_key)
  on conflict (user_id, idempotency_key) do nothing
  returning delta into granted;

  return coalesce(granted, 0);
end;
$$;

create or replace function public.spend_purchased(
  p_points integer,
  p_key text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  amount integer;
  balance integer;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  amount := coalesce(p_points, 0);
  if amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  if p_key is null or char_length(p_key) < 8 or char_length(p_key) > 200 then
    raise exception 'invalid_key';
  end if;

  perform pg_advisory_xact_lock(42021, hashtext(uid::text));

  if exists (
    select 1 from public.point_entries
    where user_id = uid and idempotency_key = p_key
  ) then
    select coalesce(sum(delta), 0) into balance
    from public.point_entries
    where user_id = uid and pot = 'purchased';
    return balance;
  end if;

  select coalesce(sum(delta), 0) into balance
  from public.point_entries
  where user_id = uid and pot = 'purchased';

  if balance < amount then
    raise exception 'insufficient_purchased';
  end if;

  insert into public.point_entries (user_id, pot, delta, reason, idempotency_key)
  values (uid, 'purchased', -amount, 'spend', p_key);

  return balance - amount;
end;
$$;

revoke all on function public.credit_earned(text, integer, text) from public;
revoke all on function public.credit_earned(text, integer, text) from anon;
grant execute on function public.credit_earned(text, integer, text) to authenticated;

revoke all on function public.spend_purchased(integer, text) from public;
revoke all on function public.spend_purchased(integer, text) from anon;
grant execute on function public.spend_purchased(integer, text) to authenticated;

create table if not exists public.match_cards (
  user_id uuid primary key references auth.users (id) on delete cascade,
  city text not null default '',
  adult_band text not null default 'uoppgitt'
    check (adult_band in ('18-29', '30-44', '45-59', '60+', 'uoppgitt')),
  child_bands text[] not null default '{}'
    check (child_bands <@ array['0-3', '4-6', '7-12', '13-17']::text[]),
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.companion_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  city text not null check (char_length(city) between 1 and 80),
  activity_id text not null default '',
  activity_title text not null default '',
  starts_at timestamptz not null,
  party_label text not null
    check (party_label in ('voksne', 'voksne-med-smaabarn', 'voksne-med-skolebarn')),
  adult_band text not null
    check (adult_band in ('18-29', '30-44', '45-59', '60+', 'uoppgitt')),
  child_bands text[] not null default '{}'
    check (child_bands <@ array['0-3', '4-6', '7-12', '13-17']::text[]),
  tags text[] not null default '{}',
  note text not null default '' check (char_length(note) <= 280),
  status text not null default 'open' check (status in ('open', 'closed')),
  kind text not null default 'plan' check (kind in ('plan', 'trail')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists companion_posts_open_city_idx
  on public.companion_posts (city, starts_at)
  where status = 'open';

create table if not exists public.companion_interests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.companion_posts (id) on delete cascade,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (post_id, from_user_id)
);

alter table public.match_cards enable row level security;
alter table public.companion_posts enable row level security;
alter table public.companion_interests enable row level security;

revoke all on public.match_cards from public, anon, authenticated;
revoke all on public.companion_posts from public, anon, authenticated;
revoke all on public.companion_interests from public, anon, authenticated;

grant select, insert, update on public.match_cards to authenticated;
grant select, insert, update on public.companion_posts to authenticated;
grant select, insert, update on public.companion_interests to authenticated;

drop policy if exists "match_cards_select" on public.match_cards;
create policy "match_cards_select"
  on public.match_cards
  for select
  to authenticated
  using (true);

drop policy if exists "match_cards_insert_own" on public.match_cards;
create policy "match_cards_insert_own"
  on public.match_cards
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "match_cards_update_own" on public.match_cards;
create policy "match_cards_update_own"
  on public.match_cards
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "posts_select_open_or_own" on public.companion_posts;
create policy "posts_select_open_or_own"
  on public.companion_posts
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      status = 'open'
      and (kind <> 'trail' or (expires_at is not null and expires_at > now()))
    )
  );

drop policy if exists "posts_insert_own" on public.companion_posts;
create policy "posts_insert_own"
  on public.companion_posts
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'open'
    and (kind <> 'trail' or (expires_at is not null and expires_at > now()))
  );

drop policy if exists "posts_update_own" on public.companion_posts;
create policy "posts_update_own"
  on public.companion_posts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "interest_select_participant" on public.companion_interests;
create policy "interest_select_participant"
  on public.companion_interests
  for select
  to authenticated
  using (
    from_user_id = (select auth.uid())
    or exists (
      select 1 from public.companion_posts p
      where p.id = post_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "interest_insert_pending" on public.companion_interests;
create policy "interest_insert_pending"
  on public.companion_interests
  for insert
  to authenticated
  with check (
    from_user_id = (select auth.uid())
    and status = 'pending'
    and messages = '[]'::jsonb
    and exists (
      select 1 from public.companion_posts p
      where p.id = post_id
        and p.status = 'open'
        and p.user_id <> (select auth.uid())
        and (p.kind <> 'trail' or (p.expires_at is not null and p.expires_at > now()))
    )
  );

drop policy if exists "interest_owner_update" on public.companion_interests;
create policy "interest_owner_update"
  on public.companion_interests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.companion_posts p
      where p.id = post_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.companion_posts p
      where p.id = post_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "interest_requester_message" on public.companion_interests;
create policy "interest_requester_message"
  on public.companion_interests
  for update
  to authenticated
  using (from_user_id = (select auth.uid()) and status = 'accepted')
  with check (from_user_id = (select auth.uid()) and status = 'accepted');

create or replace function public.guard_companion_interest()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.from_user_id is distinct from old.from_user_id
     or new.post_id is distinct from old.post_id then
    raise exception 'cannot_reassign';
  end if;

  if jsonb_typeof(new.messages) <> 'array' or jsonb_array_length(new.messages) > 40 then
    raise exception 'too_many_messages';
  end if;

  select user_id into owner from public.companion_posts where id = old.post_id;

  if new.status is distinct from old.status and auth.uid() is distinct from owner then
    raise exception 'only_owner_sets_status';
  end if;

  if new.messages is distinct from old.messages and old.status <> 'accepted' then
    raise exception 'messages_after_accept';
  end if;

  return new;
end;
$$;

drop trigger if exists companion_interests_guard on public.companion_interests;
create trigger companion_interests_guard
  before update on public.companion_interests
  for each row
  execute function public.guard_companion_interest();

revoke all on function public.guard_companion_interest() from public;
revoke all on function public.guard_companion_interest() from anon;
grant execute on function public.guard_companion_interest() to authenticated;

create or replace function public.companion_names(p_post_id uuid)
returns table (user_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner uuid;
begin
  if uid is null or p_post_id is null then
    return;
  end if;

  select cp.user_id into owner
  from public.companion_posts cp
  where cp.id = p_post_id;

  if owner is null then
    return;
  end if;

  if uid = owner then
    return query
      select ci.from_user_id, coalesce(p.display_name, '')
      from public.companion_interests ci
      left join public.profiles p on p.id = ci.from_user_id
      where ci.post_id = p_post_id
        and ci.status = 'accepted';
    return;
  end if;

  if exists (
    select 1
    from public.companion_interests ci
    where ci.post_id = p_post_id
      and ci.from_user_id = uid
      and ci.status = 'accepted'
  ) then
    return query
      select owner, coalesce(p.display_name, '')
      from public.profiles p
      where p.id = owner;
  end if;
end;
$$;

revoke all on function public.companion_names(uuid) from public;
revoke all on function public.companion_names(uuid) from anon;
grant execute on function public.companion_names(uuid) to authenticated;
