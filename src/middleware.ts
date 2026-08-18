import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const CONSOLE_PREFIX = '/__console';

/**
 * Refreshes the Supabase session cookie and applies the first layer of console
 * protection: unauthenticated requests never reach console pages, and the
 * console is always marked `noindex`. The authoritative checks (allow-list,
 * role, MFA session, IP) run server-side in `getConsoleIdentity`.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith(CONSOLE_PREFIX)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
    if (!user && pathname !== `${CONSOLE_PREFIX}/login`) {
      const url = request.nextUrl.clone();
      url.pathname = `${CONSOLE_PREFIX}/login`;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  const protectedPaths = ['/checkout', '/orders', '/profile', '/support'];
  if (!user && protectedPaths.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
