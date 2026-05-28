-- Run this on an existing Supabase project to let users update their own
-- display name without allowing role escalation.

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own non-admin profile" on public.profiles;
drop policy if exists "Users can update own user profile" on public.profiles;
drop policy if exists "Admins can update own admin profile" on public.profiles;

create policy "Users can update own user profile"
on public.profiles for update
to authenticated
using (auth.uid() = id and role = 'user')
with check (auth.uid() = id and role = 'user');

create policy "Admins can update own admin profile"
on public.profiles for update
to authenticated
using (auth.uid() = id and role = 'admin')
with check (auth.uid() = id and role = 'admin');
