'use client';

import { useState } from 'react';
import { searchUsers } from '@/lib/accountability';
import { createPartnership } from '@/lib/social';
import Image from 'next/image';

interface UserSearchModalProps {
    onClose: () => void;
    onPartnerRequested: () => void;
}

export default function UserSearchModal({ onClose, onPartnerRequested }: UserSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState<string | null>(null);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        const { data, error } = await searchUsers(searchQuery);

        if (error) {
            console.error('Search error:', error);
        } else {
            setResults(data || []);
        }

        setSearching(false);
    };

    const handleSendRequest = async (userId: string) => {
        setSending(userId);

        const { error } = await createPartnership(userId);

        if (error) {
            console.error('Partnership request error:', error);
            alert('Failed to send request. They may already be your partner!');
        } else {
            alert('Partnership request sent!');
            onPartnerRequested();
        }

        setSending(null);
    };

    // Debounce search
    const handleQueryChange = (value: string) => {
        setQuery(value);

        // Debounce search by 500ms
        const timer = setTimeout(() => {
            handleSearch(value);
        }, 500);

        return () => clearTimeout(timer);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Find Accountability Partner</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                            autoFocus
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {!query ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-500">Search for users by name</p>
                        </div>
                    ) : results.length === 0 && !searching ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-600">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {results.map(user => (
                                <div key={user.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {user.avatar_url ? (
                                                <Image
                                                    src={user.avatar_url}
                                                    alt={user.full_name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                user.full_name?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                Joined {new Date(user.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSendRequest(user.id)}
                                        disabled={sending === user.id}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        {sending === user.id ? 'Sending...' : 'Send Request'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
