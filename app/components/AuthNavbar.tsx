'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';

type WorksheetStatus = {
    values: boolean;
    interests: boolean;
    lifeCategories: boolean;
    roadmap: boolean;
};

export function AuthNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [worksheetStatus, setWorksheetStatus] = useState<WorksheetStatus>({
        values: false,
        interests: false,
        lifeCategories: false,
        roadmap: false,
    });

    // Check worksheet completion status
    useEffect(() => {
        const checkWorksheetStatus = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) return;

                // Check which worksheets are completed
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id);

                if (data && !error) {
                    const completed = data.map(entry => entry.category);
                    setWorksheetStatus({
                        values: completed.includes('values'),
                        interests: completed.includes('interests'),
                        lifeCategories: completed.includes('life_categories'),
                        roadmap: completed.includes('roadmap'),
                    });
                }
            } catch (error) {
                console.error('Error checking worksheet status:', error);
            }
        };

        checkWorksheetStatus();
    }, [pathname]); // Re-check when path changes

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            const result = await signOut();
            if (result.success) {
                router.push('/');
            } else {
                alert('Failed to sign out. Please try again.');
                setIsLoggingOut(false);
            }
        } catch (error) {
            console.error('Sign out error:', error);
            alert('An error occurred while signing out.');
            setIsLoggingOut(false);
        }
    };

    const handleWorksheetClick = (
        e: React.MouseEvent,
        path: string,
        isLocked: boolean,
        requiredWorksheet?: string
    ) => {
        if (isLocked) {
            e.preventDefault();
            alert(`Please complete the ${requiredWorksheet} worksheet first.`);
        }
    };

    return (
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            LifeAligner
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="text-gray-800 hover:text-gray-900 font-medium transition"
                        >
                            Dashboard
                        </Link>

                        {/* Workbook Dropdown */}
                        <div className="relative group">
                            <button className="text-gray-800 hover:text-gray-900 font-medium transition flex items-center gap-1">
                                Workbook
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-2">
                                    {/* Values - Always accessible */}
                                    <Link
                                        href="/workbook/values"
                                        className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
                                                📌
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Values</div>
                                                <div className="text-xs text-gray-500">Step 1 of 5</div>
                                            </div>
                                            {worksheetStatus.values && (
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Interests - Locked until Values completed */}
                                    <Link
                                        href="/workbook/interests"
                                        onClick={(e) => handleWorksheetClick(e, '/workbook/interests', !worksheetStatus.values, 'Values')}
                                        className={`block px-4 py-3 transition-colors ${worksheetStatus.values
                                            ? 'hover:bg-purple-50'
                                            : 'opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${worksheetStatus.values
                                                ? 'bg-gradient-to-br from-pink-600 to-orange-600'
                                                : 'bg-gray-400'
                                                }`}>
                                                ❤️
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                    Interests
                                                    {!worksheetStatus.values && (
                                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {worksheetStatus.values ? 'Step 2 of 5' : 'Complete Values first'}
                                                </div>
                                            </div>
                                            {worksheetStatus.interests && (
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </Link>


                                    {/* Life Categories - Locked until Interests completed */}
                                    <Link
                                        href="/workbook/life-categories"
                                        onClick={(e) => handleWorksheetClick(e, '/workbook/life-categories', !worksheetStatus.interests, 'Interests')}
                                        className={`block px-4 py-3 transition-colors ${worksheetStatus.interests
                                                ? 'hover:bg-purple-50'
                                                : 'opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${worksheetStatus.interests
                                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                                                    : 'bg-gray-400'
                                                }`}>
                                                🎯
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                    Life Categories
                                                    {!worksheetStatus.interests && (
                                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {worksheetStatus.interests ? 'Step 3 of 5' : 'Complete Interests first'}
                                                </div>
                                            </div>
                                            {worksheetStatus.lifeCategories && (
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Roadmap - Locked until Life Categories completed */}
                                    <div
                                        className="px-4 py-3 opacity-50 cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center text-white text-sm">
                                                🗺️
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-500 flex items-center gap-2">
                                                    Roadmap
                                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="text-xs text-gray-400">Complete Life Categories first</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help - Placeholder */}
                        <Link
                            href="/help"
                            className="text-gray-800 hover:text-gray-900 font-medium transition"
                        >
                            Help
                        </Link>

                        {/* Sign Out Button */}
                        <button
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                            className={`
                px-4 py-2 rounded-full font-medium transition
                ${isLoggingOut
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                }
              `}
                        >
                            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
