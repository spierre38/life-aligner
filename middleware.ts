// middleware.ts (place in project ROOT, not inside app/)
// Protects /dashboard/admin routes - only allows users with role='admin'

import { updateSession } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const { supabase, response } = await updateSession(req);

    // Only protect /dashboard/admin routes
    if (req.nextUrl.pathname.startsWith('/dashboard/admin')) {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Not logged in → redirect to login
            if (!user) {
                return NextResponse.redirect(new URL('/login', req.url));
            }

            // Check if user has admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // Not an admin → redirect to dashboard with error
            if (!profile || profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
            }

        } catch (error) {
            // On error, redirect to login for safety
            console.error('Admin middleware error:', error);
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/dashboard/admin/:path*'],
};