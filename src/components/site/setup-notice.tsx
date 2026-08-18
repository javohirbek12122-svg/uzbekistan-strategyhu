import { AlertTriangle } from 'lucide-react';

/** Shown only when Supabase env vars are missing (fresh clone / preview build). */
export function SetupNotice() {
  return (
    <div className="card flex items-start gap-3 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Supabase ulanmagan</p>
        <p>
          <code>NEXT_PUBLIC_SUPABASE_URL</code> va <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ni{' '}
          <code>.env.local</code> ga qo&apos;shing, so&apos;ng migratsiya va seed&apos;ni ishga tushiring
          (<code>supabase db push</code>). Katalog va buyurtmalar shundan keyin ishlaydi.
        </p>
      </div>
    </div>
  );
}
