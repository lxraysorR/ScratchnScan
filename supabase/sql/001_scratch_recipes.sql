create extension if not exists pgcrypto;

create table if not exists public.scratch_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  guest_session_id text null,
  product_name text,
  category text,
  source text,
  product_context jsonb,
  recipe jsonb,
  user_preferences text,
  favorite boolean not null default false,
  sync_status text not null default 'synced',
  remote_id text null,
  last_sync_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scratch_recipes_user_created on public.scratch_recipes(user_id, created_at desc);
create index if not exists idx_scratch_recipes_guest_created on public.scratch_recipes(guest_session_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_scratch_recipes_updated_at on public.scratch_recipes;
create trigger trg_scratch_recipes_updated_at
before update on public.scratch_recipes
for each row execute function public.set_updated_at();

alter table public.scratch_recipes enable row level security;
-- TODO: once auth is enabled, replace with strict per-user policies.
-- create policy "scratch_recipes_owner_select" on public.scratch_recipes for select using (auth.uid() = user_id);
-- create policy "scratch_recipes_owner_write" on public.scratch_recipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
