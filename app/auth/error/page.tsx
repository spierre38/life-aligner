'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthErrorPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if there's an error in the URL hash
        const hash = window.location.hash;

        if (hash) {
            // Parse hash parameters
            const params = new URLSearchParams(hash.substring(1));
            const error = params.get('error');
            const errorCode = params.get('error_code');
            const errorDescription = params.get('error_description');

            console.error('Auth error from hash:', { error, errorCode, errorDescription });

            let errorMessage = 'verification_failed';

            if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
                errorMessage = 'link_expired';
            } else if (error === 'access_denied') {
                errorMessage = 'access_denied';
            }

            // Redirect to login with error
            router.push(`/login?error=${errorMessage}`);
        } else {
            // No hash error, just redirect to login
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Processing authentication...</p>
            </div>
        </div>
    );
}
