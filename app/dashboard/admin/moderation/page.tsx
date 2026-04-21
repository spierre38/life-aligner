'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type FlagStatus = 'user_reported' | 'auto_flagged' | 'reviewed_ok' | 'removed';

interface FlaggedItem {
    id: string;
    post_id: string | null;
    content: string;
    reason: string;
    status: FlagStatus;
    context: string;
    created_at: string;
    reported_user: { full_name: string | null; id: string } | null;
    reporter: { full_name: string | null; id: string } | null;
}

const STATUS_CONFIG: Record<FlagStatus, { label: string; color: string }> = {
    user_reported: { label: 'User Report', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    auto_flagged: { label: 'Auto-Flagged', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    reviewed_ok: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
    removed: { label: 'Removed', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdminModerationPage() {
    const [items, setItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FlagStatus | 'all'>('user_reported');
    const [actioning, setActioning] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const query = supabase
            .from('flagged_content')
            .select(`
                id, post_id, content, reason, status, context, created_at,
                reported_user:profiles!flagged_content_user_id_fkey(id, full_name),
                reporter:profiles!flagged_content_reported_by_fkey(id, full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (filter !== 'all') query.eq('status', filter);

        const { data, error } = await query;
        if (!error && data) setItems(data as any);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filter]);

    const handleAction = async (id: string, action: 'reviewed_ok' | 'removed', postId?: string | null) => {
        setActioning(id);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
            .from('flagged_content')
            .update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
            .eq('id', id);

        // If removing, also delete the post
        if (action === 'removed' && postId) {
            await supabase.from('social_posts').delete().eq('id', postId);
        }

        setActioning(null);
        await load();
    };

    const pending = items.filter(i => i.status === 'user_reported' || i.status === 'auto_flagged');

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Content Moderation</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {pending.length} item{pending.length !== 1 ? 's' : ''} pending review
                        </p>
                    </div>
                    <button onClick={load} className="px-4 py-2 bg-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-700 transition">
                        Refresh
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {(['user_reported', 'auto_flagged', 'reviewed_ok', 'removed', 'all'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-16 text-gray-500">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="text-white font-semibold">All clear!</p>
                        <p className="text-gray-400 text-sm mt-1">No flagged content in this category</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => {
                            const cfg = STATUS_CONFIG[item.status];
                            const isPending = item.status === 'user_reported' || item.status === 'auto_flagged';
                            return (
                                <div key={item.id} className={`bg-gray-900 rounded-2xl border p-5 ${isPending ? 'border-amber-800/50' : 'border-gray-800'}`}>
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
                                                {item.context}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    <div className="bg-gray-950 rounded-xl p-4 mb-3 border border-gray-800">
                                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                                        {item.reported_user && (
                                            <span>Author: <span className="text-slate-300 font-medium">{item.reported_user.full_name || 'Unknown'}</span></span>
                                        )}
                                        {item.reporter && (
                                            <span>Reported by: <span className="text-slate-300 font-medium">{item.reporter.full_name || 'Unknown'}</span></span>
                                        )}
                                        {item.reason && (
                                            <span>Reason: <span className="text-amber-300 font-medium">{item.reason}</span></span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(item.id, 'reviewed_ok', item.post_id)}
                                                disabled={actioning === item.id}
                                                className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                ✓ Approve (keep)
                                            </button>
                                            <button
                                                onClick={() => handleAction(item.id, 'removed', item.post_id)}
                                                disabled={actioning === item.id}
                                                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                🗑 Remove post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
