'use client';

import { useState, useEffect } from 'react';
import { getCommunityFeed, deletePost } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import Link from 'next/link';
import PostCard from '@/app/components/social/PostCard';
import CreatePostModal from '@/app/components/social/CreatePostModal';
import CommentsModal from '@/app/components/social/CommentsModal';

export default function CommunityPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'milestone' | 'goal' | 'update' | 'win'>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadUserAndPosts();
    }, []);

    const loadUserAndPosts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        await loadPosts();
    };

    const loadPosts = async () => {
        setLoading(true);
        const { data, error } = await getCommunityFeed(50);
        if (error) {
            showToast.error('Failed to load feed');
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
        showToast.success('Feed refreshed!');
    };

    const handlePostCreated = (newPost: any) => {
        setPosts([newPost, ...posts]);
        setShowCreateModal(false);
        showToast.success('Post created!');
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        showToast.loading('Deleting post...');
        const { error } = await deletePost(postId);
        if (error) {
            showToast.error('Failed to delete post');
        } else {
            setPosts(posts.filter(p => p.id !== postId));
            showToast.success('Post deleted');
        }
    };

    const filteredPosts = filter === 'all'
        ? posts
        : posts.filter(p => p.post_type === filter);

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Loading community</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">

            {/* ── Sticky Header ────────────────────────── */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-gray-200/60 shadow-sm">
                <div className="max-w-3xl mx-auto px-4">

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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">Community</h1>
                                <p className="text-xs text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''} shared</p>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                            title="Refresh feed"
                        >
                            <svg className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* ── Create Post CTA ────────────────────── */}
                {currentUserId ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
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
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Join the Community</h3>
                            <p className="mb-6 text-white/80">Sign in to share your journey and connect with others</p>
                            <a
                                href="/login"
                                className="inline-block px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105"
                            >
                                Sign In
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Category Cards ─────────────────────── */}
                <div className="grid grid-cols-5 gap-3">
                    {[
                        {
                            value: 'all', label: 'All',
                            count: posts.length,
                            bgColor: 'bg-purple-50 border-purple-200',
                            activeColor: 'bg-purple-600',
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            ),
                        },
                        {
                            value: 'milestone', label: 'Milestones',
                            count: posts.filter(p => p.post_type === 'milestone').length,
                            bgColor: 'bg-amber-50 border-amber-200',
                            activeColor: 'bg-amber-500',
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                                </svg>
                            ),
                        },
                        {
                            value: 'goal', label: 'Goals',
                            count: posts.filter(p => p.post_type === 'goal').length,
                            bgColor: 'bg-emerald-50 border-emerald-200',
                            activeColor: 'bg-emerald-500',
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                </svg>
                            ),
                        },
                        {
                            value: 'update', label: 'Updates',
                            count: posts.filter(p => p.post_type === 'update').length,
                            bgColor: 'bg-blue-50 border-blue-200',
                            activeColor: 'bg-blue-500',
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            ),
                        },
                        {
                            value: 'win', label: 'Wins',
                            count: posts.filter(p => p.post_type === 'win').length,
                            bgColor: 'bg-rose-50 border-rose-200',
                            activeColor: 'bg-rose-500',
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.77 1.522m3.77-1.522a48.454 48.454 0 01-7.54 0" />
                                </svg>
                            ),
                        },
                    ].map(({ value, label, count, icon, bgColor, activeColor }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value as any)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:shadow-md ${filter === value
                                    ? `${activeColor} text-white border-transparent shadow-lg`
                                    : `${bgColor} text-gray-700 hover:scale-[1.03]`
                                }`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${filter === value ? 'bg-white/20' : 'bg-white/80'}`}>
                                {icon}
                            </div>
                            <span className="text-xs font-semibold leading-tight">{label}</span>
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filter === value ? 'bg-white/20' : 'bg-white'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Posts Feed ──────────────────────────── */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}
                            </h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                {currentUserId ? 'Be the first to share your journey!' : 'Sign in to start sharing!'}
                            </p>
                            {currentUserId && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    Create First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPosts.map((post, index) => (
                            <div
                                key={post.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <PostCard
                                    post={post}
                                    currentUserId={currentUserId || undefined}
                                    onCommentClick={() => setSelectedPostId(post.id)}
                                    onDelete={() => handleDeletePost(post.id)}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Load More */}
                {filteredPosts.length >= 20 && (
                    <div className="text-center pt-2">
                        <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all">
                            Load More Posts
                        </button>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onPostCreated={handlePostCreated}
                />
            )}
            {selectedPostId && (
                <CommentsModal
                    postId={selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                />
            )}
        </div>
    );
}
