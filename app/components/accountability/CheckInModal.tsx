'use client';

import { useState } from 'react';
import { sendCheckIn } from '@/lib/accountability';

interface CheckInModalProps {
    partnership: {
        id: string;
        partner: {
            id: string;
            full_name: string;
        };
    };
    onClose: () => void;
    onSent: () => void;
}

const CHECK_IN_TEMPLATES = [
    "How's your progress this week?",
    "Just checking in - how are you doing?",
    "Did you complete your goals this week?",
    "Need any support or accountability?",
    "What's one thing you accomplished this week?",
    "How can I help you stay on track?"
];

export default function CheckInModal({ partnership, onClose, onSent }: CheckInModalProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || sending) return;

        setSending(true);

        const { error } = await sendCheckIn(
            partnership.id,
            partnership.partner.id,
            message.trim()
        );

        if (error) {
            console.error('Check-in error:', error);
            alert('Failed to send check-in');
            setSending(false);
        } else {
            onSent();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Send Check-In</h2>
                            <p className="text-gray-600">to {partnership.partner.full_name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSend} className="p-6">
                    {/* Templates */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Quick Templates
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CHECK_IN_TEMPLATES.map((template, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setMessage(template)}
                                    className="px-4 py-3 text-left text-sm bg-gray-50 hover:bg-purple-50 hover:border-purple-300 border border-gray-200 rounded-xl transition-colors"
                                >
                                    {template}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Message */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your check-in message..."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {message.length} characters
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!message.trim() || sending}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Sending...' : 'Send Check-In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
