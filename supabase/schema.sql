-- Profiles table
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can update profiles"
  on public.profiles for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can delete profiles"
  on public.profiles for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- PDF table
create table if not exists public.study_pdfs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  description text,
  file_path text not null,
  file_name text not null,
  file_size bigint not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_pdfs enable row level security;

create policy "Anyone can read study_pdfs"
  on public.study_pdfs for select
  using (true);

create policy "Admins can insert study_pdfs"
  on public.study_pdfs for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can update study_pdfs"
  on public.study_pdfs for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can delete study_pdfs"
  on public.study_pdfs for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Auto update timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists study_pdfs_updated_at on public.study_pdfs;
create trigger study_pdfs_updated_at
before update on public.study_pdfs
for each row execute function public.handle_updated_at();

-- Optional: trigger to auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
