'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Social / Community
import { getCommunityFeed, deletePost, getUserPartnerships, acceptPartnership, endPartnership } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import PostCard from '@/app/components/social/PostCard';
import CreatePostModal from '@/app/components/social/CreatePostModal';
import CommentsModal from '@/app/components/social/CommentsModal';

// Accountability / Partners
import { getPartnerNotifications, getPendingCheckIns, markNotificationRead } from '@/lib/accountability';
import UserSearchModal from '@/app/components/accountability/UserSearchModal';
import PartnerProgressModal from '@/app/components/accountability/PartnerProgressModal';
import CheckInModal from '@/app/components/accountability/CheckInModal';
import CheckInCard from '@/app/components/accountability/CheckInCard';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ──────────────────────────────────────────────
type Tab = 'feed' | 'partners';
type PostFilter = 'all' | 'milestone' | 'goal' | 'update' | 'win' | 'insight' | 'request';

// ─── Icons (inline SVGs) ────────────────────────────────
const icons = {
    back: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    ),
    community: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
    ),
    partners: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    addUser: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
    ),
    refresh: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
    ),
    plus: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    ),
    search: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    ),
    bell: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    ),
    chat: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
    ),
    clock: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    chart: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    check: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    ),
    bulb: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
    ),
    sparkle: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
    ),
    flag: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
    ),
    rocket: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
    ),
    pencil: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    ),
    trophy: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.77 1.522m3.77-1.522a48.454 48.454 0 01-7.54 0" />
        </svg>
    ),
    grid: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
    ),
};

// activity icon helper
function getActivityIcon(type: string) {
    switch (type) {
        case 'goal_completed':
            return <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'milestone_posted':
            return <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>;
        case 'check_in':
            return <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
        default:
            return <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
    }
}

