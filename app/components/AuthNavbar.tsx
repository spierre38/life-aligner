'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { evaluateLifeFrameCompletion, type LifeFrameCompletion } from '@/lib/lifeframe-completion';
import { getUrgentTodoCount } from '@/lib/todos';
import Wordmark from '@/app/components/Wordmark';
import { useTheme } from '@/app/components/ThemeProvider';

// Canonical order: Values → Interests → Life Categories.
function routeForNextIncomplete(completion: LifeFrameCompletion | null): string {
    if (!completion) return '/workbook/values';
    switch (completion.nextIncomplete) {
        case 'values':         return '/workbook/values';
        case 'interests':      return '/workbook/interests';
        case 'life_categories': return '/workbook/life-categories';
        default:               return '/workbook/lifeframe';
    }
}

// ─── Theme Toggle Icon ──────────────────────────────────────────────────────
function ThemeToggle() {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
            }}
        >
            {isDark ? (
                // Sun icon
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            ) : (
                // Moon icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}

// Inline toggle row for the mobile account sheet
function ThemeToggleMobileRow() {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <span className="w-5 h-5 flex items-center justify-center text-white/80">
                {isDark ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </span>
            <span className="text-sm font-medium text-white/80">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            {/* Toggle pill */}
            <div
                className="ml-auto w-10 h-5 rounded-full relative transition-all duration-300"
                style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.8)' }}
            >
                <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: isDark ? '2px' : '22px' }}
                />
            </div>
        </button>
    );
}

