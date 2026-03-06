'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/community?tab=partners');
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium text-sm">Redirecting...</p>
            </div>
        </div>
    );
}
