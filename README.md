# Parkent E-Mart

Parkent tumani uchun marketplace: Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage, RLS).
Katalog, savat, checkout, Payme/Click/naqd to'lov, Parkent yetkazib berish zonalari va SLA jarimasi,
mijoz kabineti, murojaatlar — hammasi maxfiy admin konsoldan boshqariladi.

## Talablar

- Node.js 20.19+ (yoki 22+), npm 10+
- Supabase loyihasi (bepul reja ham yetadi)
- Supabase CLI (`npx supabase`, repoda devDependency sifatida bor)

## 1. O'rnatish

```bash
npm install
cp .env.example .env.local   # keyin qiymatlarni to'ldiring
npm run dev                  # http://localhost:3000
```

## 2. Muhit o'zgaruvchilari

`.env.example` — to'liq ro'yxat. Muhimlari:

| O'zgaruvchi | Qayerda | Izoh |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | brauzer + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | brauzer + server | anon key (RLS bilan cheklangan) |
| `NEXT_PUBLIC_SITE_URL` | brauzer | prod domen, to'lov `return_url` uchun |
| `NEXT_PUBLIC_MAPS_API_KEY` | brauzer | manzil xaritasi (ixtiyoriy) |
| `SUPABASE_SERVICE_ROLE_KEY` | **faqat server** | RLS ni chetlab o'tadi; hech qachon klientga chiqmaydi |
| `CONSOLE_ENCRYPTION_KEY` | **faqat server** | `openssl rand -base64 32` — MFA sirlarini AES-256-GCM bilan shifrlaydi |
| `PAYME_MERCHANT_ID`, `PAYME_MERCHANT_KEY`, `PAYME_CHECKOUT_URL` | **faqat server** | Payme Merchant API |
| `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` | **faqat server** | Click SHOP-API |
| `CRON_SECRET` | **faqat server** | SLA cron endpointi uchun bearer token |

Server kalitlarini `.env.local` va hosting provayderining "Environment variables"
bo'limidan boshqa joyga yozmang. `.env.example` dan tashqari barcha `.env*` fayllari git'ga tushmaydi.

## 3. Supabase sozlash

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push          # supabase/migrations
npx supabase db execute --file supabase/seed.sql   # zonalar, sozlamalar, allow-list, demo katalog
```

Migratsiyalar:

- `20260818120000_init_schema.sql` — jadval, enum, trigger, stok/rating sinxronizatsiyasi
- `20260818121000_rls_and_security.sql` — RLS siyosatlari, `private.*` yordamchilar, privilegiyalarni olib tashlash
- `20260818122000_order_functions.sql` — `calc_delivery_fee`, `create_order_from_cart` (faqat `service_role`)

Supabase Dashboard'da:

1. **Authentication → URL configuration**: Site URL = `NEXT_PUBLIC_SITE_URL`,
   Redirect URLs ro'yxatiga `<site>/auth/callback` ni qo'shing.
2. **Authentication → Providers → Email**: email confirmation yoqilgan holda qoldiring.
3. **Storage**: mahsulot rasmlari uchun public bucket (masalan `products`).

## 4. Admin konsol (faqat egasi uchun)

- Manzil: `/__console` (`noindex`, `no-store`, sitemap'da yo'q)
- Kirish uchun 5 shart: Supabase sessiyasi → email allow-list'da → `admin`/`manager` roli →
  IP allow-list (yoqilgan bo'lsa) → MFA tasdiqlangan `pe_console` sessiya cookie'si
- Konsol sessiyasi saytning oddiy sessiyasidan **alohida** cookie'da yashaydi va faqat `/__console` yo'lida ishlaydi

Birinchi kirish:

1. Saytda odatdagidek ro'yxatdan o'ting (`supabase/seed.sql` dagi allow-list emaili bilan).
2. SQL editor'da o'zingizga admin roli bering:

   ```sql
   insert into user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'siz@example.com'
   on conflict do nothing;
   ```

3. `/__console/login` da "MFA ulash" bo'limidan QR kodni authenticator'ga qo'shing,
   zaxira kodlarni xavfsiz joyda saqlang.
4. Shundan keyin har kirishda email + parol + 6 xonali kod so'raladi.

Konsolda: dashboard, buyurtmalar (status, kuryer, refund), mahsulotlar va narx tarixi,
yetkazib berish zonalari va SLA kompensatsiyasi, to'lovlar va provayder callback loglari,
foydalanuvchilar/rollar/bloklash, murojaatlar, sharh moderatsiyasi, banner/yangiliklar,
sozlamalar, xavfsizlik (allow-list, IP, sessiyalar, urinishlar, audit log) va
faqat ruxsat etilgan jadvallarni ko'rsatadigan baza brauzeri (raw SQL yo'q).

## 5. To'lov callback URL'lari

Provayder kabinetida quyidagilarni ko'rsatasiz:

- Payme: `https://<domen>/api/payments/payme` (JSON-RPC 2.0, Basic auth `Paycom:<merchant key>`)
- Click: `https://<domen>/api/payments/click` (Prepare va Complete bir xil URL)

Ikki provayder ham summani **bazadagi buyurtma summasi** bilan tekshiradi — klient yuborgan
narx hech qachon ishonchli deb qabul qilinmaydi.

## 6. SLA cron (kechikkan yetkazib berish kompensatsiyasi)

```bash
curl -X POST https://<domen>/api/cron/sla -H "Authorization: Bearer $CRON_SECRET"
```

Vercel'da `vercel.json` cron yoki Supabase `pg_cron` bilan soatda bir marta chaqirish kifoya.
Konsolning "Yetkazib berish" sahifasidan qo'lda ham ishga tushirish mumkin.

## 7. Tekshiruv

```bash
npm run lint
npm run typecheck
npm run test     # vitest: yetkazib berish tarifi, zona, SLA, buyurtma o'tishlari, Payme, Click
npm run build
```
