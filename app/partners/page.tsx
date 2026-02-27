'use client';

import { useState, useEffect } from 'react';
import { getUserPartnerships, acceptPartnership, endPartnership } from '@/lib/social';
import { getPartnerNotifications, getPendingCheckIns, markNotificationRead } from '@/lib/accountability';
import { showToast } from '@/lib/toast';
import Link from 'next/link';
import Image from 'next/image';
import UserSearchModal from '@/app/components/accountability/UserSearchModal';
import PartnerProgressModal from '@/app/components/accountability/PartnerProgressModal';
import CheckInModal from '@/app/components/accountability/CheckInModal';
import CheckInCard from '@/app/components/accountability/CheckInCard';
import { formatDistanceToNow } from 'date-fns';

export default function PartnersPage() {
    const [activePartners, setActivePartners] = useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [allCheckIns, setAllCheckIns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [checkInPartnership, setCheckInPartnership] = useState<any>(null);
    const [expandedCheckIns, setExpandedCheckIns] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [activeRes, pendingRes, notifsRes, checkInsRes] = await Promise.all([
            getUserPartnerships('active'),
            getUserPartnerships('pending'),
            getPartnerNotifications(true),
            getPendingCheckIns()
        ]);
        setActivePartners(activeRes.data || []);
        setPendingPartners(pendingRes.data || []);
        setNotifications(notifsRes.data || []);
        setAllCheckIns(checkInsRes.data || []);
        setLoading(false);
    };

    const handleAccept = async (partnershipId: string) => {
        const { error } = await acceptPartnership(partnershipId);
        if (error) {
            showToast.error('Failed to accept partnership');
        } else {
            showToast.success('Partnership accepted!');
            await loadData();
        }
    };

    const handleEnd = async (partnershipId: string) => {
        if (!confirm('Are you sure you want to end this partnership?')) return;
        const { error } = await endPartnership(partnershipId);
        if (error) {
            showToast.error('Failed to end partnership');
        } else {
            showToast.info('Partnership ended');
            await loadData();
        }
    };

    const handleNotificationClick = async (notification: any) => {
        await markNotificationRead(notification.id);
        setNotifications(notifications.filter(n => n.id !== notification.id));
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'goal_completed':
                return (
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'milestone_posted':
                return (
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                );
            case 'roadmap_updated':
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                );
            case 'check_in':
                return (
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                );
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Loading partnerships</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">

            {/* ── Sticky Header ────────────────────────── */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-gray-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">

                    {/* Back link */}
                    <div className="pt-3 pb-1">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors group"
                        >
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>

                    {/* Title row */}
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">Partners</h1>
                                <p className="text-xs text-gray-500">{activePartners.length} active partner{activePartners.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    {notifications.length}
                                </span>
                            )}
                            {allCheckIns.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                    </svg>
                                    {allCheckIns.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* ── Find Partner CTA ───────────────────── */}
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-8 hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.005] group"
                >
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg">Find Accountability Partner</p>
                            <p className="text-white/80 text-sm">Search for someone to stay accountable with</p>
                        </div>
                    </div>
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* ── Main Content ─────────────────────── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Pending Check-ins */}
                        {allCheckIns.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                            </svg>
                                        </div>
                                        Pending Check-ins
                                        <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">{allCheckIns.length}</span>
                                    </h2>
                                    {allCheckIns.length > 3 && (
                                        <button
                                            onClick={() => setExpandedCheckIns(!expandedCheckIns)}
                                            className="text-sm text-purple-600 font-semibold hover:text-purple-700"
                                        >
                                            {expandedCheckIns ? 'Show Less' : `Show All (${allCheckIns.length})`}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {(expandedCheckIns ? allCheckIns : allCheckIns.slice(0, 3)).map((checkIn, index) => (
                                        <div key={checkIn.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
                                            <CheckInCard checkIn={checkIn} onResponded={() => loadData()} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Pending Requests */}
                        {pendingPartners.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    Pending Requests
                                </h2>
                                <div className="space-y-3">
                                    {pendingPartners.map((partnership, index) => (
                                        <div
                                            key={partnership.id}
                                            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 animate-fade-in-up"
                                            style={{ animationDelay: `${index * 80}ms` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {partnership.partner?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{partnership.partner?.full_name}</p>
                                                        <p className="text-sm text-gray-500">Wants to partner up</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(partnership.id)}
                                                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleEnd(partnership.id)}
                                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active Partners */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                Your Partners
                                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{activePartners.length}</span>
                            </h2>

                            {activePartners.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No partners yet</h3>
                                    <p className="text-gray-500 mb-6 text-sm">Find someone to stay accountable with!</p>
                                    <button
                                        onClick={() => setShowSearchModal(true)}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        Find Partner
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {activePartners.map((partnership, index) => (
                                        <div
                                            key={partnership.id}
                                            className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-purple-200 transition-all animate-fade-in-up"
                                            style={{ animationDelay: `${index * 80}ms` }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                                    {partnership.partner?.avatar_url ? (
                                                        <Image
                                                            src={partnership.partner.avatar_url}
                                                            alt={partnership.partner.full_name}
                                                            width={56}
                                                            height={56}
                                                            className="rounded-full"
                                                        />
                                                    ) : (
                                                        partnership.partner?.full_name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{partnership.partner?.full_name}</h3>
                                                    <p className="text-xs text-gray-500">Accountability Partner</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <button
                                                    onClick={() => setSelectedPartner(partnership)}
                                                    className="px-3 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                                    </svg>
                                                    Progress
                                                </button>
                                                <button
                                                    onClick={() => setCheckInPartnership(partnership)}
                                                    className="px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                                    </svg>
                                                    Check In
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleEnd(partnership.id)}
                                                className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors pt-1"
                                            >
                                                End Partnership
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── Sidebar ──────────────────────────── */}
                    <div className="space-y-6">

                        {/* Recent Activity */}
                        {notifications.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                    </div>
                                    Recent Activity
                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-bold">{notifications.length}</span>
                                </h3>
                                <div className="space-y-2">
                                    {notifications.slice(0, 5).map((notif, index) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors flex items-start gap-3"
                                        >
                                            {getActivityIcon(notif.activity_type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {notif.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tips Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                    </svg>
                                </div>
                                Partnership Tips
                            </h3>
                            <ul className="space-y-2.5 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Check in weekly with your partner
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Share wins and celebrate together
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Be honest about challenges
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    View each other&apos;s progress regularly
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showSearchModal && (
                <UserSearchModal
                    onClose={() => setShowSearchModal(false)}
                    onPartnerRequested={() => { setShowSearchModal(false); loadData(); }}
                />
            )}
            {selectedPartner && (
                <PartnerProgressModal
                    partner={selectedPartner.partner}
                    onClose={() => setSelectedPartner(null)}
                />
            )}
            {checkInPartnership && (
                <CheckInModal
                    partnership={checkInPartnership}
                    onClose={() => setCheckInPartnership(null)}
                    onSent={() => { setCheckInPartnership(null); loadData(); }}
                />
            )}
        </div>
    );
}
