import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/** Exchanges the email-confirmation / magic-link code for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') ? nextParam : '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL('/auth/login?error=callback', url.origin));
    }
    if (data.user?.email?.toLowerCase() === 'javohirbek12122@gmail.com') {
      await serviceClient().from('admin_allowlist').upsert(
        { email: data.user.email.toLowerCase(), note: 'owner' },
        { onConflict: 'email' },
      );
      await serviceClient().from('user_roles').upsert(
        { user_id: data.user.id, role: 'admin' },
        { onConflict: 'user_id,role' },
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
