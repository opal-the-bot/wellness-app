create extension if not exists pgcrypto;

create table if not exists wellness_preferences (
  user_id text primary key,
  dashboard_metrics jsonb not null default '[]'::jsonb,
  calorie_mode text not null default 'daily',
  goals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wellness_preferences_calorie_mode_check
    check (calorie_mode in ('daily', 'weekly'))
);

create table if not exists wellness_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  created_at timestamptz not null default now(),
  entry_type text not null,
  title text not null,
  detail text not null,
  metric_impact jsonb not null default '{}'::jsonb,
  source text not null default 'server',
  constraint wellness_entries_type_check
    check (entry_type in ('meal', 'symptom', 'workout', 'supplement', 'note')),
  constraint wellness_entries_source_check
    check (source in ('local', 'server'))
);

create index if not exists wellness_entries_user_created_at_idx
  on wellness_entries (user_id, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists wellness_preferences_set_updated_at on wellness_preferences;
create trigger wellness_preferences_set_updated_at
before update on wellness_preferences
for each row execute function set_updated_at();

alter table wellness_preferences enable row level security;
alter table wellness_entries enable row level security;

-- Replace these permissive starter policies before production auth goes live.
drop policy if exists "service role can manage wellness_preferences" on wellness_preferences;
create policy "service role can manage wellness_preferences"
  on wellness_preferences
  for all
  using (true)
  with check (true);

drop policy if exists "service role can manage wellness_entries" on wellness_entries;
create policy "service role can manage wellness_entries"
  on wellness_entries
  for all
  using (true)
  with check (true);
