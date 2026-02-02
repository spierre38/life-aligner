import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                flowType: 'pkce',
            },
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Authentication successful - redirect to dashboard or specified next page
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
