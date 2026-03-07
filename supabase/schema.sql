create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age integer,
  province text,
  employed boolean default false,
  student boolean default false,
  renter boolean default false,
  has_car boolean default false,
  has_debt boolean default false,
  lives_with_parents boolean default false,
  files_taxes boolean default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_income numeric,
  monthly_expenses numeric,
  savings_goal numeric,
  budget_limit numeric,
  credit_score integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_threads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  assistant_id text,
  thread_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_financial_data_updated_at on public.financial_data;
create trigger set_financial_data_updated_at
before update on public.financial_data
for each row
execute function public.set_updated_at();

drop trigger if exists set_ai_threads_updated_at on public.ai_threads;
create trigger set_ai_threads_updated_at
before update on public.ai_threads
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.financial_data enable row level security;
alter table public.ai_threads enable row level security;

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

drop policy if exists "Users can view their own financial data" on public.financial_data;
create policy "Users can view their own financial data"
on public.financial_data
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own financial data" on public.financial_data;
create policy "Users can insert their own financial data"
on public.financial_data
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own financial data" on public.financial_data;
create policy "Users can update their own financial data"
on public.financial_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own ai threads" on public.ai_threads;
create policy "Users can view their own ai threads"
on public.ai_threads
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own ai threads" on public.ai_threads;
create policy "Users can insert their own ai threads"
on public.ai_threads
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ai threads" on public.ai_threads;
create policy "Users can update their own ai threads"
on public.ai_threads
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);