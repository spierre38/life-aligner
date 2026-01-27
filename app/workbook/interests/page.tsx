'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { AuthNavbar } from '@/app/components/AuthNavbar';
import { VideoPlaceholder } from '@/app/components/VideoPlaceholder';

// Interests from workbook page 15 - organized by category
const INTERESTS_BY_CATEGORY = {
    'Arts & Crafts': [
        'Calligraphy', 'Candle-making', 'Cosmetics', 'Crocheting', 'Clothing Design',
        'Clothing Creation', 'Drawing', 'Glassblowing', 'Jewelry making', 'Journaling',
        'Knitting', 'Movies', 'Needlepoint', 'Origami', 'Painting', 'Photography',
        'Poetry', 'Pottery', 'Quilting', 'Reading', 'Scrapbooking', 'Sports (Watching)',
        'Soap making', 'String Art', 'Thrifting', 'Weaving', 'Writing'
    ],
    'Performing': [
        'Acting', 'Comedy', 'Dancing', 'Playing an instrument', 'Podcasting', 'Karaoke'
    ],
    'Food and Drink': [
        'Baking', 'Bread making', 'Brewing', 'Cheese-making', 'Cooking',
        'Mixology', 'Winemaking', 'Wine tasting'
    ],
    'Historical & Collecting': [
        'Coins', 'Art', 'Artifacts', 'Books', 'Genealogy', 'Memorabilia',
        'Music (records, CDs, audio)', 'Preserving/teaching about historical landmarks', 'Stamps'
    ],
    'Games': [
        'Billiards', 'Backgammon', 'Board games', 'Card games', 'Chess',
        'Crossword puzzles', 'Fantasy sports', 'Jigsaw puzzles', 'Legos',
        'Model trains', 'Ping Pong', 'Trivia', 'Video games'
    ],
    'Nature Related': [
        'Animal breeding', 'Animal grooming', 'Astronomy', 'Beekeeping', 'Bird watching',
        'Camping', 'Farming', 'Fishing', 'Gardening', 'Geocaching', 'Metal detecting',
        'Meteorology', 'Sailing', 'Scuba diving', 'Shuffleboard', 'Skydiving', 'Traveling'
    ],
    'Technical Hobbies': [
        'App making', 'Electronics repair', 'Drone operation', 'Flying',
        'Furniture restoration', 'Hacking', 'Home improvement projects',
        'Metalworking', 'Taxidermy', 'Vehicle restoration', 'Video production', 'Woodworking'
    ],
    'Physical Activities': [
        'Archery', 'Backpacking', 'Basketball', 'Bowling', 'Bungee jumping',
        'Car Racing', 'Canoeing', 'Disc golfing', 'Golfing', 'Gymnastics',
        'Handball', 'High Intensity Interval Training (HIIT)', 'Hiking', 'Hockey',
        'Horseback riding', 'Ice skating', 'Juggling', 'Kayaking', 'Kite surfing',
        'Martial arts', 'Paintball', 'Pickleball', 'Running', 'Soccer', 'Skiing',
        'Snowboarding', 'Surfing', 'Swimming', 'Tennis', 'Triathlons', 'Water Skiing', 'Yoga'
    ]
};

// Category colors for visual distinction
const CATEGORY_COLORS = {
    'Arts & Crafts': 'from-purple-500 to-pink-500',
    'Performing': 'from-pink-500 to-red-500',
    'Food and Drink': 'from-orange-500 to-yellow-500',
    'Historical & Collecting': 'from-amber-600 to-orange-600',
    'Games': 'from-blue-500 to-cyan-500',
    'Nature Related': 'from-green-500 to-emerald-500',
    'Technical Hobbies': 'from-indigo-500 to-blue-500',
    'Physical Activities': 'from-teal-500 to-green-500'
};

type InterestData = {
    existing: string[];
    exploring: string[];
};