// ─── Component ──────────────────────────────────────────
export default function SocialHubPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Active tab
    const initialTab = (searchParams.get('tab') as Tab) || 'feed';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    // Auth
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Community state
    const [posts, setPosts] = useState<any[]>([]);
    const [filter, setFilter] = useState<PostFilter>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Partners state
    const [activePartners, setActivePartners] = useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [allCheckIns, setAllCheckIns] = useState<any[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [checkInPartnership, setCheckInPartnership] = useState<any>(null);
    const [expandedCheckIns, setExpandedCheckIns] = useState(false);

    // Global
    const [loading, setLoading] = useState(true);

    // ── Data loading ────────
    const loadAll = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        const [feedRes, activeRes, pendingRes, notifsRes, checkInsRes] = await Promise.all([
            getCommunityFeed(50),
            getUserPartnerships('active'),
            getUserPartnerships('pending'),
            getPartnerNotifications(true),
            getPendingCheckIns(),
        ]);

        setPosts(feedRes.data || []);
        setActivePartners(activeRes.data || []);
        setPendingPartners(pendingRes.data || []);
        setNotifications(notifsRes.data || []);
        setAllCheckIns(checkInsRes.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ── Tab switching ────────
    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        router.replace(tab === 'feed' ? '/community' : '/community?tab=partners', { scroll: false });
    };

    // ── Feed handlers ────────
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
        showToast.success('Refreshed!');
    };

    const handlePostCreated = (newPost: any) => {
        setPosts([newPost, ...posts]);
        setShowCreateModal(false);
        showToast.success('Post shared!');
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Delete this post?')) return;
        showToast.loading('Deleting...');
        const { error } = await deletePost(postId);
        if (error) showToast.error('Failed to delete');
        else { setPosts(posts.filter(p => p.id !== postId)); showToast.success('Deleted'); }
    };

    // ── Partner handlers ────────
    const handleAccept = async (id: string) => {
        const { error } = await acceptPartnership(id);
        if (error) showToast.error('Failed to accept');
        else { showToast.success('Partnership accepted!'); await loadAll(); }
    };

    const handleEnd = async (id: string) => {
        if (!confirm('End this partnership?')) return;
        const { error } = await endPartnership(id);
        if (error) showToast.error('Failed to end partnership');
        else { showToast.info('Partnership ended'); await loadAll(); }
    };

    const handleNotifClick = async (n: any) => {
        await markNotificationRead(n.id);
        setNotifications(prev => prev.filter(x => x.id !== n.id));
    };

    // ── Derived ────────
    const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.post_type === filter);

    const categories: { value: PostFilter; label: string; icon: React.ReactNode; bg: string; active: string }[] = [
        { value: 'all', label: 'All', icon: icons.grid, bg: 'bg-purple-50 border-purple-200', active: 'bg-purple-600' },
        { value: 'milestone', label: 'Milestones', icon: icons.flag, bg: 'bg-amber-50 border-amber-200', active: 'bg-amber-500' },
        { value: 'insight', label: 'Insights', icon: icons.bulb, bg: 'bg-blue-50 border-blue-200', active: 'bg-blue-500' },
        { value: 'request', label: 'Help Needed', icon: icons.search, bg: 'bg-rose-50 border-rose-200', active: 'bg-rose-500' },
        { value: 'win', label: 'Wins', icon: icons.trophy, bg: 'bg-rose-50 border-rose-200', active: 'bg-rose-500' },
    ];

    // ────────────────────────────────────────────────────────
    // LOADING
    // ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
                    </div>
                    <p className="text-gray-400 font-medium text-sm tracking-wider uppercase">Loading social hub</p>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">

            {/* ── HEADER ──────────────────────────────── */}
            <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="pt-3 pb-1">
                        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors group">
                            <span className="transition-transform group-hover:-translate-x-0.5">{icons.back}</span>
                            Dashboard
                        </Link>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
                                {icons.community}
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Social Hub</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    {notifications.length}
                                </span>
                            )}
                            {allCheckIns.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                                    {icons.chat} {allCheckIns.length}
                                </span>
                            )}
                            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Refresh">
                                <span className={refreshing ? 'animate-spin inline-block' : ''}>{icons.refresh}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── 3-COL LAYOUT ────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex gap-6">

                    {/* ─── LEFT SIDEBAR ────────────────────── */}
                    <aside className="hidden lg:block w-56 flex-shrink-0">
                        <div className="sticky top-32 space-y-6">

                            {/* Nav pills */}
                            <nav className="bg-white rounded-2xl border border-gray-200 p-3 space-y-1">
                                <button
                                    onClick={() => switchTab('feed')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'feed'
                                        ? 'bg-purple-50 text-purple-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {icons.community}
                                    Community Feed
                                </button>
                                <button
                                    onClick={() => switchTab('partners')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'partners'
                                        ? 'bg-purple-50 text-purple-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {icons.partners}
                                    Partners
                                    {(pendingPartners.length + allCheckIns.length) > 0 && (
                                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                                            {pendingPartners.length + allCheckIns.length}
                                        </span>
                                    )}
                                </button>
                            </nav>

                            {/* Category filters (feed only) */}
                            {activeTab === 'feed' && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Categories</h3>
                                    {categories.map(c => {
                                        const count = c.value === 'all' ? posts.length : posts.filter(p => p.post_type === c.value).length;
                                        return (
                                            <button
                                                key={c.value}
                                                onClick={() => setFilter(c.value)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${filter === c.value
                                                    ? 'bg-purple-50 text-purple-700 font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${filter === c.value ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                    {c.icon}
                                                </span>
                                                <span className="flex-1 text-left">{c.label}</span>
                                                {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Quick tips (partners only) */}
                            {activeTab === 'partners' && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        {icons.bulb} Tips
                                    </h3>
                                    <ul className="space-y-2 text-xs text-gray-600">
                                        {['Check in weekly', 'Celebrate wins together', 'Be honest about challenges', "View each other\u2019s progress"].map(tip => (
                                            <li key={tip} className="flex items-start gap-2">
                                                <span className="text-purple-400 mt-0.5">{icons.check}</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ─── CENTER CONTENT ──────────────────── */}
                    <main className="flex-1 min-w-0 space-y-5">

                        {/* Mobile tab switcher */}
                        <div className="lg:hidden flex bg-white rounded-xl border border-gray-200 p-1">
                            {(['feed', 'partners'] as Tab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => switchTab(tab)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                        ? 'bg-purple-600 text-white shadow'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {tab === 'feed' ? icons.community : icons.partners}
                                    {tab === 'feed' ? 'Feed' : 'Partners'}
                                </button>
                            ))}
                        </div>

                        {/* ──────── FEED TAB ──────── */}
                        {activeTab === 'feed' && (
                            <>
                                {/* Create post CTA */}
                                {currentUserId ? (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                                {icons.plus}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Share an update</p>
                                                <p className="text-sm text-gray-400">Milestone, goal, win, or just checking in</p>
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative text-center">
                                            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-3">{icons.sparkle}</div>
                                            <h3 className="text-xl font-bold mb-1">Join the Community</h3>
                                            <p className="mb-5 text-white/80 text-sm">Sign in to share and connect</p>
                                            <a href="/login" className="inline-block px-6 py-2.5 bg-white text-purple-600 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 text-sm">Sign In</a>
                                        </div>
                                    </div>
                                )}

                                {/* Mobile category chips */}
                                <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {categories.map(c => {
                                        const count = c.value === 'all' ? posts.length : posts.filter(p => p.post_type === c.value).length;
                                        return (
                                            <button
                                                key={c.value}
                                                onClick={() => setFilter(c.value)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === c.value
                                                    ? `${c.active} text-white shadow-md`
                                                    : 'bg-white text-gray-600 border border-gray-200'
                                                    }`}
                                            >
                                                {c.icon} {c.label}
                                                {count > 0 && <span className={`text-xs px-1.5 rounded-full ${filter === c.value ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Posts */}
                                <div className="space-y-4">
                                    {filteredPosts.length === 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}</h3>
                                            <p className="text-gray-400 text-sm mb-5">{currentUserId ? 'Be the first to share!' : 'Sign in to start sharing'}</p>
                                            {currentUserId && (
                                                <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">Create Post</button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredPosts.map((post, i) => (
                                            <div key={post.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                                                <PostCard post={post} currentUserId={currentUserId || undefined} onCommentClick={() => setSelectedPostId(post.id)} onDelete={() => handleDeletePost(post.id)} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* ──────── PARTNERS TAB ──────── */}
                        {activeTab === 'partners' && (
                            <>
                                {/* Find partner CTA */}
                                <button
                                    onClick={() => setShowSearchModal(true)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-5 hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.005] group"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform text-white">{icons.addUser}</div>
                                        <div className="text-left">
                                            <p className="font-bold">Find Accountability Partner</p>
                                            <p className="text-white/80 text-sm">Search for someone to stay accountable with</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Pending check-ins */}
                                {allCheckIns.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">{icons.chat}</span>
                                                Pending Check-ins
                                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">{allCheckIns.length}</span>
                                            </h2>
                                            {allCheckIns.length > 3 && (
                                                <button onClick={() => setExpandedCheckIns(!expandedCheckIns)} className="text-xs text-purple-600 font-semibold hover:text-purple-700">
                                                    {expandedCheckIns ? 'Less' : `All (${allCheckIns.length})`}
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {(expandedCheckIns ? allCheckIns : allCheckIns.slice(0, 3)).map((c, i) => (
                                                <div key={c.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                                    <CheckInCard checkIn={c} onResponded={() => loadAll()} />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Pending requests */}
                                {pendingPartners.length > 0 && (
                                    <section>
                                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">{icons.clock}</span>
                                            Pending Requests
                                        </h2>
                                        <div className="space-y-3">
                                            {pendingPartners.map((p, i) => (
                                                <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg flex items-center justify-center shadow">
                                                            {p.partner?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{p.partner?.full_name}</p>
                                                            <p className="text-xs text-gray-500">Wants to partner up</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAccept(p.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">Accept</button>
                                                        <button onClick={() => handleEnd(p.id)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Decline</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Active partners */}
                                <section>
                                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">{icons.partners}</span>
                                        Your Partners
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{activePartners.length}</span>
                                    </h2>

                                    {activePartners.length === 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-300">{icons.partners}</div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">No partners yet</h3>
                                            <p className="text-gray-400 text-sm mb-5">Find someone to stay accountable with!</p>
                                            <button onClick={() => setShowSearchModal(true)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">Find Partner</button>
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {activePartners.map((p, i) => (
                                                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:border-purple-200 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
                                                            {p.partner?.avatar_url ? (
                                                                <Image src={p.partner.avatar_url} alt={p.partner.full_name} width={48} height={48} className="rounded-full" />
                                                            ) : (
                                                                p.partner?.full_name?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-sm">{p.partner?.full_name}</h3>
                                                            <p className="text-xs text-gray-400">Accountability Partner</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <button onClick={() => setSelectedPartner(p)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors">
                                                            {icons.chart} Progress
                                                        </button>
                                                        <button onClick={() => setCheckInPartnership(p)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                            {icons.chat} Check In
                                                        </button>
                                                    </div>
                                                    <button onClick={() => handleEnd(p.id)} className="w-full text-[11px] text-gray-400 hover:text-red-500 transition-colors pt-1">
                                                        End Partnership
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </main>

                    {/* ─── RIGHT SIDEBAR ───────────────────── */}
                    <aside className="hidden xl:block w-64 flex-shrink-0">
                        <div className="sticky top-32 space-y-5">

                            {/* Notifications / Activity */}
                            {notifications.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        {icons.bell} Activity
                                        <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold">{notifications.length}</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {notifications.slice(0, 5).map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => handleNotifClick(n)}
                                                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                            >
                                                {getActivityIcon(n.activity_type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                                        {n.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats card */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-purple-700">{posts.length}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Posts</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-700">{activePartners.length}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Partners</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-amber-600">{pendingPartners.length}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Pending</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-emerald-600">{allCheckIns.length}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Check-ins</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    {icons.bulb} Getting Started
                                </h3>
                                <ul className="space-y-2 text-xs text-gray-600">
                                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">{icons.check}</span>Share milestones to inspire</li>
                                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">{icons.check}</span>Find an accountability partner</li>
                                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">{icons.check}</span>Check in weekly</li>
                                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">{icons.check}</span>Track each other&apos;s progress</li>
                                </ul>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>

            {/* ── MODALS ───────────────────────────────── */}
            {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={handlePostCreated} />}
            {selectedPostId && <CommentsModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />}
            {showSearchModal && <UserSearchModal onClose={() => setShowSearchModal(false)} onPartnerRequested={() => { setShowSearchModal(false); loadAll(); }} />}
            {selectedPartner && <PartnerProgressModal partner={selectedPartner.partner} onClose={() => setSelectedPartner(null)} />}
            {checkInPartnership && <CheckInModal partnership={checkInPartnership} onClose={() => setCheckInPartnership(null)} onSent={() => { setCheckInPartnership(null); loadAll(); }} />}
        </div>
    );
}
