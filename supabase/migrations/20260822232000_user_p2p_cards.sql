-- Add P2P card number to profiles for saved payment cards
alter table public.profiles
  add column if not exists p2p_card_number text;

-- RLS: users can update their own p2p_card_number
create policy "Users can update own p2p card"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