export default function AuthNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { isDark } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
    const [completion, setCompletion] = useState<LifeFrameCompletion | null>(null);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!mounted) return;
            setUser(currentUser);

            if (currentUser) {
                // Fetch avatar and workbook data in parallel
                const [worksheetsResult, profileResult] = await Promise.all([
                    supabase.from('workbook_entries').select('category, content').eq('user_id', currentUser.id),
                    supabase.from('profiles').select('avatar_url').eq('id', currentUser.id).single(),
                ]);

                if (!mounted) return;
                setCompletion(evaluateLifeFrameCompletion(worksheetsResult.data ?? []));
                if (profileResult.data?.avatar_url) setAvatarUrl(profileResult.data.avatar_url);
                else setAvatarUrl(null);
            }
        };

        load();

        // Load urgent task count for bell badge
        getUrgentTodoCount().then(setUrgentCount).catch(() => {});

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setUser(session?.user ?? null);
            if (!session?.user) { setCompletion(null); setAvatarUrl(null); }
            else load();
        });

        // Re-fetch avatar when profiles table changes (e.g. after saving in Settings)
        const profileChannel = supabase
            .channel('navbar-profile-watch')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
                supabase.auth.getUser().then(({ data: { user: u } }) => {
                    if (!u || !mounted) return;
                    supabase.from('profiles').select('avatar_url').eq('id', u.id).single()
                        .then(({ data }) => { if (mounted) setAvatarUrl(data?.avatar_url ?? null); });
                });
            })
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
            supabase.removeChannel(profileChannel);
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

    const linkClass = (active: boolean, muted = false) =>
        `px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 tracking-tight ${
            muted
                ? 'opacity-35 cursor-default'
                : active
                    ? isDark ? 'bg-white/10 text-white' : 'bg-black/[0.07] text-neutral-900 font-semibold'
                    : isDark ? 'text-white/65 hover:text-white hover:bg-white/06' : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]'
        }`;

    const navBg = isDark ? 'rgba(5,5,5,0.85)' : 'rgba(255,255,255,0.88)';
    const navBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

    return (
        <>
        <nav
            className="sticky top-0 z-50 backdrop-blur-xl"
            style={{
                background: navBg,
                borderBottom: `1px solid ${navBorder}`,
                paddingTop: 'env(safe-area-inset-top)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Three-zone grid: wordmark | centered nav | user block */}
                <div className="grid grid-cols-3 items-center h-16">

                    {/* Left: wordmark */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <Wordmark size="sm" colorClassName={isDark ? 'text-white' : 'text-neutral-900'} />
                        </Link>
                    </div>

                    {/* Middle: centered nav links (desktop only) */}
                    <div className="hidden md:flex items-center justify-center gap-0.5">
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
                        <Link
                            href={lifeFrameUnlocked ? '/reflections' : nextWorksheetRoute}
                            className={linkClass(isActive('/reflections'), !lifeFrameUnlocked)}
                            aria-label="Life Chapters — your completed goals"
                        >
                            Chapters
                        </Link>

                    </div>

                    {/* Right: theme toggle (desktop) + bell + user block */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        {/* Theme toggle — desktop only, saves space on mobile */}
                        <div className="hidden sm:block">
                            <ThemeToggle />
                        </div>

                        {/* Notification bell */}
                        <Link
                            href="/todo"
                            id="inbox-bell-btn"
                            aria-label={urgentCount > 0 ? `${urgentCount} urgent tasks` : 'Life Inbox'}
                            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                                color: urgentCount > 0 ? '#f97316' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.65)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {urgentCount > 0 && (
                                <span
                                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                                    style={{ background: '#f97316', color: 'white' }}
                                >
                                    {urgentCount > 9 ? '9+' : urgentCount}
                                </span>
                            )}
                        </Link>

                        {/* Desktop user menu */}
                        <div className="hidden md:block relative">
                            <button
                                id="user-menu-btn"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200"
                                style={{ background: showUserMenu ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent' }}
                                aria-haspopup="true"
                                aria-expanded={showUserMenu}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = showUserMenu ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent'}
                            >
                                <span className={`text-sm font-medium hidden lg:block tracking-tight ${isDark ? 'text-white/80' : 'text-neutral-800'}`}>
                                    {user?.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                                </span>
                                {/* Avatar */}
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0"
                                    style={{
                                        background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(255,45,153,0.9) 0%, rgba(0,212,255,0.9) 100%)',
                                    }}
                                >
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                                        user?.email?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''} ${isDark ? 'text-white/40' : 'text-neutral-400'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                    <div
                                        className="absolute right-0 mt-2 w-60 rounded-2xl py-2 z-50"
                                        style={{
                                            background: isDark ? '#111111' : '#FFFFFF',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 20px 48px rgba(0,0,0,0.12)',
                                        }}
                                    >
                                        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                {user?.user_metadata?.full_name || 'User'}
                                            </div>
                                            <div className={`text-xs truncate mt-0.5 ${isDark ? 'text-white/40' : 'text-neutral-500'}`}>
                                                {user?.email}
                                            </div>
                                        </div>

                                        {[
                                            { href: lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute, label: 'View LifeFrame' },
                                            { href: lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute, label: 'My Roadmap' },
                                            { href: lifeFrameUnlocked ? '/reflections' : nextWorksheetRoute, label: 'Life Chapters' },
                                            { href: '/todo', label: 'To-Do List' },
                                            { href: '/resources', label: 'Resources & Videos' },
                                            { href: '/help', label: 'Get Help' },
                                        ].map(item => (
                                            <Link
                                                key={item.href + item.label}
                                                href={item.href}
                                                onClick={() => setShowUserMenu(false)}
                                                className={`block px-4 py-2.5 text-sm transition-colors duration-150 ${isDark ? 'text-white/70 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'}`}
                                                style={{ letterSpacing: '-0.01em' }}
                                                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}

                                        <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, marginTop: '4px', paddingTop: '4px' }}>
                                            <Link
                                                href="/settings"
                                                onClick={() => setShowUserMenu(false)}
                                                className={`block px-4 py-2.5 text-sm ${isDark ? 'text-white/70 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'}`}
                                                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                onClick={() => { setShowUserMenu(false); handleSignOut(); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:text-red-600 transition-colors duration-150"
                                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile avatar — opens bottom sheet */}
                        <button
                            id="mobile-user-menu-btn"
                            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 transition-all active:scale-90 overflow-hidden"
                            style={{
                                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(255,45,153,0.9) 0%, rgba(0,212,255,0.9) 100%)',
                            }}
                            onClick={() => setShowMobileUserMenu(true)}
                            aria-label="Account menu"
                        >
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                                user?.email?.[0]?.toUpperCase() || 'U'
                            )}
                        </button>

                        {/* Mobile hamburger — hidden: bottom nav handles mobile */}
                    </div>
                </div>

                {/* Mobile menu — replaced by MobileBottomNav */}
            </div>
        </nav>

        {/* Mobile user bottom sheet — MUST be outside <nav> because backdrop-blur
            on nav creates a fixed-position containing block, trapping children */}
        {showMobileUserMenu && (
            <div
                className="fixed inset-0 z-[60] flex items-end md:hidden"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
                onClick={() => setShowMobileUserMenu(false)}
            >
                <div
                    className="w-full rounded-t-3xl py-6 px-5 space-y-2"
                    style={{
                        background: '#0f0f14',
                        border: '1px solid rgba(255,255,255,0.08)',
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Drag handle */}
                    <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                    {/* User info */}
                    <div className="flex items-center gap-3 px-1 mb-5">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden"
                            style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(255,45,153,0.9) 0%, rgba(0,212,255,0.9) 100%)' }}
                        >
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Nav rows */}
                    {[
                        {
                            href: lifeFrameUnlocked ? '/workbook/lifeframe' : nextWorksheetRoute,
                            label: 'View LifeFrame',
                            icon: (
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            ),
                        },
                        {
                            href: lifeFrameUnlocked ? '/roadmap' : nextWorksheetRoute,
                            label: 'My Roadmap',
                            icon: (
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            ),
                        },
                        {
                            href: '/resources',
                            label: 'Resources & Videos',
                            icon: (
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            ),
                        },
                        {
                            href: '/help',
                            label: 'Get Help',
                            icon: (
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                        },
                        {
                            href: '/settings',
                            label: 'Settings',
                            icon: (
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            ),
                        },
                    ].map(item => (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            onClick={() => setShowMobileUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="text-sm font-medium text-white/80">{item.label}</span>
                            <svg className="w-4 h-4 ml-auto text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    ))}

                    <div className="pt-2">
                        {/* Theme toggle row */}
                        <ThemeToggleMobileRow />

                        <button
                            onClick={() => { setShowMobileUserMenu(false); handleSignOut(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] mt-2"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                        >
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium text-red-400">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}
