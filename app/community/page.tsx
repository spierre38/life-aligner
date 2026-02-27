'use client';

import { useState, useEffect } from 'react';
import { getCommunityFeed, deletePost } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
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
            console.error('Error loading feed:', error);
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

        const loadingToast = showToast.loading('Deleting post...');

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading community...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Community Feed</h1>
                            <p className="text-gray-600">Share your journey and get inspired</p>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                            title="Refresh feed"
                        >
                            <svg
                                className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Create Post Button */}
                {currentUserId ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-6 hover:border-purple-400 hover:bg-purple-50/50 transition-all group transform hover:scale-[1.01]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    Share an update
                                </p>
                                <p className="text-sm text-gray-500">
                                    Milestone, goal, win, or just checking in
                                </p>
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 text-white shadow-lg">
                        <div className="text-center">
                            <div className="text-5xl mb-4">✨</div>
                            <h3 className="text-2xl font-bold mb-2">Join the Community</h3>
                            <p className="mb-6 text-white/90 text-lg">Sign in to share your journey and connect with others</p>
                            <a
                                href="/login"
                                className="inline-block px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                            >
                                Sign In
                            </a>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { value: 'all', label: 'All Posts', emoji: '🌟', count: posts.length },
                        { value: 'milestone', label: 'Milestones', emoji: '🎯', count: posts.filter(p => p.post_type === 'milestone').length },
                        { value: 'goal', label: 'Goals', emoji: '🚀', count: posts.filter(p => p.post_type === 'goal').length },
                        { value: 'update', label: 'Updates', emoji: '📝', count: posts.filter(p => p.post_type === 'update').length },
                        { value: 'win', label: 'Wins', emoji: '🎉', count: posts.filter(p => p.post_type === 'win').length }
                    ].map(({ value, label, emoji, count }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value as any)}
                            className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all transform hover:scale-105 ${filter === value
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                                }`}
                        >
                            <span className="mr-2 text-lg">{emoji}</span>
                            {label}
                            {count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${filter === value ? 'bg-white/20' : 'bg-gray-100'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                            <div className="text-7xl mb-6">🌱</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}
                            </h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                {currentUserId ? 'Be the first to share your journey!' : 'Sign in to start sharing!'}
                            </p>
                            {currentUserId && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
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
                    <div className="text-center mt-8">
                        <button className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-purple-400 transition-all transform hover:scale-105">
                            Load More Posts
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
