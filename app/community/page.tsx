'use client';

import { useState, useEffect } from 'react';
import { getCommunityFeed, deletePost } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import PostCard from '@/app/components/social/PostCard';
import CreatePostModal from '@/app/components/social/CreatePostModal';
import CommentsModal from '@/app/components/social/CommentsModal';
import Link from 'next/link';

export default function CommunityPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'milestone' | 'goal' | 'update' | 'win'>('all');

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
            console.error('Error loading feed:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const handlePostCreated = (newPost: any) => {
        setPosts([newPost, ...posts]);
        setShowCreateModal(false);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Delete this post?')) return;
        const { error } = await deletePost(postId);
        if (error) {
            console.error('Delete error:', error);
            alert('Failed to delete post');
        } else {
            setPosts(posts.filter(p => p.id !== postId));
        }
    };

    const filteredPosts = filter === 'all'
        ? posts
        : posts.filter(p => p.post_type === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium">Loading community feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    {/* Back Navigation */}
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-3 group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Community Icon */}
                            <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Community</h1>
                                <p className="text-sm text-gray-500">Share your journey &amp; get inspired</p>
                            </div>
                        </div>

                        {/* Stats Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-purple-700">{posts.length} posts</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Create Post CTA */}
                {currentUserId ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-white border border-gray-200 rounded-2xl p-5 mb-8 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    Share an update
                                </p>
                                <p className="text-sm text-gray-400">
                                    Milestone, goal, win, or just checking in
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                ) : (
                    <div className="w-full bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full"></div>
                        <div className="relative text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            <h3 className="text-xl font-bold mb-2">Join the Community</h3>
                            <p className="mb-5 text-white/80 text-sm">Sign in to share your journey and connect with others</p>
                            <a
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Sign In
                            </a>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        {
                            value: 'all', label: 'All Posts', icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            )
                        },
                        {
                            value: 'milestone', label: 'Milestones', icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )
                        },
                        {
                            value: 'goal', label: 'Goals', icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            )
                        },
                        {
                            value: 'update', label: 'Updates', icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            )
                        },
                        {
                            value: 'win', label: 'Wins', icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            )
                        }
                    ].map(({ value, label, icon }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value as any)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filter === value
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                    : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>

                {/* Posts Feed */}
                <div className="space-y-5">
                    {filteredPosts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                Be the first to share your journey with the community!
                            </p>
                            {currentUserId && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={currentUserId || undefined}
                                onCommentClick={() => setSelectedPostId(post.id)}
                                onDelete={() => handleDeletePost(post.id)}
                            />
                        ))
                    )}
                </div>

                {/* Load More */}
                {filteredPosts.length >= 20 && (
                    <div className="text-center mt-10">
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Load More
                        </button>
                    </div>
                )}
            </div>

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
