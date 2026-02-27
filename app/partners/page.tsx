'use client';

import { useState, useEffect } from 'react';
import { getUserPartnerships, acceptPartnership, endPartnership } from '@/lib/social';
import { getPartnerNotifications, getPendingCheckIns, markNotificationRead } from '@/lib/accountability';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import UserSearchModal from '@/app/components/accountability/UserSearchModal';
import PartnerProgressModal from '@/app/components/accountability/PartnerProgressModal';
import CheckInModal from '@/app/components/accountability/CheckInModal';
import { formatDistanceToNow } from 'date-fns';

export default function PartnersPage() {
    const [activePartners, setActivePartners] = useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Load partnerships
        const { data: active } = await getUserPartnerships('active');
        setActivePartners(active || []);

        const { data: pending } = await getUserPartnerships('pending');
        setPendingPartners(pending || []);

        // Load notifications
        const { data: notifs } = await getPartnerNotifications(true); // unread only
        setNotifications(notifs || []);

        // Load pending check-ins
        const { data: checkIns } = await getPendingCheckIns();
        setPendingCheckIns(checkIns || []);

        setLoading(false);
    };

    const handleAccept = async (partnershipId: string) => {
        const { error } = await acceptPartnership(partnershipId);
        if (error) {
            alert('Failed to accept partnership');
        } else {
            await loadData();
        }
    };

    const handleEnd = async (partnershipId: string) => {
        if (!confirm('End this partnership?')) return;
        const { error } = await endPartnership(partnershipId);
        if (error) {
            alert('Failed to end partnership');
        } else {
            await loadData();
        }
    };

    const handleNotificationClick = async (notification: any) => {
        await markNotificationRead(notification.id);
        setNotifications(notifications.filter(n => n.id !== notification.id));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading partnerships...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountability Partners</h1>
                            <p className="text-gray-600">Stay motivated together on your journey</p>
                        </div>

                        {/* Notification Badge */}
                        {(notifications.length > 0 || pendingCheckIns.length > 0) && (
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold text-sm">
                                        {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
                                    </div>
                                )}
                                {pendingCheckIns.length > 0 && (
                                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                                        {pendingCheckIns.length} check-in{pendingCheckIns.length > 1 ? 's' : ''} waiting
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Find Partners Button */}
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-8 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-semibold text-lg">Find Accountability Partner</span>
                    </div>
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Pending Requests */}
                        {pendingPartners.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Requests</h2>
                                <div className="space-y-3">
                                    {pendingPartners.map(partnership => (
                                        <div key={partnership.id} className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                                                        {partnership.partner?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-lg">{partnership.partner?.full_name}</p>
                                                        <p className="text-sm text-gray-600">Wants to be your accountability partner</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(partnership.id)}
                                                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleEnd(partnership.id)}
                                                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
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
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Your Partners ({activePartners.length})
                            </h2>

                            {activePartners.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                    <div className="text-6xl mb-4">🤝</div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No partners yet</h3>
                                    <p className="text-gray-600 mb-6">
                                        Find someone to stay accountable with!
                                    </p>
                                    <button
                                        onClick={() => setShowSearchModal(true)}
                                        className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                                    >
                                        Find Partner
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {activePartners.map(partnership => (
                                        <div key={partnership.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
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

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setSelectedPartner(partnership)}
                                                    className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100"
                                                >
                                                    View Progress
                                                </button>
                                                <button
                                                    onClick={() => setShowCheckInModal(true)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100"
                                                >
                                                    Check In
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleEnd(partnership.id)}
                                                className="w-full mt-3 text-gray-500 hover:text-red-600 text-sm"
                                            >
                                                End Partnership
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Notifications & Check-ins */}
                    <div className="space-y-6">
                        {/* Notifications */}
                        {notifications.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    {notifications.slice(0, 5).map(notif => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">
                                                {notif.activity_type.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Check-ins */}
                        {pendingCheckIns.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Pending Check-ins</h3>
                                <div className="space-y-3">
                                    {pendingCheckIns.map(checkIn => (
                                        <div key={checkIn.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <p className="font-semibold text-gray-900 text-sm mb-1">
                                                From {checkIn.from_user?.full_name}
                                            </p>
                                            <p className="text-sm text-gray-700 mb-2">{checkIn.message}</p>
                                            <button className="text-xs text-purple-600 font-semibold hover:text-purple-700">
                                                Respond →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

            {showCheckInModal && activePartners[0] && (
                <CheckInModal
                    partnership={activePartners[0]}
                    onClose={() => setShowCheckInModal(false)}
                    onSent={() => {
                        setShowCheckInModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
