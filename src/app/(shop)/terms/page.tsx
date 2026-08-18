import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ommaviy oferta' };

const SECTIONS = [
  {
    title: '1. Umumiy shartlar',
    body: "Saytdan buyurtma berish orqali xaridor ushbu oferta shartlariga rozilik bildiradi. Buyurtma tizimda qayd etiladi va holati xaridor kabinetida kuzatiladi.",
  },
  {
    title: '2. Narx va to‘lov',
    body: "Mahsulot narxi katalogda ko‘rsatilgan bo‘ladi va buyurtma yaratilgan paytdagi narx qayd etiladi. To‘lov Payme, Click yoki mahsulotni qabul qilganda naqd shaklida amalga oshiriladi.",
  },
  {
    title: '3. Yetkazib berish',
    body: "Yetkazib berish Parkent tumani hududlari bo‘yicha amalga oshiriladi. Yetkazib berish summasi hudud, buyurtma vazni va sotuvchi tariflari asosida hisoblanadi.",
  },
  {
    title: '4. Kechikish uchun qoplama',
    body: "Va’da qilingan yetkazib berish vaqti o‘tib ketgan hollarda xaridorga 5 000 so‘m miqdorida qoplama hisoblanadi va u buyurtma summasidan chegiriladi.",
  },
  {
    title: '5. Qaytarish',
    body: "Sifatsiz yoki noto‘g‘ri yetkazilgan mahsulot 24 soat ichida qaytarilishi mumkin. So‘rov «Yordam» bo‘limi orqali rasmiylashtiriladi.",
  },
  {
    title: '6. Maxfiylik',
    body: "Foydalanuvchi ma’lumotlari faqat buyurtmani bajarish uchun ishlatiladi va uchinchi shaxslarga berilmaydi. Barcha kirish va muhim amallar audit jurnalida qayd etiladi.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">Ommaviy oferta</h1>
      {SECTIONS.map((section) => (
        <section key={section.title} className="card p-4">
          <h2 className="font-semibold">{section.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
