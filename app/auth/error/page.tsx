'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthErrorPage() {
    const router = useRouter();

    useEffect(() => {
        // Parse error from URL hash (Supabase returns errors in hash)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Redirect to login with error message
        if (error) {
            const message = errorDescription || 'Authentication error occurred';
            router.push(`/login?error=${encodeURIComponent(message)}`);
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-800">Redirecting...</p>
            </div>
        </div>
    );
}
