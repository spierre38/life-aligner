'use client';

import { trackInterestsSaved } from '@/lib/analytics';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { Confetti } from '@/app/components/Confetti';

// ── Inline SVG Icons for workbook pages ───────────────────────────────────────
const HeartIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#heartGrad)" opacity="0.1" />
        <circle cx="100" cy="100" r="60" fill="url(#heartGrad)" opacity="0.15" />
        <path d="M100 160 C60 120 30 95 30 70 C30 50 48 35 68 35 C82 35 93 43 100 55 C107 43 118 35 132 35 C152 35 170 50 170 70 C170 95 140 120 100 160Z" fill="url(#heartGrad)" opacity="0.8" />
        <path d="M100 145 C70 115 50 95 50 78 C50 65 60 55 73 55 C83 55 90 62 100 72 C110 62 117 55 127 55 C140 55 150 65 150 78 C150 95 130 115 100 145Z" fill="white" opacity="0.3" />
    </svg>
);

const IntIcons = {
    heart: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    lightbulb: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
    target: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    tv: (cn = 'w-5 h-5') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
    runner: (cn = 'w-5 h-5') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="m15 9-2 3 3 5-3 1"/><path d="M9 9l2 3-3 5 3 1"/></svg>,
    handshake: (cn = 'w-5 h-5') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    check: (cn = 'w-5 h-5') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    star: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    sparkle: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
};

