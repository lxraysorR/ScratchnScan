create table if not exists public.scratch_recipe_media (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid null references public.scratch_recipes(id) on delete cascade,
  draft_id text null,
  user_id uuid null,
  guest_session_id text null,
  media_role text not null check (media_role in ('front_package','back_label','thumbnail')),
  storage_bucket text not null,
  storage_path text not null,
  mime_type text null,
  size_bytes integer null,
  width integer null,
  height integer null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scratch_recipe_media_recipe on public.scratch_recipe_media(recipe_id, media_role);
create index if not exists idx_scratch_recipe_media_guest on public.scratch_recipe_media(guest_session_id, created_at desc);

alter table public.scratch_recipe_media enable row level security;
-- TODO: once auth is enabled, replace with strict per-user policies.
-- create policy "scratch_recipe_media_owner_select" on public.scratch_recipe_media for select using (auth.uid() = user_id);
-- create policy "scratch_recipe_media_owner_write" on public.scratch_recipe_media for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
