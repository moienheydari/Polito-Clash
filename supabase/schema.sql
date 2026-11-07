create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
  filename text not null, storage_path text not null, page_count int not null, extracted_pages jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id),
  document_id uuid not null references public.documents(id), title text not null, join_code text not null unique,
  phase text not null default 'waiting' check (phase in ('waiting','preparing','answering','grading','review','reporting','finished','error')),
  question_count int not null check (question_count in (3,5,10)), current_question_index int not null default 0,
  question_started_at timestamptz, question_deadline_at timestamptz, review_ends_at timestamptz,
  grading_claimed_at timestamptz, reporting_claimed_at timestamptz, created_at timestamptz not null default now(), finished_at timestamptz
);
create table if not exists public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  total_score int not null default 0, joined_at timestamptz not null default now(), primary key (match_id, user_id)
);
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade,
  position int not null, question_text text not null, topic text not null, difficulty text not null,
  ideal_answer text not null, grading_criteria jsonb not null, source_pages jsonb not null, created_at timestamptz not null default now(),
  unique(match_id, position)
);
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade, user_id uuid not null references auth.users(id),
  answer_text text not null default '', submitted_at timestamptz not null default now(), score int,
  evaluation_json jsonb, evaluated_at timestamptz, unique(question_id, user_id)
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id), report_json jsonb not null, created_at timestamptz not null default now(),
  unique(match_id, user_id)
);
create index if not exists matches_code_idx on public.matches(join_code);
create index if not exists players_user_idx on public.match_players(user_id);
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.reports enable row level security;
drop policy if exists profile_self on public.profiles;
create policy profile_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists match_member_read on public.matches;
create policy match_member_read on public.matches for select using (host_id = auth.uid() or exists (select 1 from public.match_players p where p.match_id = id and p.user_id = auth.uid()));
drop policy if exists player_member_read on public.match_players;
create policy player_member_read on public.match_players for select using (exists (select 1 from public.match_players p where p.match_id = match_id and p.user_id = auth.uid()));
drop policy if exists report_self on public.reports;
create policy report_self on public.reports for select using (user_id = auth.uid());
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_players;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.questions;

create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))); return new; end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile();
