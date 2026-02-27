'use client';

import { useState, useEffect } from 'react';
import { getCommunityFeed, deletePost } from '@/lib/social';
import { supabase } from '@/lib/supabase';
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

    useEffect(() => {
        loadUserAndPosts();
    }, []);

    const loadUserAndPosts = async () => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Load posts
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading community feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Feed</h1>
                    <p className="text-gray-600">Share your journey and get inspired by others</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Create Post Button */}
                {currentUserId ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-6 hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white">
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">Join the Community</h3>
                            <p className="mb-4 text-white/90">Sign in to share your journey and connect with others</p>
                            <a
                                href="/login"
                                className="inline-block px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                Sign In
                            </a>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { value: 'all', label: 'All Posts', emoji: '🌟' },
                        { value: 'milestone', label: 'Milestones', emoji: '🎯' },
                        { value: 'goal', label: 'Goals', emoji: '🚀' },
                        { value: 'update', label: 'Updates', emoji: '📝' },
                        { value: 'win', label: 'Wins', emoji: '🎉' }
                    ].map(({ value, label, emoji }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value as any)}
                            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${filter === value
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            <span className="mr-1.5">{emoji}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <div className="text-6xl mb-4">🌱</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {filter === 'all' ? 'No posts yet' : `No ${filter}s yet`}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Be the first to share your journey!
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Create First Post
                            </button>
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

                {/* Load More (future pagination) */}
                {filteredPosts.length >= 20 && (
                    <div className="text-center mt-8">
                        <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
