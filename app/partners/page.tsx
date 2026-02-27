'use client';

import { useState, useEffect } from 'react';
import { getUserPartnerships, acceptPartnership, endPartnership } from '@/lib/social';
import { getPartnerNotifications, getPendingCheckIns, getCheckIns, markNotificationRead } from '@/lib/accountability';
import { showToast } from '@/lib/toast';
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
            showToast.success('Partnership accepted! 🎉');
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
        showToast.info('Notification marked as read');
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'goal_completed': return '🎯';
            case 'milestone_posted': return '🎉';
            case 'roadmap_updated': return '📝';
            case 'check_in': return '💬';
            default: return '✨';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading partnerships...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Accountability Partners</h1>
                            <p className="text-gray-600">Stay motivated together on your journey</p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-3">
                            {notifications.length > 0 && (
                                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold text-sm flex items-center gap-2 animate-pulse">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    {notifications.length} new
                                </div>
                            )}
                            {allCheckIns.length > 0 && (
                                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold text-sm flex items-center gap-2">
                                    💬 {allCheckIns.length} waiting
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Find Partners CTA */}
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8 hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.01]"
                >
                    <div className="flex items-center justify-center gap-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div className="text-left">
                            <p className="font-bold text-xl">Find Accountability Partner</p>
                            <p className="text-white/90">Search for someone to stay accountable with</p>
                        </div>
                    </div>
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Pending Check-ins */}
                        {allCheckIns.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        💬 Pending Check-ins
                                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                                            {allCheckIns.length}
                                        </span>
                                    </h2>
                                    {allCheckIns.length > 3 && (
                                        <button
                                            onClick={() => setExpandedCheckIns(!expandedCheckIns)}
                                            className="text-purple-600 font-semibold hover:text-purple-700"
                                        >
                                            {expandedCheckIns ? 'Show Less' : `Show All (${allCheckIns.length})`}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {(expandedCheckIns ? allCheckIns : allCheckIns.slice(0, 3)).map((checkIn, index) => (
                                        <div
                                            key={checkIn.id}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <CheckInCard
                                                checkIn={checkIn}
                                                onResponded={() => loadData()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Requests */}
                        {pendingPartners.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">⏳ Pending Requests</h2>
                                <div className="space-y-4">
                                    {pendingPartners.map((partnership, index) => (
                                        <div
                                            key={partnership.id}
                                            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg animate-fade-in-up"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                        {partnership.partner?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-xl">{partnership.partner?.full_name}</p>
                                                        <p className="text-gray-600">Wants to be your accountability partner</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleAccept(partnership.id)}
                                                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 hover:shadow-lg transition-all transform hover:scale-105"
                                                    >
                                                        ✓ Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleEnd(partnership.id)}
                                                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Partners */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                🤝 Your Partners
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                    {activePartners.length}
                                </span>
                            </h2>

                            {activePartners.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
                                    <div className="text-8xl mb-6">🤝</div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-3">No partners yet</h3>
                                    <p className="text-gray-600 mb-8 text-lg">
                                        Find someone to stay accountable with!
                                    </p>
                                    <button
                                        onClick={() => setShowSearchModal(true)}
                                        className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
                                    >
                                        Find Partner
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {activePartners.map((partnership, index) => (
                                        <div
                                            key={partnership.id}
                                            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] animate-fade-in-up"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                        {partnership.partner?.avatar_url ? (
                                                            <Image
                                                                src={partnership.partner.avatar_url}
                                                                alt={partnership.partner.full_name}
                                                                width={64}
                                                                height={64}
                                                                className="rounded-full"
                                                            />
                                                        ) : (
                                                            partnership.partner?.full_name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg">
                                                            {partnership.partner?.full_name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">Accountability Partner</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <button
                                                    onClick={() => setSelectedPartner(partnership)}
                                                    className="px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-semibold hover:bg-purple-100 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    Progress
                                                </button>
                                                <button
                                                    onClick={() => setCheckInPartnership(partnership)}
                                                    className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                                >
                                                    💬 Check In
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleEnd(partnership.id)}
                                                className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
                                            >
                                                End Partnership
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Activity */}
                    <div className="space-y-6">
                        {/* Recent Activity */}
                        {notifications.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    🔔 Recent Activity
                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                                        {notifications.length}
                                    </span>
                                </h3>
                                <div className="space-y-3">
                                    {notifications.slice(0, 5).map((notif, index) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="w-full text-left p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all transform hover:scale-[1.02] animate-fade-in-up"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{getActivityIcon(notif.activity_type)}</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {notif.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border border-purple-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-3">💡 Partnership Tips</h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Check in weekly with your partner
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Share wins and celebrate together
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Be honest about challenges
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    View each other&apos;s progress regularly
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showSearchModal && (
                <UserSearchModal
                    onClose={() => setShowSearchModal(false)}
                    onPartnerRequested={() => {
                        setShowSearchModal(false);
                        loadData();
                    }}
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
                    onSent={() => {
                        setCheckInPartnership(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
