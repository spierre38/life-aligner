'use client';

import { useState } from 'react';
import { createPost } from '@/lib/social';

interface CreatePostModalProps {
    onClose: () => void;
    onPostCreated: (post: any) => void;
}

const POST_TYPES = [
    { value: 'milestone', label: 'Milestone', emoji: '🎯', description: 'A significant achievement' },
    { value: 'goal', label: 'Goal', emoji: '🚀', description: 'Something you want to accomplish' },
    { value: 'update', label: 'Update', emoji: '📝', description: 'Share your progress' },
    { value: 'win', label: 'Win', emoji: '🎉', description: 'Celebrate a victory' }
] as const;

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', icon: '🌍', description: 'Everyone can see' },
    { value: 'partners', label: 'Partners Only', icon: '🤝', description: 'Only your accountability partners' },
    { value: 'private', label: 'Private', icon: '🔒', description: 'Only you can see' }
] as const;

export default function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<'milestone' | 'goal' | 'update' | 'win'>('update');
    const [visibility, setVisibility] = useState<'public' | 'private' | 'partners'>('public');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || submitting) return;

        setSubmitting(true);

        const { data, error } = await createPost(content.trim(), postType, visibility);

        if (error) {
            console.error('Post creation error:', error);
            alert('Failed to create post. Please try again.');
            setSubmitting(false);
        } else if (data) {
            onPostCreated(data);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
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

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Post Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">What are you sharing?</label>
                        <div className="grid grid-cols-2 gap-3">
                            {POST_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setPostType(type.value)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${postType === type.value
                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-2xl">{type.emoji}</span>
                                        <span className="font-semibold text-gray-900">{type.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Share your story</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                            required
                        />
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-gray-500">
                                {content.length} characters
                            </p>
                            {content.length > 500 && (
                                <p className="text-sm text-amber-600">Consider keeping it concise</p>
                            )}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Who can see this?</label>
                        <div className="space-y-2">
                            {VISIBILITY_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setVisibility(option.value)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${visibility === option.value
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{option.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900">{option.label}</p>
                                                <p className="text-sm text-gray-500">{option.description}</p>
                                            </div>
                                        </div>
                                        {visibility === option.value && (
                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!content.trim() || submitting}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
                        >
                            {submitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
