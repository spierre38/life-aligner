'use client';

// app/dashboard/admin/layout.tsx
// Admin panel layout with sidebar navigation
// Only accessible to users with role='admin'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Nav items for admin sidebar
const NAV_ITEMS = [
    {
        href: '/dashboard/admin',
        label: 'Overview',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        exact: true,
    },
    {
        href: '/dashboard/admin/users',
        label: 'Users',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        href: '/dashboard/admin/workbooks',
        label: 'Workbook Stats',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        href: '/dashboard/admin/activity',
        label: 'Activity',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminName, setAdminName] = useState('Admin');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();

                // Double check role (middleware handles this too, but belt-and-suspenders)
                if (!profile || profile.role !== 'admin') {
                    router.push('/dashboard?error=unauthorized');
                    return;
                }

                setAdminName(profile.full_name || user.email || 'Admin');
                setLoading(false);
            } catch (error) {
                console.error('Admin layout error:', error);
                router.push('/login');
            }
        };

        checkAdmin();
    }, [router, supabase]);

    const isActive = (item: typeof NAV_ITEMS[0]) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">LifeAligner</p>
                            <p className="text-xs text-purple-400 font-medium">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item)
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <span className={`transition-transform duration-200 ${isActive(item) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive(item) && (
                                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-4 border-t border-gray-800 mt-auto absolute bottom-0 left-0 right-0">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{adminName}</p>
                            <p className="text-xs text-purple-400">Administrator</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm mb-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 z-10">
                    <div className="flex items-center justify-between px-6 py-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Page title */}
                        <h1 className="text-sm font-medium text-gray-400">
                            {NAV_ITEMS.find(item => isActive(item))?.label ?? 'Admin'}
                        </h1>

                        {/* Live indicator */}
                        <div className="flex items-center gap-2 text-xs text-green-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Live
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}