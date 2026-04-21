import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Root middleware — runs before every matched request.
 *
 * Two responsibilities:
 *   1. Refresh Supabase auth cookies on every request (prevents silent logouts).
 *   2. Guard /dashboard/* routes server-side, before pages render
 *      (eliminates the flash-of-unauth-content caused by client-side checks).
 *
 * Failure policy:
 *   - Supabase unreachable or unexpected errors → FAIL OPEN.
 *     RLS is still the real security boundary for user data.
 *   - /dashboard/admin role check → FAIL CLOSED.
 *     Privileged routes default to "not allowed" if we can't verify.
 */
export async function middleware(req: NextRequest) {
    try {
        const { supabase, user, response } = await updateSession(req);
        const { pathname } = req.nextUrl;

        // ── Dashboard auth guard ────────────────────────────────────────
        if (pathname.startsWith('/dashboard')) {
            if (!user) {
                // Confirmed not logged in — send to login, remember destination
                const loginUrl = new URL('/login', req.url);
                loginUrl.searchParams.set('next', pathname);
                return redirectPreservingCookies(loginUrl, response);
            }

            // ── Admin sub-guard (fails closed) ──────────────────────────
            if (pathname.startsWith('/dashboard/admin')) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error || !profile || profile.role !== 'admin') {
                    const dashboardUrl = new URL('/dashboard', req.url);
                    dashboardUrl.searchParams.set('error', 'unauthorized');
                    return redirectPreservingCookies(dashboardUrl, response);
                }
            }
        }

        return response;
    } catch (err) {
        // Fail open: if Supabase or this middleware itself breaks, we let
        // the request through. Pages still do their own client-side auth
        // check, and RLS blocks any unauthorized data access.
        console.error('[middleware] Unexpected error — failing open:', err);
        return NextResponse.next({ request: { headers: req.headers } });
    }
}

/**
 * Next.js creates a fresh response when you call NextResponse.redirect(),
 * which DROPS any cookies that were just refreshed. This helper copies
 * them over so the newly-refreshed auth token isn't lost during a redirect.
 */
function redirectPreservingCookies(
    url: URL,
    sourceResponse: NextResponse
): NextResponse {
    const redirectResponse = NextResponse.redirect(url);
    sourceResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
}

export const config = {
    matcher: [
        /*
         * Run on every route EXCEPT:
         *   - Next.js internals (_next/static, _next/image)
         *   - Favicon and common static assets
         *
         * API routes (/api/*) ARE matched — they benefit from cookie refresh
         * and their own handlers enforce any further auth they need.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)',
    ],
};