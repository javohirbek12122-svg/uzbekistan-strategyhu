-- Extend profiles with additional user information
alter table public.profiles add column if not exists passport_id text;
alter table public.profiles add column if not exists card_number text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists emergency_contact text;
alter table public.profiles add column if not exists emergency_phone text;
alter table public.profiles add column if not exists notes text;

create index if not exists profiles_passport_idx on public.profiles (passport_id);
