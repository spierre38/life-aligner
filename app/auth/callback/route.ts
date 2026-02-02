import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorCode = requestUrl.searchParams.get('error_code');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    // Handle errors passed in URL params
    if (error) {
        console.error('Auth callback error:', { error, errorCode, errorDescription });

        let errorMessage = 'verification_failed';

        if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
            errorMessage = 'link_expired';
        } else if (errorCode === 'access_denied' || error === 'access_denied') {
            errorMessage = 'access_denied';
        }

        return NextResponse.redirect(
            new URL(`/login?error=${errorMessage}`, requestUrl.origin)
        );
    }

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                flowType: 'pkce',
            },
        });

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            // Authentication successful - redirect to dashboard or specified next page
            return NextResponse.redirect(new URL(next, requestUrl.origin));
        } else {
            console.error('Error exchanging code for session:', exchangeError);

            // Determine specific error type
            let errorMessage = 'verification_failed';

            if (exchangeError.message.includes('expired')) {
                errorMessage = 'link_expired';
            } else if (exchangeError.message.includes('already been consumed')) {
                errorMessage = 'link_used';
            }

            return NextResponse.redirect(
                new URL(`/login?error=${errorMessage}`, requestUrl.origin)
            );
        }
    }

    // No code provided - might be hash-based error
    // Return a page that checks the hash client-side
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}
