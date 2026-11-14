-- Monty backend schema (Supabase / Postgres).
-- Not provisioned yet — this is the target schema for when a Supabase
-- project exists. Run in the SQL editor of a new project, or via
-- `supabase db push` once the CLI is linked to one.
--
-- Mirrors src/storage/types.ts. The client-side repositories in
-- src/storage/ currently read/write AsyncStorage with the same shapes;
-- swapping their internals to hit these tables is the migration path.

create extension if not exists "pgcrypto";

-- One row per user, keyed to Supabase auth.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('strength', 'hypertrophy', 'fat_loss', 'general_fitness')),
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  equipment text not null check (equipment in ('bodyweight_only', 'dumbbells', 'full_gym')),
  session_duration_minutes int not null,
  frequency_per_week int not null,
  coaching_style text not null check (coaching_style in ('silent', 'minimal', 'coach', 'hype')),
  language text not null default 'en' check (language in ('en', 'hinglish')),
  approved_plan_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Fixed exercise library — seeded, not user-editable in v0-v2.
create table if not exists exercises (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('bodyweight', 'dumbbell')),
  default_sets int not null,
  default_reps int not null,
  default_rest_seconds int not null,
  target_weight numeric,
  weight_unit text check (weight_unit in ('kg', 'lb'))
);

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_name text not null,
  date date not null default current_date,
  completed boolean not null default false,
  mood text check (mood in ('great', 'ok', 'rough')),
  fatigue text check (fatigue in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table if not exists session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id text not null references exercises(id),
  set_number int not null,
  weight numeric,
  weight_unit text check (weight_unit in ('kg', 'lb')),
  reps int not null,
  target_reps int not null,
  failure boolean not null default false
);

-- Full check-in transcripts, kept separate from the classified signal
-- stored on workout_sessions for quick reads.
create table if not exists mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references workout_sessions(id) on delete set null,
  transcript jsonb not null,
  mood text not null check (mood in ('great', 'ok', 'rough')),
  fatigue text not null check (fatigue in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz not null default now()
);

-- Explicit approvals for generated daily plans — gates full autonomy
-- (see PLAN_AUTONOMY_THRESHOLD in src/planning/dailyPlanGenerator.ts).
create table if not exists plan_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  approved boolean not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table workout_sessions enable row level security;
alter table session_sets enable row level security;
alter table mood_checkins enable row level security;
alter table plan_approvals enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own sessions" on workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own session sets" on session_sets
  for all using (
    auth.uid() = (select user_id from workout_sessions where id = session_id)
  );

create policy "own mood checkins" on mood_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own plan approvals" on plan_approvals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- exercises is a shared read-only reference table.
alter table exercises enable row level security;
create policy "exercises readable by all" on exercises for select using (true);
