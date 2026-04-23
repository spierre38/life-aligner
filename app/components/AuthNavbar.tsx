'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { evaluateLifeFrameCompletion, type LifeFrameCompletion } from '@/lib/lifeframe-completion';
import Wordmark from '@/app/components/Wordmark';

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
                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', currentUser.id);

                if (!mounted) return;
                setCompletion(evaluateLifeFrameCompletion(worksheets ?? []));
            }
        };

        load();

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

    const lifeFrameUnlocked = completion?.allComplete ?? false;
    const nextWorksheetRoute = routeForNextIncomplete(completion);

    if (!user) return null;

    // Shared class helper so desktop and mobile styles stay in sync.
    // Active state = soft gray pill (matches the PDF, not indigo).
    // whitespace-nowrap prevents short labels like "To-Do" from wrapping
    // when the centered nav column gets tight at smaller desktop widths.
    const linkClass = (active: boolean, muted = false) =>
        `px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
            muted
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                : active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Three-zone grid: wordmark | centered nav | user block.
                    grid-cols-3 guarantees the middle column is visually centered
                    regardless of how wide the left or right columns are. */}
                <div className="grid grid-cols-3 items-center h-16">
                    {/* Left: wordmark */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <Wordmark size="sm" />
                        </Link>
                    </div>

                    {/* Middle: centered nav links (desktop only) */}
                    <div className="hidden md:flex items-center justify-center gap-1">
                        <Link href="/dashboard" className={linkClass(isActive('/dashboard'))}>
                            Dashboard
                        </Link>
                        <Link
                            href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                            className={linkClass(isPathPrefix('/workbook'), !lifeFrameUnlocked)}
                            aria-label={lifeFrameUnlocked ? 'View LifeFrame' : 'Continue building your LifeFrame'}
                        >
                            LifeFrame
                        </Link>
                        <Link
                            href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                            className={linkClass(isActive('/roadmap'), !lifeFrameUnlocked)}
                            aria-label={lifeFrameUnlocked ? 'Open Roadmap' : 'Continue building your LifeFrame'}
                        >
                            Roadmap
                        </Link>
                        <Link href="/todo" className={linkClass(isActive('/todo'))}>
                            To-Do
                        </Link>
                        <Link href="/resources" className={linkClass(isActive('/resources'))}>
                            Resources
                        </Link>
                    </div>

                    {/* Right: user block + mobile hamburger */}
                    <div className="flex items-center justify-end gap-3">
                        <div className="hidden md:block relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
                                aria-haspopup="true"
                                aria-expanded={showUserMenu}
                            >
                                <span className="text-sm font-medium text-gray-900 hidden lg:block">
                                    {user?.user_metadata?.full_name || 'User'}
                                </span>
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                                        user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
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
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {user?.user_metadata?.full_name || 'User'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {user?.email}
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                View LifeFrame
                                            </Link>
                                            <Link
                                                href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                My Roadmap
                                            </Link>
                                            <Link
                                                href="/todo"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                To-Do List
                                            </Link>
                                            <Link
                                                href="/resources"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Resources
                                            </Link>
                                            <Link
                                                href="/community"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Community
                                            </Link>
                                            <Link
                                                href="/community?tab=partners"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Partners
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 py-1">
                                            <Link
                                                href="/settings"
                                                onClick={() => setShowUserMenu(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                onClick={() => { setShowUserMenu(false); handleSignOut(); }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Sign Out
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

                {/* Mobile menu */}
                {showMobileMenu && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <div className="space-y-1">
                            <Link href="/dashboard" onClick={() => setShowMobileMenu(false)} className={`block ${linkClass(isActive('/dashboard'))}`}>
                                Dashboard
                            </Link>
                            <Link
                                href={lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute}
                                onClick={() => setShowMobileMenu(false)}
                                className={`block ${linkClass(isPathPrefix('/workbook'), !lifeFrameUnlocked)}`}
                            >
                                LifeFrame
                            </Link>
                            <Link
                                href={lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute}
                                onClick={() => setShowMobileMenu(false)}
                                className={`block ${linkClass(isActive('/roadmap'), !lifeFrameUnlocked)}`}
                            >
                                Roadmap
                            </Link>
                            <Link href="/todo" onClick={() => setShowMobileMenu(false)} className={`block ${linkClass(isActive('/todo'))}`}>
                                To-Do
                            </Link>
                            <Link href="/resources" onClick={() => setShowMobileMenu(false)} className={`block ${linkClass(isActive('/resources'))}`}>
                                Resources
                            </Link>
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
                            <Link href="/community" onClick={() => setShowMobileMenu(false)} className={`block ${linkClass(isActive('/community'))}`}>
                                Community
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setShowMobileMenu(false)}
                                className="block px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Settings
                            </Link>
                            <button
                                onClick={() => { setShowMobileMenu(false); handleSignOut(); }}
                                className="w-full text-left px-4 py-2 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
