-- Reference data: delivery zones, settings, catalog demo data, admin allow-list.
-- Safe to re-run (idempotent upserts).

insert into settings (key, value) values
  ('late_delivery_compensation', '{"amount": 5000, "sla_hours": 24}'::jsonb),
  ('store', '{"name": "Parkent E-Mart", "phone": "+998 90 000 00 00", "telegram": "https://t.me/parkent_emart", "address": "Parkent tumani, Toshkent viloyati"}'::jsonb),
  ('payments', '{"payme": true, "click": true, "cash": true}'::jsonb),
  ('security', '{"console_path": "/__console", "require_mfa": true, "ip_allowlist_enabled": false, "session_hours": 8, "max_login_attempts": 5, "lockout_minutes": 15}'::jsonb)
on conflict (key) do nothing;

-- Only these addresses may ever hold admin/manager roles.
insert into admin_allowlist (email, note) values
  ('javohirbek12122@gmail.com', 'owner')
on conflict (email) do nothing;

insert into delivery_zones (slug, name_uz, base_fee, max_fee, fee_per_kg, min_hours, max_hours, sla_hours, center_lat, center_lng, radius_km, position) values
  ('parkent-markaz', 'Parkent (markaz)', 15000, 25000, 2000, 1, 24, 24, 41.2967, 69.6786, 6, 1),
  ('zarkent',        'Zarkent',          20000, 35000, 3000, 4, 72, 72, 41.3450, 69.7550, 8, 2),
  ('soqoq',          'Soqoq',            20000, 35000, 3000, 4, 72, 72, 41.2600, 69.7900, 8, 3),
  ('kumushkon',      'Kumushkon',        20000, 35000, 3000, 4, 72, 72, 41.2100, 69.7400, 8, 4),
  ('yangibozor',     'Yangibozor',       15000, 35000, 2500, 2, 48, 48, 41.2700, 69.6200, 8, 5)
on conflict (slug) do nothing;

insert into categories (slug, name_uz, name_ru, icon, position) values
  ('oziq-ovqat',   'Oziq-ovqat',        'Продукты',      'ShoppingBasket', 1),
  ('guruch',       'Guruch va donlar',  'Рис и крупы',   'Wheat',          2),
  ('ichimliklar',  'Ichimliklar',       'Напитки',       'CupSoda',        3),
  ('uy-rozgor',    'Uy-ro''zg''or',     'Для дома',      'House',          4),
  ('gigiena',      'Gigiyena',          'Гигиена',       'Sparkles',       5),
  ('bolalar',      'Bolalar uchun',     'Для детей',     'Baby',           6),
  ('texnika',      'Maishiy texnika',   'Техника',       'Plug',           7)
on conflict (slug) do nothing;

insert into brands (slug, name) values
  ('parkent-agro', 'Parkent Agro'),
  ('milliy', 'Milliy'),
  ('nestle', 'Nestle'),
  ('artel', 'Artel')
on conflict (slug) do nothing;

