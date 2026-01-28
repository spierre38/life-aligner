'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { AuthNavbar } from '@/app/components/AuthNavbar';

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
    const [currentStep, setCurrentStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'existing' | 'exploring'>('existing');
    const [selectedExisting, setSelectedExisting] = useState<Set<string>>(new Set());
    const [selectedExploring, setSelectedExploring] = useState<Set<string>>(new Set());
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(Object.keys(INTERESTS_BY_CATEGORY))
    );
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUserId(userWithProfile.user.id);

                // Check if Values is completed (prerequisite)
                const { data: valuesData, error: valuesError } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'values')
                    .single();

                if (valuesError || !valuesData) {
                    router.push('/workbook/values');
                    return;
                }

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
                    // Skip to step 5 if they have data
                    if (saved.existing?.length > 0 || saved.exploring?.length > 0) {
                        setCurrentStep(5);
                    }
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
                    <p className="text-gray-800">Checking prerequisites...</p>
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                {/* Progress Bar */}
                <div className="fixed top-16 left-0 w-full h-2 bg-gray-200 z-40">
                    <div
                        className="h-full bg-gradient-to-r from-pink-600 to-orange-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12">
                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                        <div className="min-h-screen flex items-center justify-center animate-fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 rounded-3xl transform rotate-1"></div>
                                <div className="relative bg-white rounded-3xl p-12 shadow-2xl max-w-3xl">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6">
                                            ❤️
                                        </div>
                                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                                            Your Interests
                                        </h1>
                                        <p className="text-xl text-gray-800 leading-relaxed mb-8">
                                            Interests are activities that bring you joy and rejuvenate you. The sweet spot?
                                            Finding interests that allow you to deploy your creativity to benefit others.
                                        </p>
                                        <p className="text-lg text-gray-700 mb-8">
                                            LifeFrame • Step 2 of 5 • 10-15 minutes
                                        </p>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-gradient-to-r from-pink-600 to-orange-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                                        >
                                            Let's Explore →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Video Placeholder */}
                    {currentStep === 2 && (
                        <div className="min-h-screen flex items-center justify-center animate-fade-in">
                            <div className="max-w-4xl w-full">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-8 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Dashboard
                                </button>

                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-2xl font-semibold mb-2">Video Coming Soon</p>
                                            <p className="text-gray-300">Understanding Your Interests</p>
                                        </div>
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                            3 min
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                            Joy, Rejuvenation, and Creativity
                                        </h2>
                                        <p className="text-gray-800 mb-6">
                                            Learn how to identify activities that bring you happiness and energy. Tim explains
                                            the difference between existing interests and interests worth exploring.
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
                                            >
                                                Continue →
                                            </button>
                                            <button
                                                onClick={() => setCurrentStep(1)}
                                                className="px-8 py-4 rounded-full font-bold border-2 border-gray-300 text-gray-800 hover:border-orange-600 hover:text-orange-600 transition"
                                            >
                                                ← Back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Real Examples */}
                    {currentStep === 3 && (
                        <div className="min-h-screen flex items-center justify-center py-20 animate-fade-in">
                            <div className="max-w-5xl w-full">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-8 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div className="bg-white rounded-3xl shadow-2xl p-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                        How Interests Show Up in Life
                                    </h2>
                                    <p className="text-lg text-gray-800 mb-8">
                                        Let's look at how different people experience their interests:
                                    </p>

                                    <div className="space-y-8">
                                        {/* Tim's Example */}
                                        <div className="border-l-4 border-blue-600 pl-6">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tim's Interests</h3>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <p className="font-semibold text-gray-900 mb-2">📺 Watching Sports</p>
                                                    <p className="text-gray-800">
                                                        <strong>Joy:</strong> ✓ Yes, he enjoys it<br />
                                                        <strong>Rejuvenation:</strong> ✗ Not really<br />
                                                        <strong>Creativity/Helping Others:</strong> ✗ No
                                                    </p>
                                                </div>

                                                <div className="p-4 bg-green-50 rounded-lg">
                                                    <p className="font-semibold text-gray-900 mb-2">🏃 HIIT Classes</p>
                                                    <p className="text-gray-800">
                                                        <strong>Joy:</strong> ✓ Yes, loves the challenge<br />
                                                        <strong>Rejuvenation:</strong> ✓ Feels energized after<br />
                                                        <strong>Creativity/Helping Others:</strong> ✗ No
                                                    </p>
                                                </div>

                                                <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-500">
                                                    <p className="font-semibold text-gray-900 mb-2">🤝 Problem Solving & Partnerships</p>
                                                    <p className="text-gray-800">
                                                        <strong>Joy:</strong> ✓ Yes, finds it exciting<br />
                                                        <strong>Rejuvenation:</strong> ✓ Gets energy from it<br />
                                                        <strong>Creativity:</strong> ✓ Uses creative thinking<br />
                                                        <strong>Helping Others:</strong> ✓ Created jobs, helped millions
                                                    </p>
                                                    <p className="text-green-800 font-semibold mt-2">🎯 The Sweet Spot!</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Examples */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Jess - Art School Owner</h4>
                                                <p className="text-gray-800 mb-2">
                                                    <strong>Interest:</strong> Painting & Teaching
                                                </p>
                                                <p className="text-gray-700">
                                                    Turned her love of art into a business that addresses adult loneliness.
                                                    She gets joy, uses creativity, AND helps others combat isolation.
                                                </p>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Laura - Fitness Coach</h4>
                                                <p className="text-gray-800 mb-2">
                                                    <strong>Interest:</strong> Working Out
                                                </p>
                                                <p className="text-gray-700">
                                                    Loved HIIT classes so much she became an instructor. Now she gets rejuvenated
                                                    by her work AND helps others achieve their health goals.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                            <p className="text-gray-800">
                                                💡 <strong>Key Insight:</strong> All interests are valid and bring value to your life.
                                                But the most fulfilling interests combine joy, rejuvenation, creativity, and service to others.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(4)}
                                            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
                                        >
                                            Next: Finding Your Sweet Spot →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: The Sweet Spot */}
                    {currentStep === 4 && (
                        <div className="min-h-screen flex items-center justify-center py-20 animate-fade-in">
                            <div className="max-w-4xl w-full">
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-8 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div className="bg-white rounded-3xl shadow-2xl p-12">
                                    <div className="text-center mb-10">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                            🎯
                                        </div>
                                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                            Finding Your Sweet Spot
                                        </h2>
                                        <p className="text-xl text-gray-800">
                                            Two types of interests to identify
                                        </p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-8 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl border-2 border-pink-200">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                <span className="text-3xl">✓</span>
                                                Existing Interests
                                            </h3>
                                            <p className="text-gray-800 text-lg mb-4">
                                                These are activities you <strong>currently engage in</strong> that bring you joy and rejuvenation.
                                            </p>
                                            <p className="text-gray-700">
                                                Examples: Reading, hiking, cooking, playing guitar, watching movies, working out,
                                                photography, gardening, gaming, painting...
                                            </p>
                                        </div>

                                        <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                <span className="text-3xl">⭐</span>
                                                Interests to Explore
                                            </h3>
                                            <p className="text-gray-800 text-lg mb-4">
                                                These are activities you'd like to <strong>try over the next 3 months</strong>—things that spark your curiosity.
                                            </p>
                                            <p className="text-gray-700">
                                                Examples: Pottery class, learning an instrument, rock climbing, podcasting,
                                                woodworking, yoga, creative writing, martial arts...
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-300">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">🌟 The Ultimate Sweet Spot</h3>
                                            <p className="text-gray-800 mb-4">
                                                As you go through life, look for opportunities to combine interests that:
                                            </p>
                                            <ul className="space-y-2 text-gray-800">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-600 font-bold mt-1">✓</span>
                                                    <span>Bring you <strong>joy</strong> (you genuinely enjoy them)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-600 font-bold mt-1">✓</span>
                                                    <span>Provide <strong>rejuvenation</strong> (you feel energized, not drained)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-600 font-bold mt-1">✓</span>
                                                    <span>Deploy your <strong>creativity</strong> (you can express yourself)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-600 font-bold mt-1">✓</span>
                                                    <span><strong>Benefit others</strong> (your interest helps people)</span>
                                                </li>
                                            </ul>
                                            <p className="text-green-800 font-semibold mt-4 text-lg">
                                                When all four align, you've found deep fulfillment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-5 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                                        >
                                            Ready to Select Your Interests →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: The Worksheet */}
                    {currentStep === 5 && (
                        <div className="py-8 animate-fade-in">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-800 hover:text-gray-900 flex items-center gap-2 mb-8 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    ❤️
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">Your Interests</h1>
                                    <p className="text-lg text-gray-800">Select what you love and want to explore</p>
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
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
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
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
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
                                        className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-300 text-gray-900 focus:border-orange-600 focus:outline-none"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
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
                            <div className="flex justify-center sticky bottom-8">
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
                    )}
                </div>
            </div>
        </>
    );
}
