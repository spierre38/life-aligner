'use client';

import { useState, useEffect } from 'react';
import { getPostComments, addComment, deleteComment } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface CommentsModalProps {
    postId: string;
    onClose: () => void;
}

export default function CommentsModal({ postId, onClose }: CommentsModalProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        loadCommentsAndUser();
    }, [postId]);

    const loadCommentsAndUser = async () => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Load comments
        await loadComments();
    };

    const loadComments = async () => {
        setLoading(true);
        const { data, error } = await getPostComments(postId);

        if (error) {
            console.error('Error loading comments:', error);
        } else {
            setComments(data || []);
        }

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);

        const { data, error } = await addComment(postId, newComment.trim());

        if (error) {
            console.error('Comment error:', error);
            alert('Failed to post comment');
        } else {
            setNewComment('');
            await loadComments(); // Reload to get full comment with author
        }

        setSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        const { error } = await deleteComment(commentId);

        if (error) {
            console.error('Delete error:', error);
            alert('Failed to delete comment');
        } else {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 rounded-t-3xl flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Comments ({comments.length})
                        </h2>
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

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-500">Loading comments...</p>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💬</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No comments yet</h3>
                            <p className="text-gray-600">Be the first to comment!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {comment.author?.avatar_url ? (
                                                <Image
                                                    src={comment.author.avatar_url}
                                                    alt={comment.author.full_name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                comment.author?.full_name?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Author & Time */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {comment.author?.full_name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>

                                                {/* Delete button (own comments only) */}
                                                {currentUserId === comment.user_id && (
                                                    <button
                                                        onClick={() => handleDelete(comment.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Comment content */}
                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSubmit} className="border-t border-gray-200 p-6 flex-shrink-0">
                    <div className="flex gap-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            rows={2}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="px-6 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
                        >
                            {submitting ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
