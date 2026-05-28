-- Run this on an existing Supabase project to allow prompt likes without login.
-- Anonymous likes are stored with a browser-generated visitor id.

create extension if not exists pgcrypto;

alter table public.prompt_likes
  add column if not exists id uuid;

update public.prompt_likes
set id = gen_random_uuid()
where id is null;

alter table public.prompt_likes
  alter column id set default gen_random_uuid();

alter table public.prompt_likes
  alter column id set not null;

alter table public.prompt_likes
  drop constraint if exists prompt_likes_pkey;

alter table public.prompt_likes
  add constraint prompt_likes_pkey primary key (id);

alter table public.prompt_likes
  alter column user_id drop not null;

alter table public.prompt_likes
  add column if not exists anon_id text;

alter table public.prompt_likes
  drop constraint if exists prompt_likes_owner_check;

alter table public.prompt_likes
  add constraint prompt_likes_owner_check check (
    (user_id is not null and anon_id is null)
    or (user_id is null and anon_id is not null)
  );

drop index if exists prompt_likes_prompt_user_unique;
drop index if exists prompt_likes_prompt_anon_unique;

create unique index prompt_likes_prompt_user_unique
  on public.prompt_likes(prompt_id, user_id)
  where user_id is not null;

create unique index prompt_likes_prompt_anon_unique
  on public.prompt_likes(prompt_id, anon_id)
  where anon_id is not null;

create or replace function public.toggle_anonymous_prompt_like(
  target_prompt_id uuid,
  visitor_id text,
  should_like boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if visitor_id !~ '^rt_anon_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'Invalid anonymous visitor id';
  end if;

  if should_like then
    insert into public.prompt_likes (prompt_id, anon_id)
    select target_prompt_id, visitor_id
    where exists (
      select 1
      from public.prompts
      where id = target_prompt_id
        and status = 'published'
    )
    on conflict do nothing;

    return true;
  end if;

  delete from public.prompt_likes
  where prompt_id = target_prompt_id
    and anon_id = visitor_id
    and user_id is null;

  return false;
end;
$$;

grant execute on function public.toggle_anonymous_prompt_like(uuid, text, boolean) to anon, authenticated;

drop policy if exists "Users can like prompts" on public.prompt_likes;
create policy "Users can like prompts"
on public.prompt_likes for insert
to authenticated
with check (auth.uid() = user_id and anon_id is null);

drop policy if exists "Users can remove own likes" on public.prompt_likes;
create policy "Users can remove own likes"
on public.prompt_likes for delete
to authenticated
using (auth.uid() = user_id and anon_id is null);
