'use client';

import { useState, useEffect } from 'react';
import { getUserPartnerships, createPartnership, acceptPartnership, endPartnership } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function PartnersPage() {
    const [activePartners, setActivePartners] = useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        loadPartnerships();
    }, []);

    const loadPartnerships = async () => {
        setLoading(true);

        // Load active partnerships
        const { data: active } = await getUserPartnerships('active');
        setActivePartners(active || []);

        // Load pending partnerships
        const { data: pending } = await getUserPartnerships('pending');
        setPendingPartners(pending || []);

        setLoading(false);
    };

    const handleAccept = async (partnershipId: string) => {
        const { error } = await acceptPartnership(partnershipId);

        if (error) {
            console.error('Accept error:', error);
            alert('Failed to accept partnership');
        } else {
            await loadPartnerships();
        }
    };

    const handleEnd = async (partnershipId: string) => {
        if (!confirm('End this partnership?')) return;

        const { error } = await endPartnership(partnershipId);

        if (error) {
            console.error('End error:', error);
            alert('Failed to end partnership');
        } else {
            await loadPartnerships();
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || inviting) return;

        setInviting(true);

        // In a real app, you'd look up user by email
        // For now, this is a placeholder
        alert('Partnership invites coming soon! For now, share your journey link with friends.');

        setInviting(false);
        setShowInviteModal(false);
        setInviteEmail('');
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
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountability Partners</h1>
                    <p className="text-gray-600">Connect with others on their journey to contentment</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Invite Button */}
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-8 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                >
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold text-lg">Invite Accountability Partner</span>
                    </div>
                </button>

                {/* Pending Requests */}
                {pendingPartners.length > 0 && (
                    <div className="mb-8">
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
                                                <p className="font-semibold text-gray-900 text-lg">
                                                    {partnership.partner?.full_name || 'Unknown User'}
                                                </p>
                                                <p className="text-sm text-gray-600">Wants to be your accountability partner</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(partnership.id)}
                                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleEnd(partnership.id)}
                                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
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
                                Accountability partners help you stay motivated and on track
                            </p>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Invite Someone
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
                                                    {partnership.partner?.full_name || 'Unknown User'}
                                                </h3>
                                                <p className="text-sm text-gray-500">Accountability Partner</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors">
                                            View Progress
                                        </button>
                                        <button
                                            onClick={() => handleEnd(partnership.id)}
                                            className="px-4 py-2 text-gray-500 hover:text-red-600 transition-colors"
                                            title="End partnership"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Invite Partner</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleInvite}>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="partner@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {inviting ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
