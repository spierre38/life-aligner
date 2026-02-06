'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

type SelectedValue = {
    name: string;
    description: string;
    priority: number;
};

type InterestData = {
    existing: string[];
    exploring: string[];
};

type CategoryDetail = {
    name: string;
    subCategories: string[];
};

type PurposeElement = {
    name: string;
    description: string;
};

type LifeCategoriesData = {
    categories: CategoryDetail[];
    purpose_elements: PurposeElement[];
};

type LifeFrameData = {
    values: SelectedValue[];
    interests: InterestData;
    lifeCategories: LifeCategoriesData;
};

export default function LifeFramePage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lifeFrameData, setLifeFrameData] = useState<LifeFrameData | null>(null);
    const [completionStatus, setCompletionStatus] = useState({
        values: false,
        interests: false,
        lifeCategories: false
    });

    useEffect(() => {
        const loadLifeFrame = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUserId(userWithProfile.user.id);

                // Fetch all three worksheets
                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (error) throw error;

                // Parse the data
                const valuesData = worksheets?.find(w => w.category === 'values');
                const interestsData = worksheets?.find(w => w.category === 'interests');
                const categoriesData = worksheets?.find(w => w.category === 'life_categories');

                setCompletionStatus({
                    values: !!valuesData,
                    interests: !!interestsData,
                    lifeCategories: !!categoriesData
                });

                if (valuesData && interestsData && categoriesData) {
                    setLifeFrameData({
                        values: valuesData.content.selected_values || [],
                        interests: interestsData.content || { existing: [], exploring: [] },
                        lifeCategories: categoriesData.content || { categories: [], purpose_elements: [] }
                    });
                }
            } catch (error) {
                console.error('Error loading LifeFrame:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLifeFrame();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-800">Loading your LifeFrame...</p>
                </div>
            </div>
        );
    }

    // Check if all three are complete
    const allComplete = completionStatus.values && completionStatus.interests && completionStatus.lifeCategories;

    if (!allComplete) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 pt-20">
                    <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-6">
                                📋
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Complete Your LifeFrame
                            </h1>
                            <p className="text-lg text-gray-800 mb-8">
                                You need to complete all three worksheets before viewing your LifeFrame
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className={`flex items-center gap-4 p-4 rounded-xl ${completionStatus.values ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completionStatus.values ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                        {completionStatus.values ? '✓' : '1'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-gray-900">Values</h3>
                                    </div>
                                    {!completionStatus.values && (
                                        <button
                                            onClick={() => router.push('/workbook/values')}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                                        >
                                            Start
                                        </button>
                                    )}
                                </div>

                                <div className={`flex items-center gap-4 p-4 rounded-xl ${completionStatus.interests ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completionStatus.interests ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                        {completionStatus.interests ? '✓' : '2'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-gray-900">Interests</h3>
                                    </div>
                                    {!completionStatus.interests && (
                                        <button
                                            onClick={() => router.push('/workbook/interests')}
                                            disabled={!completionStatus.values}
                                            className={`px-4 py-2 rounded-lg font-semibold transition ${completionStatus.values
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {completionStatus.values ? 'Start' : 'Locked'}
                                        </button>
                                    )}
                                </div>

                                <div className={`flex items-center gap-4 p-4 rounded-xl ${completionStatus.lifeCategories ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completionStatus.lifeCategories ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                        {completionStatus.lifeCategories ? '✓' : '3'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-gray-900">Life Categories</h3>
                                    </div>
                                    {!completionStatus.lifeCategories && (
                                        <button
                                            onClick={() => router.push('/workbook/life-categories')}
                                            disabled={!completionStatus.interests}
                                            className={`px-4 py-2 rounded-lg font-semibold transition ${completionStatus.interests
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {completionStatus.interests ? 'Start' : 'Locked'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-800 hover:text-gray-900 font-semibold"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Helper function for value emojis
    const getValueEmoji = (valueName: string): string => {
        const emojiMap: Record<string, string> = {
            'Authenticity': '🎭',
            'Compassion': '💝',
            'Commitment': '🤝',
            'Continuous Improvement': '📈',
            'Courage': '🦁',
            'Creativity': '🎨',
            'Dependability': '🛡️',
            'Effort': '💪',
            'Hard Work': '💪',
            'Doing Your Best': '💪',
            'Fairness': '⚖️',
            'Generosity': '🎁',
            'Gratitude': '🙏',
            'Honesty': '💎',
            'Integrity': '🔐',
            'Humility': '🧘',
            'Open Mindedness': '🌈',
            'Perseverance': '🔥',
            'Positivity': '☀️',
            'Optimism': '☀️',
            'Proactivity': '🚀',
            'Self-respect': '👑',
            'Tolerance': '🤲',
            'Wisdom': '🦉'
        };
        return emojiMap[valueName] || '⭐';
    };

    // Interests emoji mapping
    const getInterestEmoji = (interestName: string): string => {
        const emojiMap: Record<string, string> = {
            // Arts & Crafts
            'Calligraphy': '✒️',
            'Candle-making': '🕯️',
            'Crocheting': '🧶',
            'Drawing': '✏️',
            'Painting': '🎨',
            'Photography': '📸',
            'Pottery': '🏺',
            'Writing': '📝',
            'Reading': '📚',
            'Movies': '🎬',
            'Quilting': '🧵',
            'Knitting': '🧶',

            // Performing
            'Acting': '🎭',
            'Comedy': '🎤',
            'Dancing': '💃',
            'Playing an instrument': '🎸',
            'Podcasting': '🎙️',
            'Karaoke': '🎤',

            // Food & Drink
            'Baking': '🧁',
            'Cooking': '🍳',
            'Brewing': '🍺',
            'Wine tasting': '🍷',

            // Games
            'Chess': '♟️',
            'Video games': '🎮',
            'Board games': '🎲',
            'Card games': '🃏',
            'Billiards': '🎱',

            // Physical Activities
            'Running': '🏃',
            'Hiking': '🥾',
            'Swimming': '🏊',
            'Yoga': '🧘',
            'Basketball': '🏀',
            'Soccer': '⚽',
            'Tennis': '🎾',
            'Cycling': '🚴',
            'Skiing': '⛷️',
            'Golf': '⛳',
            'HIIT': '💪',
            'Martial arts': '🥋',

            // Nature
            'Gardening': '🌱',
            'Camping': '⛺',
            'Fishing': '🎣',
            'Bird watching': '🦅',
            'Traveling': '✈️',
            'Astronomy': '🔭',

            // Technical
            'Coding': '💻',
            'Woodworking': '🪚',
            'Metalworking': '🔧',
            'Electronics': '⚡',

            // Collecting
            'Coins': '🪙',
            'Books': '📚',
            'Art': '🖼️',
            'Music': '🎵',
            'Stamps': '📬'
        };
        return emojiMap[interestName] || '🎯';
    };

    // Life Category emoji mapping
    const getCategoryEmoji = (categoryName: string): string => {
        const emojiMap: Record<string, string> = {
            'Health': '💪',
            'Relationships': '❤️',
            'Community': '🤝',
            'Education': '📚',
            'Career': '💼',
            'Financial': '💰',
            'Spirituality': '🙏',
            'Creative': '🎨',
            'Travel': '✈️',
            'Hobbies': '🎯',
            'Family': '👨👩👧👦',
            'Friends': '👥',
            'Personal Growth': '🌱',
            'Mental Health': '🧠',
            'Physical Health': '🏃'
        };
        return emojiMap[categoryName] || '🎯';
    };

    // Purpose emoji mapping
    const getPurposeEmoji = (purposeName: string): string => {
        const emojiMap: Record<string, string> = {
            'Help Others': '🤝',
            'Help the Environment': '🌍',
            'Mentor Youth': '👨🏫',
            'Address Adult Loneliness': '🤗',
            'Improve Teen Financial Literacy': '💵',
            'Protect My Family': '🛡️',
            'Cure Alzheimer\'s': '🧠',
            'Improve Medical Care': '⚕️',
            'Address Climate Change': '🌡️',
            'Address Food Insecurity': '🍽️',
            'Address Homelessness': '🏠',
            'Improve Care for the Elderly': '👵',
            'Develop Community': '🏘️',
            'Improve Cancer Treatment': '🎗️',
            'Provide Clean Water': '💧',
            'Address Racial Inequality': '✊'
        };
        return emojiMap[purposeName] || '⭐';
    };

    // Show the complete LifeFrame
    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 pt-20 relative">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/backgrounds/lifeframe-bg.png')] bg-cover bg-center opacity-[0.12]"></div>
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-8 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-6">
                            ✨
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">Your LifeFrame</h1>
                        <p className="text-xl text-gray-800 mb-2">
                            The foundation for your Roadmap
                        </p>
                        <p className="text-gray-600">
                            Values • Interests • Life Categories
                        </p>
                    </div>

                    {/* Values Section */}
                    <div className="mb-12">
                        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_40px_rgb(99,102,241,0.15)] hover:-translate-y-1 hover:border-indigo-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
                                        📌
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Your Values</h2>
                                        <p className="text-gray-800">Principles that guide your life</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/workbook/values')}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                >
                                    Edit →
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lifeFrameData?.values.map((value) => (
                                    <div
                                        key={value.name}
                                        className="
                                            bg-white 
                                            rounded-3xl 
                                            p-8 
                                            shadow-[0_8px_30px_rgb(0,0,0,0.08)] 
                                            border border-gray-100
                                            transition-all duration-300 ease-out
                                            hover:shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_40px_rgb(99,102,241,0.15)]
                                            hover:-translate-y-1
                                            hover:border-indigo-200
                                            text-center
                                            relative
                                        "
                                    >
                                        {/* Priority Badge */}
                                        <div className="absolute top-4 right-4 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                            {value.priority}
                                        </div>

                                        {/* Icon Circle */}
                                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-4xl">{getValueEmoji(value.name)}</span>
                                        </div>

                                        {/* Title - Uppercase */}
                                        <h3 className="text-2xl font-bold text-gray-800 uppercase tracking-wide mb-4">
                                            {value.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-600 leading-relaxed text-base">
                                            {value.description}
                                        </p>

                                        {/* Decorative line */}
                                        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Interests Section */}
                    <div className="mb-12">
                        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_40px_rgb(236,72,153,0.15)] hover:-translate-y-1 hover:border-pink-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl">
                                        ❤️
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Your Interests</h2>
                                        <p className="text-gray-800">Activities that bring you joy</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/workbook/interests')}
                                    className="text-pink-600 hover:text-pink-800 font-semibold text-sm"
                                >
                                    Edit →
                                </button>
                            </div>

                            {/* Existing Interests */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">✓</span>
                                    Existing Interests
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {lifeFrameData?.interests.existing.map((interest) => (
                                        <div
                                            key={interest}
                                            className="
                                                bg-white
                                                rounded-2xl
                                                p-4
                                                shadow-[0_4px_15px_rgb(0,0,0,0.06)]
                                                border border-gray-100
                                                transition-all duration-200 ease-out
                                                hover:shadow-[0_4px_15px_rgb(0,0,0,0.10),0_0_25px_rgb(236,72,153,0.12)]
                                                hover:-translate-y-0.5
                                                hover:border-pink-200
                                                text-center
                                                relative
                                            "
                                        >
                                            {/* Checkmark Icon - Top Right */}
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">
                                                ✓
                                            </div>

                                            {/* Interest Icon/Emoji */}
                                            <div className="text-3xl mb-2">
                                                {getInterestEmoji(interest)}
                                            </div>

                                            {/* Interest Name */}
                                            <p className="text-sm font-semibold text-gray-800">
                                                {interest}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Exploring Interests */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">⭐</span>
                                    Exploring
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {lifeFrameData?.interests.exploring.map((interest) => (
                                        <div
                                            key={interest}
                                            className="
                                                bg-white
                                                rounded-2xl
                                                p-4
                                                shadow-[0_4px_15px_rgb(0,0,0,0.06)]
                                                border border-gray-100
                                                transition-all duration-200 ease-out
                                                hover:shadow-[0_4px_15px_rgb(0,0,0,0.10),0_0_25px_rgb(168,85,247,0.12)]
                                                hover:-translate-y-0.5
                                                hover:border-purple-200
                                                text-center
                                                relative
                                            "
                                        >
                                            {/* Star Icon - Top Right */}
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                                                ⭐
                                            </div>

                                            {/* Interest Icon/Emoji */}
                                            <div className="text-3xl mb-2 opacity-70">
                                                {getInterestEmoji(interest)}
                                            </div>

                                            {/* Interest Name */}
                                            <p className="text-sm font-semibold text-gray-800">
                                                {interest}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Life Categories Section */}
                    <div className="mb-12">
                        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_40px_rgb(99,102,241,0.15)] hover:-translate-y-1 hover:border-indigo-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
                                        🎯
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Your Life Categories</h2>
                                        <p className="text-gray-800">Areas where you'll set goals</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/workbook/life-categories')}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                >
                                    Edit →
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {lifeFrameData?.lifeCategories.categories.map((category) => (
                                    <div
                                        key={category.name}
                                        className="
                                            bg-white
                                            rounded-3xl
                                            p-6
                                            shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                                            border border-gray-100
                                            transition-all duration-300 ease-out
                                            hover:shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_40px_rgb(99,102,241,0.15)]
                                            hover:-translate-y-1
                                            hover:border-indigo-200
                                            relative
                                        "
                                    >
                                        {/* Category Icon - Top */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-3xl">{getCategoryEmoji(category.name)}</span>
                                            </div>
                                            <div className="flex-1">
                                                {/* Category Name */}
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {category.name}
                                                </h3>

                                                {/* Sub-categories */}
                                                {category.subCategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {category.subCategories.map((sub) => (
                                                            <span
                                                                key={sub}
                                                                className="
                                                                    px-3 py-1 
                                                                    bg-indigo-50 
                                                                    text-indigo-700 
                                                                    text-xs 
                                                                    font-medium 
                                                                    rounded-full
                                                                    border border-indigo-100
                                                                "
                                                            >
                                                                {sub}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Decorative Bottom Border */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-3xl"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Purpose Section - Special Treatment */}
                            {lifeFrameData?.lifeCategories.purpose_elements && lifeFrameData.lifeCategories.purpose_elements.length > 0 && (
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border-2 border-yellow-200 p-8 shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <span className="text-3xl">⭐</span>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold text-gray-900">Your Purpose</h3>
                                            <p className="text-gray-700">How you'll make a positive impact</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {lifeFrameData.lifeCategories.purpose_elements.map((element, index) => (
                                            <div
                                                key={index}
                                                className="
                                                    bg-white
                                                   rounded-2xl
                                                    p-6
                                                    shadow-[0_4px_15px_rgb(0,0,0,0.06)]
                                                    border border-yellow-200
                                                    transition-all duration-200 ease-out
                                                    hover:shadow-[0_4px_15px_rgb(0,0,0,0.10),0_0_25px_rgb(251,191,36,0.12)]
                                                    hover:-translate-y-0.5
                                                    hover:border-yellow-300
                                                    relative
                                                "
                                            >
                                                {/* Purpose Icon */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-2xl">{getPurposeEmoji(element.name)}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-xl font-bold text-gray-900">
                                                            {element.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {/* Description if exists */}
                                                {element.description && (
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        {element.description}
                                                    </p>
                                                )}

                                                {/* Decorative corner accent */}
                                                <div className="absolute top-3 right-3 w-8 h-8 bg-yellow-200 rounded-full opacity-20"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Step CTA */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-2xl p-12 text-center text-white">
                        <h2 className="text-4xl font-bold mb-4">LifeFrame Complete! 🎉</h2>
                        <p className="text-xl mb-8">
                            You've built the foundation. Now it's time to create your Roadmap with goals and activities.
                        </p>
                        <button
                            onClick={() => router.push('/roadmap')}
                            className="bg-white text-green-600 px-10 py-4 rounded-full font-bold text-xl hover:shadow-2xl transition-all transform hover:scale-105"
                        >
                            Build Your Roadmap →
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
