-- Replace the email value before running this in Supabase SQL Editor.
-- Do not grant admin from the client app.

begin;

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own non-admin profile" on public.profiles;

create policy "Users can update own non-admin profile"
on public.profiles for update
to authenticated
using (auth.uid() = id and role = 'user')
with check (auth.uid() = id and role = 'user');

insert into public.profiles (id, username, role)
select
  u.id,
  left(coalesce(nullif(split_part(u.email, '@', 1), ''), 'admin'), 24),
  'admin'
from auth.users u
where u.email = 'admin@example.com'
on conflict (id) do update
set role = 'admin';

commit;

select
  u.email,
  p.username,
  p.role,
  u.email_confirmed_at
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'admin@example.com';
