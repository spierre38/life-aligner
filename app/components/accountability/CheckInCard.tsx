'use client';

import { useState } from 'react';
import { respondToCheckIn } from '@/lib/accountability';
import { showToast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

interface CheckInCardProps {
    checkIn: {
        id: string;
        message: string;
        created_at: string;
        from_user?: {
            id: string;
            full_name: string;
            avatar_url?: string;
        };
    };
    onResponded: () => void;
}

export default function CheckInCard({ checkIn, onResponded }: CheckInCardProps) {
    const [response, setResponse] = useState('');
    const [showReply, setShowReply] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!response.trim() || submitting) return;

        setSubmitting(true);

        const { error } = await respondToCheckIn(checkIn.id, response.trim());

        if (error) {
            console.error('Response error:', error);
            showToast.error('Failed to send response');
        } else {
            showToast.success('Response sent! 💬');
            onResponded();
        }

        setSubmitting(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                    {checkIn.from_user?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="font-bold text-gray-900">
                                {checkIn.from_user?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })}
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            Check-in
                        </span>
                    </div>

                    {/* Message */}
                    <p className="text-gray-700 leading-relaxed mb-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                        {checkIn.message}
                    </p>

                    {/* Reply Area */}
                    {!showReply ? (
                        <button
                            onClick={() => setShowReply(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-semibold hover:bg-purple-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Reply
                        </button>
                    ) : (
                        <form onSubmit={handleRespond} className="space-y-3">
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Write your response..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                                autoFocus
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReply(false);
                                        setResponse('');
                                    }}
                                    className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!response.trim() || submitting}
                                    className="px-5 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
