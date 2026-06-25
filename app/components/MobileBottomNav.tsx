'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUrgentTodoCount } from '@/lib/todos';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    {
        href: '/dashboard',
        label: 'Home',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        href: '/roadmap',
        label: 'Roadmap',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" fill={active ? 'white' : 'currentColor'} stroke="none" />
                {!active && <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />}
                {!active && <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />}
                {!active && <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />}
                {!active && <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />}
            </svg>
        ),
    },
    {
        href: '/todo',
        label: 'Inbox',
        badge: true,
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                {active
                    ? <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" fill="currentColor" />
                    : <>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </>
                }
            </svg>
        ),
    },
    {
        href: '/reflections',
        label: 'Chapters',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
];

// ─── Pages that should NOT show the bottom nav ─────────────────────────────────

const HIDDEN_PREFIXES = [
    '/workbook/',
    '/onboarding',
    '/login',
    '/signup',
    '/',
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        getUrgentTodoCount().then(setUrgentCount).catch(() => {});
    }, [pathname]); // refresh badge when route changes

    // Hide on workbook / auth pages
    const hidden = HIDDEN_PREFIXES.some(p => {
        if (p === '/') return pathname === '/';
        return pathname?.startsWith(p);
    });

    if (hidden) return null;

    return (
        <>
            {/* Spacer so page content isn't hidden behind nav */}
            <div className="md:hidden h-20" aria-hidden="true" />

            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50"
                aria-label="Mobile navigation"
                style={{
                    background: 'rgba(8,8,8,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div className="flex items-center justify-around px-2 h-16">
                    {NAV_ITEMS.map(item => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname?.startsWith(item.href) ?? false;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-150 active:scale-90"
                                style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)' }}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {/* Icon with active indicator dot */}
                                <div className="relative">
                                    {item.icon(isActive)}
                                    {/* Urgent badge on Inbox */}
                                    {item.badge && urgentCount > 0 && (
                                        <span
                                            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                                            style={{ background: '#f97316', color: 'white' }}
                                        >
                                            {urgentCount > 9 ? '9+' : urgentCount}
                                        </span>
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className="text-[10px] font-medium leading-none transition-all duration-150"
                                    style={{
                                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)',
                                        fontFamily: 'var(--font-primary)',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {item.label}
                                </span>

                                {/* Active underline dot */}
                                {isActive && (
                                    <span
                                        className="absolute top-2 w-1 h-1 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.5)' }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
