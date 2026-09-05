-- Telegram configuration storage
create table if not exists public.telegram_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Insert default values
insert into public.telegram_config (key, value) values
  ('admin_group_id', ''),
  ('webhook_url', '')
on conflict (key) do nothing;

-- RLS
alter table public.telegram_config enable row level security;

create policy "Allow public read access"
  on public.telegram_config for select
  using (true);

create policy "Allow service role to update"
  on public.telegram_config for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );
