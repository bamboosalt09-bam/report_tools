-- Run this on an existing Supabase project after granting an admin account.
-- It tightens prompt updates so only admins can restore hidden prompts.

drop policy if exists "Owners and admins can update prompts" on public.prompts;
drop policy if exists "Owners can update own published prompts" on public.prompts;
drop policy if exists "Admins can update prompts" on public.prompts;
drop policy if exists "Owners and admins can delete prompts" on public.prompts;
drop policy if exists "Owners can delete own published prompts" on public.prompts;
drop policy if exists "Admins can delete prompts" on public.prompts;

create policy "Owners can update own published prompts"
on public.prompts for update
to authenticated
using (auth.uid() = author_id and status = 'published')
with check (auth.uid() = author_id and status = 'published');

create policy "Admins can update prompts"
on public.prompts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Owners can delete own published prompts"
on public.prompts for delete
to authenticated
using (auth.uid() = author_id and status = 'published');

create policy "Admins can delete prompts"
on public.prompts for delete
to authenticated
using (public.is_admin());
