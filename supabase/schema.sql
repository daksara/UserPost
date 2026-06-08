-- ─────────────────────────────────────────────
-- UserPost — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────
-- Auto-created when a user signs up via trigger
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  created_at   timestamptz default now()
);

-- ── Posts ─────────────────────────────────────
create table public.posts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) <= 280),
  contract_address text,
  expires_at   timestamptz not null default (now() + interval '24 hours'),
  created_at   timestamptz default now()
);

-- ── Comments ──────────────────────────────────
create table public.comments (
  id           uuid primary key default uuid_generate_v4(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) <= 280),
  created_at   timestamptz default now()
);

-- ── Messages ──────────────────────────────────
create table public.messages (
  id           uuid primary key default uuid_generate_v4(),
  from_id      uuid not null references public.profiles(id) on delete cascade,
  to_id        uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) <= 1000),
  reply_to_id  uuid references public.messages(id) on delete set null,
  read_at      timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Auto-expire posts (pg_cron if available,
-- otherwise handle in app layer)
-- ─────────────────────────────────────────────

-- ── Indexes ───────────────────────────────────
create index on public.posts(expires_at);
create index on public.posts(created_at desc);
create index on public.posts(user_id);
create index on public.comments(post_id);
create index on public.messages(to_id, read_at);
create index on public.messages(from_id, to_id);

-- ── Trigger: create profile on signup ─────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RLS: enable ───────────────────────────────
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.comments  enable row level security;
alter table public.messages  enable row level security;

-- ── RLS: profiles ─────────────────────────────
create policy "Profiles are public"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── RLS: posts ────────────────────────────────
create policy "Posts are public"
  on public.posts for select using (expires_at > now());

create policy "Authenticated users can create posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- ── RLS: comments ─────────────────────────────
create policy "Comments are public"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

-- ── RLS: messages ─────────────────────────────
create policy "Users can see their own messages"
  on public.messages for select
  using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = from_id);

create policy "Users can soft-delete own messages"
  on public.messages for update
  using (auth.uid() = from_id);

create policy "Receivers can mark as read"
  on public.messages for update
  using (auth.uid() = to_id);

-- ── Realtime ──────────────────────────────────
-- Enable realtime for live feed + messages
-- Run in Supabase Dashboard > Database > Replication:
-- Add: posts, comments, messages