// Interests from workbook page 15 - organized by category
const INTERESTS_BY_CATEGORY = {
    'Arts & Crafts': [
        'Calligraphy', 'Candle-making', 'Cosmetics', 'Crocheting', 'Clothing Design',
        'Clothing Creation', 'Drawing', 'Glassblowing', 'Jewelry making', 'Journaling',
        'Knitting', 'Movies', 'Needlepoint', 'Origami', 'Painting', 'Photography',
        'Poetry', 'Pottery', 'Quilting', 'Reading', 'Scrapbooking', 'Sports (Watching)',
        'Soap making', 'String Art', 'Thrifting', 'Weaving', 'Writing', 'Sketching',
        'Digital Art', 'Graphic Design', 'Animation', 'Illustration', 'Blogging'
    ],
    'Performing': [
        'Acting', 'Comedy', 'Dancing', 'Playing an instrument', 'Podcasting', 'Karaoke',
        'Singing', 'Guitar', 'Piano', 'Drums', 'DJ-ing', 'Stand-up Comedy', 'Theater',
        'Voice Acting', 'Music Production', 'Songwriting'
    ],
    'Food and Drink': [
        'Baking', 'Bread making', 'Brewing', 'Cheese-making', 'Cooking',
        'Mixology', 'Winemaking', 'Wine tasting', 'Coffee brewing', 'Grilling',
        'Food blogging', 'Recipe creation'
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
        'Meteorology', 'Sailing', 'Scuba diving', 'Shuffleboard', 'Skydiving', 'Traveling',
        'Rock climbing', 'Mountain biking', 'Foraging', 'Wildlife photography', 'Stargazing'
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
        'Snowboarding', 'Surfing', 'Swimming', 'Tennis', 'Triathlons', 'Water Skiing', 'Yoga',
        'Exercise', 'Cycling', 'Weightlifting', 'Pilates', 'Meditation', 'CrossFit',
        'Boxing', 'Kickboxing', 'Zumba', 'Spinning', 'Rowing', 'Stretching',
        'Barre', 'Tai Chi', 'Volleyball', 'Baseball', 'Softball', 'Badminton'
    ],
    'Personal Development': [
        'Meditation', 'Mindfulness', 'Journaling', 'Life coaching', 'Public speaking',
        'Language learning', 'Speed reading', 'Memory training', 'Volunteering',
        'Mentoring', 'Self-improvement', 'Goal setting', 'Habit building'
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
    'Physical Activities': 'from-teal-500 to-green-500',
    'Personal Development': 'from-violet-500 to-purple-500'
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
    const [showConfetti, setShowConfetti] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set() // Start with all categories collapsed
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

            trackInterestsSaved(selectedExisting.size, selectedExploring.size);
            setShowSuccess(true);
            setShowConfetti(true);
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
            <>
            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
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
            </div>
            </>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16 relative">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/backgrounds/interests-bg.png')] bg-cover bg-center opacity-[0.12]"></div>
                </div>
                {/* Progress Bar */}
                <div className="fixed top-16 left-0 w-full h-2 bg-gray-200 z-40">
                    <div
                        className="h-full bg-gradient-to-r from-pink-600 to-orange-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                        <div className="min-h-screen flex items-center justify-center animate-fade-in">
                            <div className="max-w-2xl w-full">
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6">
                                            <HeartIllustration />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                            Your Interests
                                        </h1>
                                        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                                            Interests are activities that bring you joy and rejuvenate you. The sweet spot?
                                            Finding interests that allow you to deploy your creativity to benefit others.
                                        </p>
                                        <div className="inline-flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-full text-sm font-semibold text-pink-700 mb-8">
                                            {IntIcons.heart('w-4 h-4')}
                                            <span>LifeFrame • Step 2 of 3 • 10-15 min</span>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="bg-gradient-to-r from-pink-600 to-orange-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-pink-600/20 transition-all transform hover:scale-105"
                                            >
                                                Let's Explore →
                                            </button>
                                        </div>
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
                                            Learn how to identify activities that bring you happiness and energy. While allowing you to deploy your creativity to help others.
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

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 p-8 md:p-12">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                        How Interests Show Up in Life
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-8">
                                        Let's look at how different people experience their interests:
                                    </p>

                                    <div className="space-y-8">
                                        {/* Tim's Example */}
                                        <div className="border-l-4 border-blue-500 pl-6">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tim's Interests</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <span className="text-blue-500 mt-0.5">{IntIcons.tv()}</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Watching Sports</p>
                                                        <p className="text-gray-700 text-sm">
                                                            <strong>Joy:</strong> ✓ Yes, he enjoys it<br />
                                                            <strong>Rejuvenation:</strong> ✗ Not really<br />
                                                            <strong>Creativity/Helping Others:</strong> ✗ No
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                                    <span className="text-green-500 mt-0.5">{IntIcons.runner()}</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">HIIT Classes</p>
                                                        <p className="text-gray-700 text-sm">
                                                            <strong>Joy:</strong> ✓ Yes, loves the challenge<br />
                                                            <strong>Rejuvenation:</strong> ✓ Feels energized after<br />
                                                            <strong>Creativity/Helping Others:</strong> ✗ No
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-400">
                                                    <span className="text-emerald-600 mt-0.5">{IntIcons.handshake()}</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Problem Solving & Partnerships</p>
                                                        <p className="text-gray-700 text-sm">
                                                            <strong>Joy:</strong> ✓ Yes, finds it exciting<br />
                                                            <strong>Rejuvenation:</strong> ✓ Gets energy from it<br />
                                                            <strong>Creativity:</strong> ✓ Uses creative thinking<br />
                                                            <strong>Helping Others:</strong> ✓ Created jobs, helped millions, now assisting multiple non-profit orgranizations
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <span className="text-emerald-600">{IntIcons.target('w-4 h-4')}</span>
                                                            <p className="text-emerald-700 font-semibold text-sm">The Sweet Spot!</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Examples */}
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 hover:shadow-md transition-shadow">
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">Jess - Art School Owner</h4>
                                                <p className="text-gray-700 text-sm mb-1">
                                                    <strong>Interests:</strong> Painting & Teaching
                                                </p>
                                                <p className="text-gray-600 text-sm">
                                                    Turned her love of art into a business that addresses adult loneliness.
                                                    She gets joy, uses creativity, AND helps others combat isolation.
                                                </p>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">Laura - Fitness Trainer, Group Class Instructor</h4>
                                                <p className="text-gray-700 text-sm mb-1">
                                                    <strong>Interests:</strong> Fitness, Nutrition
                                                </p>
                                                <p className="text-gray-600 text-sm">
                                                    Loved HIIT classes so much she became an instructor. Now she gets rejuvenated
                                                    by her work AND helps others achieve their health goals.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-5">
                                            <span className="text-amber-500 flex-shrink-0 mt-0.5">{IntIcons.lightbulb('w-5 h-5')}</span>
                                            <p className="text-gray-700 text-sm">
                                                <strong>Key Insight:</strong> All interests are valid and bring value to your life.
                                                But the most fulfilling interests combine joy, rejuvenation, creativity, and service to others.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(4)}
                                            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl hover:shadow-pink-600/20 transition"
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

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 p-8 md:p-12">
                                    <div className="text-center mb-10">
                                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-500/20">
                                            {IntIcons.target('w-7 h-7')}
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                            Finding Your Sweet Spot
                                        </h2>
                                        <p className="text-lg text-gray-600">
                                            Two types of interests to identify
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 p-7 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl border border-pink-100">
                                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-pink-500/20">
                                                {IntIcons.check('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    Existing Interests
                                                </h3>
                                                <p className="text-gray-700 mb-2">
                                                    These are activities you <strong>currently engage in</strong> that bring you joy and rejuvenation.
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Examples: Reading, hiking, cooking, playing guitar, watching movies, working out,
                                                    photography, gardening, gaming, painting...
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-7 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                                                {IntIcons.star('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    Interests to Explore
                                                </h3>
                                                <p className="text-gray-700 mb-2">
                                                    These are activities you'd like to <strong>try over the next 3 months</strong>—things that spark your curiosity.
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Examples: Pottery class, learning an instrument, rock climbing, podcasting,
                                                    woodworking, yoga, creative writing, martial arts...
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-7 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-emerald-500">{IntIcons.sparkle('w-5 h-5')}</span>
                                                <h3 className="text-lg font-bold text-gray-900">The Ultimate Sweet Spot</h3>
                                            </div>
                                            <p className="text-gray-700 mb-4 text-sm">
                                                As you go through life, look for opportunities to combine interests that:
                                            </p>
                                            <ul className="space-y-2 text-gray-700 text-sm">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 font-bold mt-0.5">{IntIcons.check('w-4 h-4')}</span>
                                                    <span>Bring you <strong>joy</strong> (you genuinely enjoy them)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 font-bold mt-0.5">{IntIcons.check('w-4 h-4')}</span>
                                                    <span>Provide <strong>rejuvenation</strong> (you feel energized, not drained)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 font-bold mt-0.5">{IntIcons.check('w-4 h-4')}</span>
                                                    <span>Deploy your <strong>creativity</strong> (you can express yourself)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 font-bold mt-0.5">{IntIcons.check('w-4 h-4')}</span>
                                                    <span><strong>Benefit others</strong> (your interest helps people)</span>
                                                </li>
                                            </ul>
                                            <p className="text-emerald-700 font-semibold mt-4 text-sm">
                                                When all four align, you've found deep fulfillment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-5 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-pink-600/20 transition-all transform hover:scale-105"
                                        >
                                            Ready to Select Your Interests →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: The Worksheet */}
                    {/* Step 5: Enhanced Unified Interests Selector */}
                    {currentStep === 5 && (
                        <div className="py-8 animate-fade-in">
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-6 transition group"
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium">Back to Overview</span>
                            </button>

                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-pink-600 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-600/20">
                                        <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Your Interests</h1>
                                        <p className="text-gray-600">Discover what brings you joy and what you want to explore</p>
                                    </div>
                                </div>

                                {/* Enhanced Progress Tracker */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-bold text-gray-700">Your Progress</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                                            {selectedExisting.size + selectedExploring.size} / 10
                                        </span>
                                    </div>

                                    {/* Dual Progress Bars */}
                                    <div className="flex gap-3 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-600">✓ Existing</span>
                                                <span className={`text-xs font-bold ${selectedExisting.size >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {selectedExisting.size}/5
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (selectedExisting.size / 5) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-600">⭐ Exploring</span>
                                                <span className={`text-xs font-bold ${selectedExploring.size >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {selectedExploring.size}/5
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (selectedExploring.size / 5) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contextual Tip */}
                                    <div className="flex items-start gap-2 bg-indigo-50 rounded-lg p-3">
                                        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-indigo-800">
                                            {selectedExisting.size === 0 && selectedExploring.size === 0 ? (
                                                <><strong>Getting started:</strong> Select 5 existing interests and 5 to explore.</>
                                            ) : selectedExisting.size < 5 ? (
                                                <><strong>Good start!</strong> Add {5 - selectedExisting.size} more existing interests for a complete picture.</>
                                            ) : selectedExploring.size === 0 ? (
                                                <><strong>Great existing interests!</strong> Now add {5 - selectedExploring.size} new things you want to explore.</>
                                            ) : (
                                                <><strong>Excellent work!</strong> You can save now or keep refining your selections.</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Card - Brief */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-4 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                        <p className="text-gray-700"><strong className="text-pink-600">✓ Existing:</strong> Things you currently enjoy</p>
                                        <p className="text-gray-700"><strong className="text-blue-600">⭐ Explore:</strong> New things to try</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search 125+ interests..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-5 py-3 pl-12 rounded-xl border-2 border-gray-300 text-gray-900 focus:border-orange-500 focus:outline-none shadow-sm text-sm"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Tabs - All 9 Across */}
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(INTERESTS_BY_CATEGORY).map(([category]) => {
                                        const existingCount = (INTERESTS_BY_CATEGORY[category as keyof typeof INTERESTS_BY_CATEGORY] || []).filter(i => selectedExisting.has(i)).length;
                                        const exploringCount = (INTERESTS_BY_CATEGORY[category as keyof typeof INTERESTS_BY_CATEGORY] || []).filter(i => selectedExploring.has(i)).length;
                                        const totalSelected = existingCount + exploringCount;
                                        const isActive = expandedCategories.has(category) || (expandedCategories.size === 0 && category === Object.keys(INTERESTS_BY_CATEGORY)[0]);

                                        return (
                                            <button
                                                key={category}
                                                onClick={() => {
                                                    setExpandedCategories(new Set([category]));
                                                }}
                                                className={`
                                                    px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                                                    ${isActive
                                                        ? `bg-gradient-to-r ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} text-white shadow-lg scale-105`
                                                        : 'bg-white/80 text-gray-700 border border-gray-200 hover:border-gray-400 hover:shadow-sm'
                                                    }
                                                `}
                                            >
                                                {category}
                                                {totalSelected > 0 && (
                                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/30' : 'bg-gray-200'}`}>
                                                        {totalSelected}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Category Interests */}
                            <div className="mb-6">
                                {Object.entries(INTERESTS_BY_CATEGORY).map(([category, interests]) => {
                                    const isActive = expandedCategories.has(category) || (expandedCategories.size === 0 && category === Object.keys(INTERESTS_BY_CATEGORY)[0]);
                                    if (!isActive) return null;

                                    const filteredInterests = filterInterests(interests);

                                    return (
                                        <div key={category} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                                            {/* Category Header */}
                                            <div className={`p-4 bg-gradient-to-r ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} text-white`}>
                                                <h3 className="text-lg font-bold">{category}</h3>
                                                <p className="text-white/80 text-xs">Click to add as existing or exploring</p>
                                            </div>

                                            {/* Interests Grid - Compact */}
                                            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {filteredInterests.map((interest) => {
                                                    const isExisting = selectedExisting.has(interest);
                                                    const isExploring = selectedExploring.has(interest);
                                                    const isSelected = isExisting || isExploring;

                                                    return (
                                                        <div
                                                            key={interest}
                                                            className={`
                                                                group relative rounded-xl p-3 transition-all duration-200 border-2 cursor-pointer
                                                                ${isExisting
                                                                    ? 'bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-md border-pink-600'
                                                                    : isExploring
                                                                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md border-blue-600'
                                                                        : 'bg-white/70 text-gray-800 hover:bg-white hover:shadow-sm border-gray-200'
                                                                }
                                                            `}
                                                        >
                                                            {/* Interest Name */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`font-medium text-xs ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                                    {interest}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="text-xs bg-white/30 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                                                        {isExisting ? '✓' : '⭐'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Action Buttons - Compact */}
                                                            <div>
                                                                {!isSelected ? (
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <button
                                                                            onClick={() => toggleInterest(interest, 'existing')}
                                                                            className="px-2 py-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg text-[10px] font-bold hover:shadow-md transition"
                                                                        >
                                                                            + Existing
                                                                        </button>
                                                                        <button
                                                                            onClick={() => toggleInterest(interest, 'exploring')}
                                                                            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-[10px] font-bold hover:shadow-md transition"
                                                                        >
                                                                            + Explore
                                                                        </button>
                                                                    </div>
                                                                ) : isExisting ? (
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedExisting(prev => {
                                                                                    const newSet = new Set(prev);
                                                                                    newSet.delete(interest);
                                                                                    return newSet;
                                                                                });
                                                                                setSelectedExploring(prev => new Set([...prev, interest]));
                                                                            }}
                                                                            className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-semibold transition"
                                                                        >
                                                                            → Explore
                                                                        </button>
                                                                        <button
                                                                            onClick={() => toggleInterest(interest, 'existing')}
                                                                            className="px-2 py-1 bg-white/20 hover:bg-red-500 text-white rounded-lg text-[10px] font-semibold transition"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedExploring(prev => {
                                                                                    const newSet = new Set(prev);
                                                                                    newSet.delete(interest);
                                                                                    return newSet;
                                                                                });
                                                                                setSelectedExisting(prev => new Set([...prev, interest]));
                                                                            }}
                                                                            className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-semibold transition"
                                                                        >
                                                                            → Existing
                                                                        </button>
                                                                        <button
                                                                            onClick={() => toggleInterest(interest, 'exploring')}
                                                                            className="px-2 py-1 bg-white/20 hover:bg-red-500 text-white rounded-lg text-[10px] font-semibold transition"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick-Add Popular Interests (secondary, below categories) */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 mb-6 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🔥</span>
                                    <h3 className="font-bold text-gray-900 text-sm">Quick Add Popular Interests</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'Reading', 'Hiking', 'Cooking', 'Exercise', 'Photography',
                                        'Gaming', 'Music', 'Movies', 'Travel', 'Yoga',
                                        'Writing', 'Painting', 'Running', 'Swimming', 'Cycling',
                                        'Dancing', 'Gardening', 'Meditation', 'Podcasting', 'Drawing',
                                        'Baking', 'Camping', 'Fishing', 'Video games', 'Chess',
                                        'Guitar', 'Piano', 'Singing', 'Knitting', 'Woodworking'
                                    ].map((interest) => {
                                        const isExisting = selectedExisting.has(interest);
                                        const isExploring = selectedExploring.has(interest);
                                        const isSelected = isExisting || isExploring;

                                        return (
                                            <button
                                                key={interest}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        if (isExisting) {
                                                            setSelectedExisting(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.delete(interest);
                                                                return newSet;
                                                            });
                                                        } else {
                                                            setSelectedExploring(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.delete(interest);
                                                                return newSet;
                                                            });
                                                        }
                                                    } else {
                                                        setSelectedExisting(prev => new Set([...prev, interest]));
                                                    }
                                                }}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                    ${isSelected
                                                        ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800'
                                                        : 'bg-white hover:bg-yellow-100 text-gray-700 hover:shadow-sm border border-yellow-300'
                                                    }
                                                `}
                                            >
                                                {isSelected ? '✓' : '+'} {interest}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sticky Save Button */}
                            <div className="sticky bottom-6 flex justify-center pt-6 z-30">
                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-[0_-4px_30px_rgb(0,0,0,0.15)] border-2 border-gray-200">
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedExisting.size >= 5 && selectedExploring.size >= 5
                                                ? 'bg-green-100'
                                                : 'bg-gray-100'
                                                }`}>
                                                {selectedExisting.size >= 5 && selectedExploring.size >= 5 ? (
                                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {selectedExisting.size >= 5 && selectedExploring.size >= 5
                                                        ? 'Looking Great!'
                                                        : 'Keep Selecting...'}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {selectedExisting.size} existing • {selectedExploring.size} exploring
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const text = `My Interests\n${'='.repeat(30)}\n\nExisting Interests (${selectedExisting.size}):\n${Array.from(selectedExisting).map(i => `  • ${i}`).join('\n')}\n\nInterests to Explore (${selectedExploring.size}):\n${Array.from(selectedExploring).map(i => `  • ${i}`).join('\n')}`;
                                                const blob = new Blob([text], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'my-interests.txt';
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            disabled={selectedExisting.size === 0 && selectedExploring.size === 0}
                                            className={`
                                                px-6 py-3 rounded-full font-bold shadow-xl transition-all transform flex items-center gap-2
                                                ${(selectedExisting.size === 0 && selectedExploring.size === 0)
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-2xl hover:scale-105'
                                                }
                                            `}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export
                                        </button>

                                        <button
                                            onClick={saveInterests}
                                            disabled={saving || (selectedExisting.size === 0 && selectedExploring.size === 0)}
                                            className={`
                                                px-8 py-3 rounded-full font-bold shadow-xl transition-all transform
                                                ${saving || (selectedExisting.size === 0 && selectedExploring.size === 0)
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white hover:shadow-2xl hover:shadow-green-600/30 hover:scale-105'
                                                }
                                            `}
                                        >
                                            {saving ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Saving...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Complete & Continue
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
