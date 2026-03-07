create table if not exists public.user_actions (
  user_id uuid not null references auth.users (id) on delete cascade,
  action_id text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, action_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_actions_updated_at on public.user_actions;
create trigger set_user_actions_updated_at
before update on public.user_actions
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_actions enable row level security;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
on public.user_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile"
on public.user_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own actions" on public.user_actions;
create policy "Users can view their own actions"
on public.user_actions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own actions" on public.user_actions;
create policy "Users can insert their own actions"
on public.user_actions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own actions" on public.user_actions;
create policy "Users can update their own actions"
on public.user_actions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age text,
  province text,
  employed boolean not null default false,
  student boolean not null default false,
  renter boolean not null default false,
  has_car boolean not null default false,
  has_debt boolean not null default false,
  lives_with_parents boolean not null default false,
  files_taxes boolean not null default false,
  no_employer_benefits boolean not null default false,
  is_post_secondary boolean not null default false,
  is_newcomer boolean not null default false,
  is_indigenous boolean not null default false,
  has_emergency_savings boolean not null default false,
  has_dependent boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);