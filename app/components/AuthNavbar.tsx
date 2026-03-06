'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AuthNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showSocialMenu, setShowSocialMenu] = useState(false);
    const [worksheetStatus, setWorksheetStatus] = useState({
        values: false,
        interests: false,
        lifeCategories: false,
    });

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Fetch worksheet completion status
            if (user) {
                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (worksheets) {
                    setWorksheetStatus({
                        values: worksheets.some(w => w.category === 'values'),
                        interests: worksheets.some(w => w.category === 'interests'),
                        lifeCategories: worksheets.some(w => w.category === 'life_categories'),
                    });
                }
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const isActive = (path: string) => pathname === path;

    if (!user) return null;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                                🎯
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
                                LifeAligner
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                href="/dashboard"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${isActive('/dashboard')
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href={worksheetStatus.lifeCategories ? "/workbook/lifeframe" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Please complete Values, Interests, and Categories first.');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${!worksheetStatus.lifeCategories ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                    (isActive('/workbook/lifeframe') || pathname.startsWith('/workbook'))
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {worksheetStatus.lifeCategories ? '📋 LifeFrame' : '🔒 LifeFrame'}
                            </Link>
                            <Link
                                href={worksheetStatus.lifeCategories ? "/roadmap" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Complete your LifeFrame first to unlock the Roadmap');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${!worksheetStatus.lifeCategories ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                        isActive('/roadmap')
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {worksheetStatus.lifeCategories ? '🗺️ Roadmap' : '🔒 Roadmap'}
                            </Link>
                            <Link
                                href="/todo"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${isActive('/todo')
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                ✅ To-Do
                            </Link>
                            <Link
                                href="/resources"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${isActive('/resources')
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                📚 Resources
                            </Link>
                            <div className="relative">
                                <button
                                    onClick={() => setShowSocialMenu(!showSocialMenu)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 ${isActive('/community') || isActive('/partners')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                                    Social
                                    <svg className={`w-4 h-4 transition-transform ${showSocialMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showSocialMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowSocialMenu(false)}></div>
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                            <Link href="/community" onClick={() => setShowSocialMenu(false)} className={`flex items-center gap-3 px-4 py-3 transition ${isActive('/community') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>
                                                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-sm">Community Feed</p>
                                                    <p className="text-xs text-gray-500">Share &amp; get inspired</p>
                                                </div>
                                            </Link>
                                            <Link href="/community?tab=partners" onClick={() => setShowSocialMenu(false)} className={`flex items-center gap-3 px-4 py-3 transition ${isActive('/partners') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>
                                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-sm">Partners</p>
                                                    <p className="text-xs text-gray-500">Accountability buddies</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {user?.user_metadata?.full_name || 'User'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                        {user?.email}
                                    </div>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {user?.user_metadata?.full_name || 'User'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {user?.email}
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            <Link
                                                href={worksheetStatus.lifeCategories ? "/workbook/lifeframe" : "#"}
                                                onClick={(e) => {
                                                    if (!worksheetStatus.lifeCategories) {
                                                        e.preventDefault();
                                                        alert('Please complete Values, Interests, and Categories first.');
                                                    } else {
                                                        setShowUserMenu(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2 transition ${worksheetStatus.lifeCategories ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <span className="text-xl">{worksheetStatus.lifeCategories ? '📋' : '🔒'}</span>
                                                <span className="text-sm font-medium text-gray-700">View LifeFrame</span>
                                            </Link>
                                            <Link
                                                href={worksheetStatus.lifeCategories ? "/roadmap" : "#"}
                                                onClick={(e) => {
                                                    if (!worksheetStatus.lifeCategories) {
                                                        e.preventDefault();
                                                        alert('Complete your LifeFrame first to unlock the Roadmap');
                                                    } else {
                                                        setShowUserMenu(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2 transition ${worksheetStatus.lifeCategories ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <span className="text-xl">{worksheetStatus.lifeCategories ? '🗺️' : '🔒'}</span>
                                                <span className="text-sm font-medium text-gray-700">My Roadmap</span>
                                            </Link>
                                            <Link href="/todo" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-xl">✅</span>
                                                <span className="text-sm font-medium text-gray-700">To-Do List</span>
                                            </Link>
                                            <Link href="/resources" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-xl">📚</span>
                                                <span className="text-sm font-medium text-gray-700">Resources</span>
                                            </Link>
                                            <Link href="/community" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-xl">🌐</span>
                                                <span className="text-sm font-medium text-gray-700">Community</span>
                                            </Link>
                                            <Link href="/community?tab=partners" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                                <span className="text-sm font-medium text-gray-700">Partners</span>
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 py-2">
                                            <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-xl">⚙️</span>
                                                <span className="text-sm font-medium text-gray-700">Settings</span>
                                            </Link>
                                            <button onClick={() => { setShowUserMenu(false); handleSignOut(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-left">
                                                <span className="text-xl">🚪</span>
                                                <span className="text-sm font-medium text-red-600">Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {showMobileMenu && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <div className="space-y-1">
                            <Link href="/dashboard" onClick={() => setShowMobileMenu(false)} className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                Dashboard
                            </Link>
                            <Link
                                href={worksheetStatus.lifeCategories ? "/workbook/lifeframe" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Please complete Values, Interests, and Categories first.');
                                    } else {
                                        setShowMobileMenu(false);
                                    }
                                }}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${pathname.startsWith('/workbook') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {worksheetStatus.lifeCategories ? '📋 LifeFrame' : '🔒 LifeFrame (Locked)'}
                            </Link>
                            <Link
                                href={worksheetStatus.lifeCategories ? "/roadmap" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Complete your LifeFrame first to unlock the Roadmap');
                                    } else {
                                        setShowMobileMenu(false);
                                    }
                                }}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/roadmap') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {worksheetStatus.lifeCategories ? '🗺️ Roadmap' : '🔒 Roadmap (Locked)'}
                            </Link>
                            <Link href="/todo" onClick={() => setShowMobileMenu(false)} className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/todo') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                ✅ To-Do
                            </Link>
                            <Link href="/resources" onClick={() => setShowMobileMenu(false)} className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/resources') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                📚 Resources
                            </Link>
                            <Link href="/community" onClick={() => setShowMobileMenu(false)} className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/community') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                🌐 Community
                            </Link>
                            <Link href="/community?tab=partners" onClick={() => setShowMobileMenu(false)} className={`block px-4 py-3 rounded-lg font-semibold transition ${isActive('/partners') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                Partners
                            </Link>
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
                            <Link href="/settings" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition">
                                ⚙️ Settings
                            </Link>
                            <button onClick={() => { setShowMobileMenu(false); handleSignOut(); }} className="w-full text-left px-4 py-3 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition">
                                🚪 Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Worksheet Progress Tracker - Only show in workbook pages and when not all complete */}
            {pathname.startsWith('/workbook') && !(worksheetStatus.values && worksheetStatus.interests && worksheetStatus.lifeCategories) && (
                <div className="border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-900">Workbook Progress</h3>
                            <span className="text-xs text-gray-800">
                                {Object.values(worksheetStatus).filter(Boolean).length} of 3 completed
                            </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {/* Step 1: Values */}
                            <Link
                                href="/workbook/values"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${worksheetStatus.values
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'
                                    }`}
                            >
                                {worksheetStatus.values ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                                )}
                                Values
                            </Link>

                            <div className="h-0.5 w-8 bg-gray-300"></div>

                            {/* Step 2: Interests */}
                            <Link
                                href={worksheetStatus.values ? "/workbook/interests" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.values) {
                                        e.preventDefault();
                                        alert('Please complete Values worksheet first');
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${worksheetStatus.interests
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : worksheetStatus.values
                                        ? 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {worksheetStatus.interests ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : worksheetStatus.values ? (
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                Interests
                            </Link>

                            <div className="h-0.5 w-8 bg-gray-300"></div>

                            {/* Step 3: Life Categories */}
                            <Link
                                href={worksheetStatus.interests ? "/workbook/life-categories" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.interests) {
                                        e.preventDefault();
                                        alert('Please complete Interests worksheet first');
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${worksheetStatus.lifeCategories
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : worksheetStatus.interests
                                        ? 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {worksheetStatus.lifeCategories ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : worksheetStatus.interests ? (
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                Life Categories
                            </Link>

                            <div className="h-0.5 w-8 bg-gray-300"></div>

                            {/* Step 4: LifeFrame */}
                            <Link
                                href={worksheetStatus.lifeCategories ? "/workbook/lifeframe" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Please complete all three worksheets first');
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${worksheetStatus.lifeCategories
                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 hover:from-yellow-200 hover:to-orange-200 border-2 border-orange-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {worksheetStatus.lifeCategories ? (
                                    <span className="text-lg">✨</span>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                LifeFrame
                            </Link>

                            <div className="h-0.5 w-8 bg-gray-300"></div>

                            {/* Step 5: Roadmap */}
                            <Link
                                href={worksheetStatus.lifeCategories ? "/roadmap" : "#"}
                                onClick={(e) => {
                                    if (!worksheetStatus.lifeCategories) {
                                        e.preventDefault();
                                        alert('Complete your LifeFrame first to unlock the Roadmap');
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${worksheetStatus.lifeCategories
                                    ? 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {worksheetStatus.lifeCategories ? (
                                    <span className="text-lg">🗺️</span>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                Roadmap
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
