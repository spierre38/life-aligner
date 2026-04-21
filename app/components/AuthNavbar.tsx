'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { evaluateLifeFrameCompletion, type LifeFrameCompletion } from '@/lib/lifeframe-completion';
import Wordmark from '@/app/components/Wordmark';

// ─── Inline nav icons ───────────────────────────────────────────────────────
const Icons = {
    clipboard: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
    ),
    map: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
    ),
    check: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    book: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    globe: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    gear: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    logout: (cn = 'w-4 h-4') => (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

// Canonical order: Values → Interests → Life Categories.
// Used to pick where a locked LifeFrame link should send the user.
function routeForNextIncomplete(completion: LifeFrameCompletion | null): string {
    if (!completion) return '/workbook/values';
    switch (completion.nextIncomplete) {
        case 'values':
            return '/workbook/values';
        case 'interests':
            return '/workbook/interests';
        case 'life_categories':
            return '/workbook/life-categories';
        default:
            return '/workbook/lifeframe';
    }
}

export default function AuthNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [completion, setCompletion] = useState<LifeFrameCompletion | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!mounted) return;
            setUser(currentUser);

            if (currentUser) {
                // Single fetch for all worksheets — one source of truth.
                // Phase 1 evaluator handles malformed rows defensively,
                // so we don't need to guard the shape here.
                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', currentUser.id);

                if (!mounted) return;
                setCompletion(evaluateLifeFrameCompletion(worksheets ?? []));

                // Load avatar
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', currentUser.id)
                    .single();
                if (!mounted) return;
                if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
            }
        };

        load();

        // Keep navbar in sync with sign-in / sign-out events.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setUser(session?.user ?? null);
            if (!session?.user) setCompletion(null);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const isActive = (path: string) => pathname === path;
    const isPathPrefix = (prefix: string) => pathname?.startsWith(prefix) ?? false;

    // A nav link is "unlocked" when the user's LifeFrame is fully complete.
    // Locked links still render — just muted — and clicking routes to the
    // next incomplete worksheet instead of alerting.
    const lifeFrameUnlocked = completion?.allComplete ?? false;
    const nextWorksheetRoute = routeForNextIncomplete(completion);

    if (!user) return null;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Left: wordmark + nav links */}
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center">
                            <Wordmark size="sm" />
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                href="/dashboard"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                    isActive('/dashboard')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                Dashboard
                            </Link>

                            {/* LifeFrame: locked until all three worksheets meet the happy path */}
                            <Link
                                href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 ${
                                    !lifeFrameUnlocked
                                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        : isPathPrefix('/workbook')
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                aria-label={lifeFrameUnlocked ? 'View LifeFrame' : 'Continue building your LifeFrame'}
                            >
                                {Icons.clipboard()}
                                LifeFrame
                            </Link>

                            {/* Roadmap: same unlock rule */}
                            <Link
                                href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 ${
                                    !lifeFrameUnlocked
                                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        : isActive('/roadmap')
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                aria-label={lifeFrameUnlocked ? 'Open Roadmap' : 'Continue building your LifeFrame'}
                            >
                                {Icons.map()}
                                Roadmap
                            </Link>

                            <Link
                                href="/todo"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 ${
                                    isActive('/todo')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {Icons.check()}
                                To-Do
                            </Link>

                            <Link
                                href="/resources"
                                className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 ${
                                    isActive('/resources')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {Icons.book()}
                                Resources
                            </Link>
                        </div>
                    </div>

                    {/* Right: user menu + mobile hamburger */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow flex items-center justify-center flex-shrink-0">
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
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
                                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
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
                                                href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                                                onClick={() => setShowUserMenu(false)}
                                                className={`flex items-center gap-3 px-4 py-2 transition ${
                                                    lifeFrameUnlocked ? 'hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="text-gray-500">{Icons.clipboard('w-5 h-5')}</span>
                                                <span className="text-sm font-medium">View LifeFrame</span>
                                            </Link>
                                            <Link
                                                href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                                                onClick={() => setShowUserMenu(false)}
                                                className={`flex items-center gap-3 px-4 py-2 transition ${
                                                    lifeFrameUnlocked ? 'hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="text-gray-500">{Icons.map('w-5 h-5')}</span>
                                                <span className="text-sm font-medium">My Roadmap</span>
                                            </Link>
                                            <Link href="/todo" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-green-500">{Icons.check('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-gray-700">To-Do List</span>
                                            </Link>
                                            <Link href="/resources" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-amber-600">{Icons.book('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-gray-700">Resources</span>
                                            </Link>
                                            <Link href="/community" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-blue-500">{Icons.globe('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-gray-700">Community</span>
                                            </Link>
                                            <Link href="/community?tab=partners" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-blue-500">{Icons.globe('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-gray-700">Partners</span>
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 py-2">
                                            <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition">
                                                <span className="text-gray-500">{Icons.gear('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-gray-700">Settings</span>
                                            </Link>
                                            <button
                                                onClick={() => { setShowUserMenu(false); handleSignOut(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-left"
                                            >
                                                <span className="text-red-400">{Icons.logout('w-5 h-5')}</span>
                                                <span className="text-sm font-medium text-red-600">Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Toggle navigation menu"
                        >
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

                {/* Mobile menu — same links as desktop, stacked */}
                {showMobileMenu && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <div className="space-y-1">
                            <Link
                                href="/dashboard"
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    isActive('/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    !lifeFrameUnlocked
                                        ? 'text-gray-400 hover:bg-gray-50'
                                        : isPathPrefix('/workbook')
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">{Icons.clipboard()} LifeFrame</span>
                            </Link>
                            <Link
                                href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    !lifeFrameUnlocked
                                        ? 'text-gray-400 hover:bg-gray-50'
                                        : isActive('/roadmap')
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">{Icons.map()} Roadmap</span>
                            </Link>
                            <Link
                                href="/todo"
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    isActive('/todo') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">{Icons.check()} To-Do</span>
                            </Link>
                            <Link
                                href="/resources"
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    isActive('/resources') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">{Icons.book()} Resources</span>
                            </Link>
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
                            <Link
                                href="/community"
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold transition ${
                                    isActive('/community') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">{Icons.globe()} Community</span>
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setShowMobileMenu(false)}
                                className="block px-4 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition"
                            >
                                <span className="inline-flex items-center gap-2">{Icons.gear()} Settings</span>
                            </Link>
                            <button
                                onClick={() => { setShowMobileMenu(false); handleSignOut(); }}
                                className="w-full text-left px-4 py-3 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition"
                            >
                                <span className="inline-flex items-center gap-2">{Icons.logout()} Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
