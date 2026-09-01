import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    const type = requestUrl.searchParams.get('type');

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {
                            // Can't set cookies in some contexts — middleware handles refresh
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Can't remove cookies in some contexts
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // If this is a password recovery flow, redirect to the confirm page
            if (type === 'recovery') {
                return NextResponse.redirect(new URL('/reset-password/confirm', requestUrl.origin));
            }

            // Otherwise redirect to dashboard or specified next page
            return NextResponse.redirect(new URL(next, requestUrl.origin));
        } else {
            console.error('Error exchanging code for session:', error);
            // Redirect to login with error message
            return NextResponse.redirect(
                new URL('/login?error=verification_failed', requestUrl.origin)
            );
        }
    }

    // No code provided - redirect to login
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
