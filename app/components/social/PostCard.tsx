'use client';

import { useState } from 'react';
import { likePost, unlikePost } from '@/lib/social';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Author {
    id: string;
    full_name: string;
    avatar_url?: string;
}

interface PostCardProps {
    post: {
        id: string;
        content: string;
        post_type: 'milestone' | 'goal' | 'update' | 'win';
        visibility: 'public' | 'private' | 'partners';
        likes_count: number;
        comments_count: number;
        created_at: string;
        author: Author;
    };
    currentUserId?: string;
    initialLiked?: boolean;
    onCommentClick?: () => void;
    onDelete?: () => void;
}

const POST_TYPE_CONFIG = {
    milestone: { label: 'Milestone', emoji: '🎯', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    goal: { label: 'Goal', emoji: '🚀', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    update: { label: 'Update', emoji: '📝', color: 'bg-green-100 text-green-700 border-green-200' },
    win: { label: 'Win', emoji: '🎉', color: 'bg-amber-100 text-amber-700 border-amber-200' }
};

export default function PostCard({ post, currentUserId, initialLiked = false, onCommentClick, onDelete }: PostCardProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [liking, setLiking] = useState(false);

    const typeConfig = POST_TYPE_CONFIG[post.post_type];
    const isOwnPost = currentUserId ? currentUserId === post.author.id : false;

    const handleLike = async () => {
        if (liking || !currentUserId) return; // Don't allow likes if not logged in

        setLiking(true);
        const previousLiked = liked;
        const previousCount = likesCount;

        // Optimistic update
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);

        const { error } = liked
            ? await unlikePost(post.id)
            : await likePost(post.id);

        if (error) {
            // Revert on error
            setLiked(previousLiked);
            setLikesCount(previousCount);
            console.error('Like error:', error);
        }

        setLiking(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {post.author.avatar_url ? (
                            <Image
                                src={post.author.avatar_url}
                                alt={post.author.full_name}
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                        ) : (
                            post.author.full_name.charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Author info */}
                    <div>
                        <h3 className="font-semibold text-gray-900">{post.author.full_name}</h3>
                        <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Post type badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.color}`}>
                    <span>{typeConfig.emoji}</span>
                    <span>{typeConfig.label}</span>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                        onClick={handleLike}
                        disabled={liking || !currentUserId}
                        title={!currentUserId ? 'Sign in to like posts' : ''}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${liked
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'text-gray-600 hover:bg-gray-50'
                            } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${liked ? 'scale-110' : ''}`}
                            fill={liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                        <span>{likesCount}</span>
                    </button>

                    {/* Comment button */}
                    <button
                        onClick={onCommentClick}
                        disabled={!currentUserId}
                        title={!currentUserId ? 'Sign in to comment' : ''}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <span>{post.comments_count}</span>
                    </button>
                </div>

                {/* Delete button (own posts only) */}
                {isOwnPost && onDelete && (
                    <button
                        onClick={onDelete}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete post"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Visibility indicator */}
            {post.visibility !== 'public' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={post.visibility === 'private'
                                ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                : "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            }
                        />
                    </svg>
                    <span>
                        {post.visibility === 'private' ? 'Only you' : 'Partners only'}
                    </span>
                </div>
            )}
        </div>
    );
}
