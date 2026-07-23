-- Margin — initial schema.
-- Access model: the browser only ever talks to Supabase for auth. All data
-- access goes through Next.js API routes / server components. RLS is enabled
-- everywhere as defense in depth: users can read their own rows; every write
-- that affects ratings, quotas, or plans is service-role only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
-- No insert/update/delete policies: plan changes are service-role only.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- essays & drafts
-- ---------------------------------------------------------------------------
create table public.essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  essay_type text not null default 'Common App personal statement',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index essays_user_idx on public.essays (user_id, updated_at desc);

alter table public.essays enable row level security;
create policy "essays_select_own" on public.essays
  for select using (auth.uid() = user_id);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays (id) on delete cascade,
  version int not null,
  content text not null check (char_length(content) between 1 and 40000),
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (essay_id, version)
);
create index drafts_essay_idx on public.drafts (essay_id, version desc);

alter table public.drafts enable row level security;
create policy "drafts_select_own" on public.drafts
  for select using (
    exists (
      select 1 from public.essays e
      where e.id = drafts.essay_id and e.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- corpus (service-role only; contents are never exposed to clients)
-- ---------------------------------------------------------------------------
create table public.corpus_essays (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null check (source in ('anchor', 'seed', 'user')),
  locked boolean not null default false,
  elo real not null,
  match_count int not null default 0,
  prose_score real,
  label text,
  owner_draft_id uuid unique references public.drafts (id) on delete set null,
  created_at timestamptz not null default now()
);
create index corpus_elo_idx on public.corpus_essays (elo);

alter table public.corpus_essays enable row level security;
-- No policies: service-role access only.

-- ---------------------------------------------------------------------------
-- evaluations & matches
-- ---------------------------------------------------------------------------
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays (id) on delete cascade,
  draft_id uuid not null references public.drafts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'full' check (kind in ('full', 'quick')),
  budget int not null check (budget between 1 and 40),
  matches_done int not null default 0,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  phase text not null default 'placement'
    check (phase in ('placement', 'match', 'prose', 'synthesis', 'done')),
  elo real,
  start_elo real,
  ci real,
  placement_tier int,
  prose_score real,
  prose_tag text check (prose_tag in ('carrying', 'substance_ahead', 'aligned')),
  structure_score real,
  direction_flag text,
  intransitivity real not null default 0,
  result jsonb,
  error text,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index evaluations_essay_idx on public.evaluations (essay_id, created_at desc);
create index evaluations_user_month_idx on public.evaluations (user_id, kind, created_at);

alter table public.evaluations enable row level security;
create policy "evaluations_select_own" on public.evaluations
  for select using (auth.uid() = user_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  corpus_essay_id uuid not null references public.corpus_essays (id),
  round int not null,
  winner text not null check (winner in ('user', 'opponent', 'split')),
  margin text not null check (margin in ('decisive', 'clear', 'narrow')),
  weight real not null default 1,
  off_axis boolean not null default false,
  harvest jsonb,
  elo_before real not null,
  elo_after real not null,
  opp_elo real not null,
  created_at timestamptz not null default now()
);
create index matches_eval_idx on public.matches (evaluation_id, round);

alter table public.matches enable row level security;
-- No policies: match rows (which reference corpus essays) are service-role only.

-- ---------------------------------------------------------------------------
-- Atomic step lock: claim an evaluation for one tournament step.
-- ---------------------------------------------------------------------------
create or replace function public.claim_evaluation(p_eval_id uuid, p_lock_seconds int)
returns setof public.evaluations
language sql
security definer set search_path = public
as $$
  update public.evaluations
  set lock_until = now() + make_interval(secs => p_lock_seconds)
  where id = p_eval_id
    and (lock_until is null or lock_until < now())
  returning *;
$$;

revoke all on function public.claim_evaluation(uuid, int) from public, anon, authenticated;
