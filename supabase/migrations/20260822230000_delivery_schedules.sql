-- Add delivery schedule fields to delivery_zones
alter table public.delivery_zones
  add column if not exists delivery_day text,
  add column if not exists delivery_time text,
  add column if not exists min_weight_kg int default 70,
  add column if not exists max_weight_kg int default 1000,
  add column if not exists is_labo_zone boolean default true;

-- Update existing zones with schedule data
update public.delivery_zones
set 
  delivery_day = case 
    when slug = 'zarkent-hisarak' then 'Dushanba'
    when slug = 'soqoq-kumushkon' then 'Chorshanba'
    when slug = 'yangibozor' then 'Juma'
    when slug = 'parkent-center' then 'Har kuni'
    else 'Har kuni'
  end,
  delivery_time = case 
    when slug = 'parkent-center' then 'Kechqurun 18:00 - 20:00'
    else 'Ertalab 08:00 - 12:00'
  end,
  min_weight_kg = 70,
  max_weight_kg = 1000,
  is_labo_zone = true
where slug in ('zarkent-hisarak', 'soqoq-kumushkon', 'yangibozor', 'parkent-center');
