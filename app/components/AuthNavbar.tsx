'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useState } from 'react';

export function AuthNavbar() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-2">
                                    <Link
                                        href="/workbook/values"
                                        className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
                                                📌
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Values</div>
                                                <div className="text-xs text-gray-500">Step 1 of 5</div>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/workbook/interests"
                                        className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-pink-600 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm">
                                                ❤️
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Interests</div>
                                                <div className="text-xs text-gray-500">Step 2 of 5</div>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="px-4 py-3 opacity-50 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center text-white text-sm">
                                                🎯
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-500">Life Categories</div>
                                                <div className="text-xs text-gray-400">Coming Soon</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 opacity-50 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center text-white text-sm">
                                                🗺️
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-500">Roadmap</div>
                                                <div className="text-xs text-gray-400">Coming Soon</div>
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
