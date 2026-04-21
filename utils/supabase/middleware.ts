import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session cookies on every matched request
 * and returns the current user.
 *
 * Why this exists: @supabase/ssr needs getUser() to be called inside
 * middleware to refresh expired access tokens. Without that call, users
 * get silently logged out when their token expires mid-session.
 *
 * Returns:
 *   supabase - server-side client (use for DB queries in middleware)
 *   user     - the authenticated user, or null if not logged in
 *   response - NextResponse with any refreshed session cookies attached
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // THIS is the line that makes session refresh actually happen.
    // supabase-js checks if the access token is expired and, if so, uses
    // the refresh token to get a new one — then calls the `set` cookie
    // callback above to persist it. No getUser() = no refresh.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { supabase, user, response };
}
