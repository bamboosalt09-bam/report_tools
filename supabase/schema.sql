-- Report Tools prompt community schema.
-- Supabase Dashboard > Authentication > Providers > Email에서
-- "Confirm email"을 켜야 이메일 인증 사용자만 authenticated 세션을 받을 수 있습니다.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 2 and 24),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 80),
  description text not null check (char_length(description) between 10 and 160),
  body text not null check (char_length(body) between 30 and 12000),
  category text not null default 'other',
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'hidden')),
  view_count integer not null default 0 check (view_count >= 0),
  copy_count integer not null default 0 check (copy_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_likes (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, user_id)
);

create table if not exists public.prompt_reports (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 4 and 500),
  created_at timestamptz not null default now()
);

create index if not exists prompts_status_created_at_idx
  on public.prompts(status, created_at desc);

create index if not exists prompts_category_idx
  on public.prompts(category);

create index if not exists prompt_likes_prompt_id_idx
  on public.prompt_likes(prompt_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_prompts_updated_at on public.prompts;
create trigger set_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preferred_username text;
begin
  preferred_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    '사용자'
  );

  insert into public.profiles (id, username)
  values (new.id, left(preferred_username, 24))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.increment_prompt_copy_count(target_prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set copy_count = copy_count + 1
  where id = target_prompt_id
    and status = 'published';
end;
$$;

grant execute on function public.increment_prompt_copy_count(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_likes enable row level security;
alter table public.prompt_reports enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Published prompts are readable" on public.prompts;
create policy "Published prompts are readable"
on public.prompts for select
using (
  status = 'published'
  or auth.uid() = author_id
  or public.is_admin()
);

drop policy if exists "Authenticated users can create prompts" on public.prompts;
create policy "Authenticated users can create prompts"
on public.prompts for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "Owners and admins can update prompts" on public.prompts;
create policy "Owners and admins can update prompts"
on public.prompts for update
to authenticated
using (auth.uid() = author_id or public.is_admin())
with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "Owners and admins can delete prompts" on public.prompts;
create policy "Owners and admins can delete prompts"
on public.prompts for delete
to authenticated
using (auth.uid() = author_id or public.is_admin());

drop policy if exists "Prompt likes are readable" on public.prompt_likes;
create policy "Prompt likes are readable"
on public.prompt_likes for select
using (true);

drop policy if exists "Users can like prompts" on public.prompt_likes;
create policy "Users can like prompts"
on public.prompt_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own likes" on public.prompt_likes;
create policy "Users can remove own likes"
on public.prompt_likes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can report prompts" on public.prompt_reports;
create policy "Users can report prompts"
on public.prompt_reports for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Admins can read reports" on public.prompt_reports;
create policy "Admins can read reports"
on public.prompt_reports for select
to authenticated
using (public.is_admin());