export default function InterestsWorksheet() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'existing' | 'exploring'>('existing');
    const [selectedExisting, setSelectedExisting] = useState<Set<string>>(new Set());
    const [selectedExploring, setSelectedExploring] = useState<Set<string>>(new Set());
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(Object.keys(INTERESTS_BY_CATEGORY)) // All expanded by default
    );
    const [searchTerm, setSearchTerm] = useState('');

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUserId(userWithProfile.user.id);

                // Check if they already have saved interests
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'interests')
                    .single();

                if (data && !error) {
                    const saved: InterestData = data.content;
                    setSelectedExisting(new Set(saved.existing || []));
                    setSelectedExploring(new Set(saved.exploring || []));
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const toggleInterest = (interest: string, type: 'existing' | 'exploring') => {
        const setter = type === 'existing' ? setSelectedExisting : setSelectedExploring;
        setter(prev => {
            const newSet = new Set(prev);
            if (newSet.has(interest)) {
                newSet.delete(interest);
            } else {
                newSet.add(interest);
            }
            return newSet;
        });
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const saveInterests = async () => {
        if (!userId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'interests',
                    content: {
                        existing: Array.from(selectedExisting),
                        exploring: Array.from(selectedExploring)
                    }
                }, {
                    onConflict: 'user_id,category'
                });

            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving interests:', error);
            alert('Failed to save interests. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Filter interests by search term
    const filterInterests = (interests: string[]) => {
        if (!searchTerm) return interests;
        return interests.filter(interest =>
            interest.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-800">Loading worksheet...</p>
                </div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Interests Saved! ✨</h2>
                    <p className="text-xl text-gray-800">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 pt-24">
                <div className="max-w-7xl mx-auto">
                    {/* Video Placeholder */}
                    <VideoPlaceholder
                        title="Understanding Your Interests"
                        description="Learn how to identify activities that bring you joy, rejuvenation, and allow you to deploy your creativity to help others."
                        duration="3 min"
                        worksheetPath="/workbook/interests"
                        icon="❤️"
                    />

                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-4 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                ❤️
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">Your Interests</h1>
                                <p className="text-lg text-gray-800">LifeFrame • Step 2 of 5</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setActiveTab('existing')}
                                className={`
                  flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all
                  ${activeTab === 'existing'
                                        ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-lg'
                                        : 'bg-white text-gray-800 hover:bg-gray-50'
                                    }
                `}
                            >
                                Existing Interests
                                <div className="text-sm font-normal mt-1">
                                    {selectedExisting.size} selected
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('exploring')}
                                className={`
                  flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all
                  ${activeTab === 'exploring'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-white text-gray-800 hover:bg-gray-50'
                                    }
                `}
                            >
                                Interests to Explore
                                <div className="text-sm font-normal mt-1">
                                    {selectedExploring.size} selected
                                </div>
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white rounded-xl p-6 mb-6">
                            <p className="text-gray-800">
                                {activeTab === 'existing'
                                    ? "✓ Select interests you currently engage in - activities that bring you joy and rejuvenation."
                                    : "⭐ Select interests you want to explore over the next 3 months - new activities to try."
                                }
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search interests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-300 text-gray-900 focus:border-purple-600 focus:outline-none"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="space-y-6 mb-8">
                        {Object.entries(INTERESTS_BY_CATEGORY).map(([category, interests]) => {
                            const filteredInterests = filterInterests(interests);
                            if (filteredInterests.length === 0 && searchTerm) return null;

                            const isExpanded = expandedCategories.has(category);
                            const selectedSet = activeTab === 'existing' ? selectedExisting : selectedExploring;
                            const selectedCount = interests.filter(i => selectedSet.has(i)).length;

                            return (
                                <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className={`
                      w-full p-6 flex items-center justify-between
                      bg-gradient-to-r ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}
                      text-white hover:opacity-90 transition
                    `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-2xl font-bold">{category}</h3>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                                {selectedCount} selected
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Interests Grid */}
                                    {isExpanded && (
                                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {filteredInterests.map((interest) => {
                                                const isSelected = selectedSet.has(interest);
                                                return (
                                                    <button
                                                        key={interest}
                                                        onClick={() => toggleInterest(interest, activeTab)}
                                                        className={`
                              px-4 py-3 rounded-lg text-sm font-medium transition-all transform hover:scale-105
                              ${isSelected
                                                                ? activeTab === 'existing'
                                                                    ? 'bg-gradient-to-br from-pink-600 to-orange-600 text-white shadow-md'
                                                                    : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md'
                                                                : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200'
                                                            }
                            `}
                                                    >
                                                        {interest}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-center gap-4 sticky bottom-8">
                        <button
                            onClick={saveInterests}
                            disabled={saving || (selectedExisting.size === 0 && selectedExploring.size === 0)}
                            className={`
                px-10 py-5 rounded-full font-bold text-xl shadow-2xl transition-all transform hover:scale-105
                ${saving || (selectedExisting.size === 0 && selectedExploring.size === 0)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-2xl'
                                }
              `}
                        >
                            {saving ? 'Saving...' : 'Save & Continue →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
