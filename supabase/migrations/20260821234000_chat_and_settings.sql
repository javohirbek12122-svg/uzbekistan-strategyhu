-- Public chat system
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (length(message) <= 500),
  image_url text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;
create policy chat_read on public.chat_messages for select using (true);
create policy chat_insert on public.chat_messages for insert with check (auth.uid() = user_id);

-- User settings
alter table public.profiles add column if not exists settings jsonb not null default '{}';
create index if not exists profiles_settings_idx on public.profiles using gin (settings);
