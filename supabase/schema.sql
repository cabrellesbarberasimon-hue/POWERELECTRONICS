-- SENSE · Supabase schema (proposal for production).
-- Mirrors src/types/domain.ts and the mock database in src/data/seed.ts.
-- Auth: Supabase Auth (email / SSO with the corporate IdP). `profiles.id` = auth.users.id.
-- Storage buckets: `post-media` (photos/videos of community content),
--                  `voice-notes` (team notifications), `course-assets` (3D models, PDFs, SCORM).

create type role as enum ('employee', 'sat', 'instructor', 'admin');
create type level as enum ('basic', 'advanced');
create type content_type as enum ('text', '3d', 'video', 'document', 'test');
create type reaction_kind as enum ('like', 'wow', 'idea');
create type challenge_period as enum ('monthly', 'quarterly', 'annual');
create type severity as enum ('urgent', 'preventive', 'info');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  name text not null,
  role role not null default 'employee',
  department text not null,
  country_code char(2) not null,
  avatar_color text not null default '#1E88C4',
  joined_at date not null default current_date
);

-- Corporate University ------------------------------------------------------
create table courses (
  id text primary key,
  code text not null,
  area text not null,
  level level not null,
  title jsonb not null,          -- { "en": "...", "es": "..." }
  description jsonb not null,
  path text[] not null,          -- {COURSES,SOLAR,HEM}
  equipment_id text,
  tags text[] not null default '{}',
  source text not null default 'corporate' -- corporate | moodle
);

create table course_sections (
  id text primary key,
  course_id text not null references courses on delete cascade,
  position int not null,
  title jsonb not null
);

create table course_steps (
  id text primary key,
  section_id text not null references course_sections on delete cascade,
  position int not null,
  type content_type not null,
  title jsonb not null,
  body jsonb not null,
  duration_min int not null default 5,
  tags text[] not null default '{}',
  part_id text,
  quiz jsonb,                    -- [{ question, options[], answer }]
  asset_path text                -- storage path in course-assets
);

create table step_progress (
  user_id uuid references profiles on delete cascade,
  step_id text references course_steps on delete cascade,
  outcome text not null check (outcome in ('completed', 'failed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, step_id, outcome)
);

-- Social / community ---------------------------------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  body text not null default '',
  media jsonb not null,          -- { kind, tint, durationSec, avatarId, path }
  tags text[] not null default '{}',
  course_id text references courses,
  section_id text references course_sections,
  challenge_id uuid,
  shares int not null default 0
);

create table reactions (
  post_id uuid references posts on delete cascade,
  user_id uuid references profiles on delete cascade,
  kind reaction_kind not null,
  primary key (post_id, user_id, kind)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Private monthly star ratings (one per post and month).
create table ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  author_id uuid not null references profiles,
  evaluator_id uuid not null references profiles,
  stars smallint not null check (stars between 1 and 5),
  month char(7) not null,        -- YYYY-MM
  note text,
  unique (post_id, month)
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  period challenge_period not null,
  title jsonb not null,
  description jsonb not null,
  points int not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  goal jsonb not null,           -- { type, target, tag?, partId? }
  created_by text not null check (created_by in ('admin', 'ai'))
);

create table challenge_participants (
  challenge_id uuid references challenges on delete cascade,
  user_id uuid references profiles on delete cascade,
  completed_at timestamptz,
  primary key (challenge_id, user_id)
);

-- Training Experience 4.0 ----------------------------------------------------
create table equipment (
  id text primary key,
  name text not null,
  family text not null,
  kind text not null,
  site text not null,
  description jsonb not null,
  ar_marker_path text            -- image target / anchor for real AR
);

create table equipment_parts (
  id text primary key,
  equipment_id text not null references equipment on delete cascade,
  name jsonb not null,
  x real not null, y real not null,  -- hotspot position (prototype); 3D anchor in production
  dot text not null,
  parameters jsonb not null,     -- [{ value, label }] — live values come from telemetry
  tags text[] not null default '{}'
);

create table procedures (
  id text primary key,
  equipment_id text not null references equipment on delete cascade,
  title jsonb not null,
  steps jsonb not null           -- [{ id, partId, instruction }]
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  equipment_id text not null references equipment,
  part_id text not null references equipment_parts,
  severity severity not null check (severity <> 'info'),
  title jsonb not null,
  trigger jsonb not null,
  description jsonb not null,
  parameters jsonb not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles
);

create table technical_history (
  id uuid primary key default gen_random_uuid(),
  equipment_id text not null references equipment,
  part_id text not null references equipment_parts,
  technician_id uuid not null references profiles,
  date timestamptz not null default now(),
  severity severity not null,
  description jsonb not null,
  parameters jsonb not null default '[]',
  first_time_fix boolean not null default true
);

create table team_notifications (
  id uuid primary key default gen_random_uuid(),
  equipment_id text not null references equipment,
  author_id uuid not null references profiles,
  kind text not null check (kind in ('note', 'voice', 'video')),
  topic text not null check (topic in ('technical', 'maintenance', 'safety')),
  text text not null,
  media_path text,               -- storage path in voice-notes / post-media
  duration_sec int,
  created_at timestamptz not null default now()
);

create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  equipment_id text not null references equipment,
  procedure_id text references procedures,
  mode text not null check (mode in ('step', 'free')),
  completed_step_ids text[] not null default '{}',
  inspected_part_ids text[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Administration -------------------------------------------------------------
create table license_tiers (
  id text primary key check (id in ('small', 'medium', 'large')),
  min_employees int not null,
  max_employees int,
  monthly_eur int not null
);

create table company_license (
  company text primary key,
  employees int not null,
  tier_id text not null references license_tiers,
  since date not null,
  renews_at date not null
);

-- Row level security (sketch) --------------------------------------------------
alter table ratings enable row level security;
create policy "ratings are private" on ratings for select using (
  author_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('instructor', 'admin'))
);
create policy "only evaluators rate" on ratings for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('instructor', 'admin'))
);

alter table posts enable row level security;
create policy "everyone reads posts" on posts for select using (auth.role() = 'authenticated');
create policy "authors write their posts" on posts for insert with check (author_id = auth.uid());

-- Contribution ranking, equivalent to src/modules/social/scoring.ts (weights: post 10,
-- like/wow 1, idea 2, comment 1, star 5, lesson 2, AR training 15, + challenge points).
create view contribution as
select p.id as user_id,
  coalesce((select count(*) from posts x where x.author_id = p.id), 0) * 10
  + coalesce((select sum(case r.kind when 'idea' then 2 else 1 end) from reactions r join posts x on x.id = r.post_id
              where x.author_id = p.id and r.user_id <> p.id), 0)
  + coalesce((select count(*) from comments c join posts x on x.id = c.post_id where c.author_id = p.id and x.author_id <> p.id), 0)
  + coalesce((select sum(stars) from ratings r where r.author_id = p.id), 0) * 5
  + coalesce((select count(*) from step_progress s where s.user_id = p.id and s.outcome = 'completed'), 0) * 2
  + coalesce((select count(*) from training_sessions t where t.user_id = p.id and t.finished_at is not null), 0) * 15
  + coalesce((select sum(c.points) from challenge_participants cp join challenges c on c.id = cp.challenge_id
              where cp.user_id = p.id and cp.completed_at is not null), 0) as points
from profiles p;