with c as (select slug, id from categories), b as (select slug, id from brands)
insert into products (slug, sku, category_id, brand_id, name_uz, name_ru, description_uz, price, compare_at_price, weight_gram, stock, is_featured)
values
  ('lazer-guruch-5kg', 'GR-001', (select id from c where slug='guruch'), (select id from b where slug='parkent-agro'),
   'Lazer guruch, 5 kg', 'Рис Лазер, 5 кг', 'Parkent dehqonlaridan yig''ilgan yuqori navli lazer guruch. Donlari yirik, palov uchun ideal.', 78000, 92000, 5000, 120, true),
  ('devzira-guruch-3kg', 'GR-002', (select id from c where slug='guruch'), (select id from b where slug='parkent-agro'),
   'Devzira guruch, 3 kg', 'Рис Девзира, 3 кг', 'Asl devzira guruchi, palov uchun eng yaxshi tanlov.', 96000, 110000, 3000, 60, true),
  ('mosh-1kg', 'GR-003', (select id from c where slug='guruch'), (select id from b where slug='milliy'),
   'Mosh, 1 kg', 'Маш, 1 кг', 'Tozalangan mosh, mash-xurda uchun.', 24000, null, 1000, 200, false),
  ('paxta-yogi-5l', 'OZ-001', (select id from c where slug='oziq-ovqat'), (select id from b where slug='milliy'),
   'Paxta yog''i, 5 l', 'Масло хлопковое, 5 л', 'Tozalangan paxta yog''i, 5 litrlik idishda.', 89000, 99000, 5200, 80, true),
  ('shakar-1kg', 'OZ-002', (select id from c where slug='oziq-ovqat'), (select id from b where slug='milliy'),
   'Shakar, 1 kg', 'Сахар, 1 кг', 'Oq shakar, 1 kg.', 13500, null, 1000, 300, false),
  ('un-oliy-25kg', 'OZ-003', (select id from c where slug='oziq-ovqat'), (select id from b where slug='parkent-agro'),
   'Un, oliy navli 25 kg', 'Мука высший сорт, 25 кг', 'Non va patir uchun oliy navli un.', 215000, 240000, 25000, 40, true),
  ('choy-kok-500g', 'ICH-001', (select id from c where slug='ichimliklar'), (select id from b where slug='milliy'),
   'Ko''k choy, 500 g', 'Зелёный чай, 500 г', 'An''anaviy ko''k choy.', 32000, null, 500, 150, false),
  ('mineral-suv-6x1.5l', 'ICH-002', (select id from c where slug='ichimliklar'), (select id from b where slug='milliy'),
   'Mineral suv, 6 x 1,5 l', 'Минеральная вода, 6 x 1,5 л', 'Tabiiy mineral suv, 6 dona.', 27000, 31000, 9000, 90, false),
  ('yuvish-kukuni-6kg', 'UY-001', (select id from c where slug='uy-rozgor'), (select id from b where slug='nestle'),
   'Kir yuvish kukuni, 6 kg', 'Стиральный порошок, 6 кг', 'Avtomat mashinalar uchun kir yuvish kukuni.', 118000, 135000, 6000, 55, true),
  ('idish-yuvish-1l', 'UY-002', (select id from c where slug='uy-rozgor'), null,
   'Idish yuvish suyuqligi, 1 l', 'Средство для посуды, 1 л', 'Konsentrlangan idish yuvish suyuqligi.', 21000, null, 1100, 140, false),
  ('sovun-4x100g', 'GG-001', (select id from c where slug='gigiena'), null,
   'Xo''jalik sovuni, 4 x 100 g', 'Мыло, 4 x 100 г', 'To''rtta bo''lakli sovun to''plami.', 18000, null, 400, 220, false),
  ('tish-pastasi', 'GG-002', (select id from c where slug='gigiena'), null,
   'Tish pastasi, 100 ml', 'Зубная паста, 100 мл', 'Kundalik parvarish uchun tish pastasi.', 19500, 23000, 150, 180, false),
  ('taglik-4-numer', 'BL-001', (select id from c where slug='bolalar'), (select id from b where slug='nestle'),
   'Taglik 4-o''lcham, 44 dona', 'Подгузники 4, 44 шт', 'Yumshoq va nafas oladigan tagliklar.', 132000, 149000, 1800, 45, true),
  ('bolalar-shirasi', 'BL-002', (select id from c where slug='bolalar'), (select id from b where slug='nestle'),
   'Bolalar shirasi, 200 ml', 'Детский сок, 200 мл', 'Shakar qo''shilmagan olma shirasi.', 8500, null, 220, 260, false),
  ('elektr-choynak', 'TX-001', (select id from c where slug='texnika'), (select id from b where slug='artel'),
   'Elektr choynak 1,8 l', 'Электрочайник 1,8 л', 'Po''lat korpus, avtomatik o''chish funksiyasi.', 189000, 225000, 1400, 25, true),
  ('mikser', 'TX-002', (select id from c where slug='texnika'), (select id from b where slug='artel'),
   'Qo''l mikseri 300 W', 'Миксер 300 Вт', 'Besh tezlikli qo''l mikseri.', 249000, 289000, 1600, 18, false),
  ('gaz-plita-4', 'TX-003', (select id from c where slug='texnika'), (select id from b where slug='artel'),
   'Gaz plita, 4 ko''zli', 'Газовая плита, 4 конф.', 'Cho''yan panjarali 4 ko''zli gaz plita.', 2350000, 2600000, 32000, 6, true),
  ('sovutgich-artel', 'TX-004', (select id from c where slug='texnika'), (select id from b where slug='artel'),
   'Sovutgich Artel HD-316', 'Холодильник Artel HD-316', '316 litr, No Frost, energiya tejamkor.', 6890000, 7450000, 62000, 4, true)
on conflict (slug) do nothing;

insert into product_images (product_id, url, position)
select id, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 0
from products
where not exists (select 1 from product_images pi where pi.product_id = products.id);

insert into banners (title, subtitle, link, position) values
  ('Parkent E-Mart', 'Mahalliy mahsulotlar, 1 kunda yetkazib berish', '/catalog', 1),
  ('Guruch va donlar', 'Dehqondan to''g''ridan-to''g''ri', '/catalog?category=guruch', 2),
  ('Maishiy texnika', 'Artel mahsulotlariga chegirmalar', '/catalog?category=texnika', 3)
on conflict do nothing;

insert into news (slug, title, body, is_published, published_at) values
  ('yangi-yetkazib-berish-zonalari', 'Yangi yetkazib berish hududlari',
   'Zarkent, Soqoq va Kumushkon uchun yetkazib berish ishga tushdi. Buyurtma 4 soatdan 72 soat ichida yetkaziladi.',
   true, now()),
  ('kechikishga-qoplama', 'Kechikishga 5 000 so''m qoplama',
   'Va''da qilingan vaqtda yetkazilmagan buyurtmalar uchun keyingi xaridga 5 000 so''m qoplama beriladi.',
   true, now())
on conflict (slug) do nothing;
