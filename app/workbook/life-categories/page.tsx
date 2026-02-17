'use client';

import { trackCategoriesSaved } from '@/lib/analytics';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

// ============================================================================
// INLINE SVG ILLUSTRATIONS
// ============================================================================

const CategoriesPieIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="70" fill="url(#catGradient)" opacity="0.1" />

        {/* Pie segments */}
        <path d="M 100,100 L 100,30 A 70,70 0 0,1 161,61 Z" fill="#667eea" opacity="0.7" />
        <path d="M 100,100 L 161,61 A 70,70 0 0,1 161,139 Z" fill="#764ba2" opacity="0.7" />
        <path d="M 100,100 L 161,139 A 70,70 0 0,1 100,170 Z" fill="#f093fb" opacity="0.7" />
        <path d="M 100,100 L 100,170 A 70,70 0 0,1 39,139 Z" fill="#667eea" opacity="0.7" />
        <path d="M 100,100 L 39,139 A 70,70 0 0,1 39,61 Z" fill="#764ba2" opacity="0.7" />
        <path d="M 100,100 L 39,61 A 70,70 0 0,1 100,30 Z" fill="#f093fb" opacity="0.7" />

        {/* Center */}
        <circle cx="100" cy="100" r="30" fill="white" />
        <circle cx="100" cy="100" r="25" fill="url(#catGradient)" opacity="0.8" />
        <circle cx="100" cy="100" r="15" fill="white" />
    </svg>
);

const PurposeStarIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="purposeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
        </defs>

        {/* Glow */}
        <circle cx="100" cy="100" r="80" fill="url(#purposeGradient)" opacity="0.1" />
        <circle cx="100" cy="100" r="60" fill="url(#purposeGradient)" opacity="0.15" />

        {/* Star */}
        <path
            d="M 100,40 L 115,75 L 152,80 L 126,105 L 132,142 L 100,125 L 68,142 L 74,105 L 48,80 L 85,75 Z"
            fill="url(#purposeGradient)"
            stroke="#f59e0b"
            strokeWidth="2"
        />

        {/* Inner circle */}
        <circle cx="100" cy="100" r="25" fill="white" opacity="0.9" />
        <circle cx="100" cy="100" r="20" fill="url(#purposeGradient)" opacity="0.5" />
    </svg>
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LifeCategory = {
    name: string;
    subCategories: string[];
};

type PurposeElement = {
    name: string;
    description: string;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LifeCategoriesWorksheet() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);

    // Worksheet data
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [categoryDetails, setCategoryDetails] = useState<LifeCategory[]>([]);
    const [purposeElements, setPurposeElements] = useState<PurposeElement[]>([]);
    const [customCategory, setCustomCategory] = useState('');
    const [customSubCategory, setCustomSubCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    // Check auth and prerequisites
    // Check auth and prerequisites
    useEffect(() => {
        let mounted = true; // Prevent state updates after unmount

        const checkAuth = async () => {
            try {
                console.log('🔍 Checking auth...');
                const userWithProfile = await getUserWithProfile();

                if (!mounted) return;

                if (!userWithProfile) {
                    console.log('❌ No user, redirecting to login');
                    router.push('/login');
                    return;
                }

                console.log('✅ User found:', userWithProfile.user.email);
                setUserId(userWithProfile.user.id);

                // Check if Interests is completed (prerequisite)
                console.log('🔍 Checking interests prerequisite...');
                const { data: interestsData, error: interestsError } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'interests')
                    .single();

                if (!mounted) return;

                if (interestsError || !interestsData) {
                    console.log('❌ Interests not completed, redirecting...');
                    router.push('/workbook/interests');
                    return;
                }

                console.log('✅ Interests completed');

                // Check if they already have saved life categories
                console.log('🔍 Checking existing life categories...');
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'life_categories')
                    .single();

                if (!mounted) return;

                if (data && !error) {
                    console.log('✅ Found existing data');
                    const saved = data.content;
                    if (saved.categories) {
                        setCategoryDetails(saved.categories);
                        setSelectedCategories(new Set(saved.categories.map((c: any) => c.name)));
                    }
                    if (saved.purpose_elements) {
                        setPurposeElements(saved.purpose_elements);
                    }
                    // Start at step 3 (builder) if they have data
                    if (saved.categories || saved.purpose_elements) {
                        setCurrentStep(3);
                    }
                } else {
                    console.log('ℹ️ No existing data, starting fresh');
                }

                console.log('✅ Auth check complete');
            } catch (error) {
                console.error('💥 Auth check error:', error);
                if (mounted) {
                    router.push('/login');
                }
            } finally {
                if (mounted) {
                    console.log('🏁 Setting loading to false');
                    setLoading(false);
                }
            }
        };

        checkAuth();

        // Cleanup: prevent state updates after unmount
        return () => {
            console.log('🧹 Cleanup: component unmounting');
            mounted = false;
        };
    }, []); // ← EMPTY ARRAY - runs only once!

    const addCategory = () => {
        if (customCategory.trim()) {
            const newCategory: LifeCategory = {
                name: customCategory.trim(),
                subCategories: []
            };
            setCategoryDetails(prev => [...prev, newCategory]);
            setSelectedCategories(prev => new Set([...prev, customCategory.trim()]));
            setCustomCategory('');
        }
    };

    const addSubCategory = (categoryName: string) => {
        if (customSubCategory.trim()) {
            setCategoryDetails(prev => prev.map(cat =>
                cat.name === categoryName
                    ? { ...cat, subCategories: [...cat.subCategories, customSubCategory.trim()] }
                    : cat
            ));
            setCustomSubCategory('');
            setEditingCategory(null);
        }
    };

    const removeSubCategory = (categoryName: string, subCat: string) => {
        setCategoryDetails(prev => prev.map(cat =>
            cat.name === categoryName
                ? { ...cat, subCategories: cat.subCategories.filter(s => s !== subCat) }
                : cat
        ));
    };

    const addPurposeElement = () => {
        setPurposeElements(prev => [...prev, { name: '', description: '' }]);
    };

    const updatePurposeElement = (index: number, field: 'name' | 'description', value: string) => {
        setPurposeElements(prev => prev.map((el, i) =>
            i === index ? { ...el, [field]: value } : el
        ));
    };

    const removePurposeElement = (index: number) => {
        setPurposeElements(prev => prev.filter((_, i) => i !== index));
    };

    const saveCategories = async () => {
        if (!userId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'life_categories',
                    content: {
                        categories: categoryDetails,
                        purpose_elements: purposeElements.filter(p => p.name.trim() !== '')
                    }
                }, {
                    onConflict: 'user_id,category'
                });

            if (error) throw error;

            trackCategoriesSaved(categoryDetails.length);
            setShowSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving categories:', error);
            alert('Failed to save life categories. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Checking prerequisites...</p>
                    </div>
                </div>
            </>
        );
    }

    if (showSuccess) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pt-16 flex items-center justify-center">
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">LifeFrame Complete! ✨</h2>
                        <p className="text-xl text-gray-600">Redirecting to your dashboard...</p>
                    </div>
                </div>
            </>
        );
    }

    // Helper function for category colors
    const getCategoryColor = (name: string) => {
        const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
            'Health': { bg: 'from-red-500 to-pink-500', text: 'text-red-700', glow: 'shadow-red-500/20', border: 'border-red-200' },
            'Relationships': { bg: 'from-pink-500 to-rose-500', text: 'text-pink-700', glow: 'shadow-pink-500/20', border: 'border-pink-200' },
            'Community': { bg: 'from-purple-500 to-indigo-500', text: 'text-purple-700', glow: 'shadow-purple-500/20', border: 'border-purple-200' },
            'Education': { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-700', glow: 'shadow-blue-500/20', border: 'border-blue-200' },
            'Career': { bg: 'from-cyan-500 to-teal-500', text: 'text-cyan-700', glow: 'shadow-cyan-500/20', border: 'border-cyan-200' },
            'Financial': { bg: 'from-green-500 to-emerald-500', text: 'text-green-700', glow: 'shadow-green-500/20', border: 'border-green-200' },
            'Spirituality': { bg: 'from-amber-500 to-yellow-500', text: 'text-amber-700', glow: 'shadow-amber-500/20', border: 'border-amber-200' },
            'Creative': { bg: 'from-orange-500 to-red-500', text: 'text-orange-700', glow: 'shadow-orange-500/20', border: 'border-orange-200' }
        };
        return colorMap[name] || { bg: 'from-indigo-500 to-purple-500', text: 'text-indigo-700', glow: 'shadow-indigo-500/20', border: 'border-indigo-200' };
    };

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
                {/* Progress Bar */}
                <div className="fixed top-16 left-0 w-full h-1.5 bg-gray-200 z-40">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
                            <div className="max-w-2xl w-full">
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6">
                                            <CategoriesPieIllustration />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                            Life Categories
                                        </h1>
                                        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                                            Life Categories are the areas of your life that you want to focus on and set goals within. They provide structure to your Roadmap and help ensure you're making progress across all asepects of your life that matter to you.
                                        </p>
                                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-sm font-semibold text-indigo-700 mb-8">
                                            <span>📚</span>
                                            <span>LifeFrame • Step 3 of 3 • 15-20 min</span>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all transform hover:scale-105"
                                        >
                                            Let's Begin →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Video + Tim's Example Combined */}
                    {currentStep === 2 && (
                        <div className="min-h-[80vh] py-8 animate-fade-in">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-6 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>

                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Video Card */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20">
                                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-xl font-semibold mb-1">Video Coming Soon</p>
                                            <p className="text-gray-300 text-sm">Life Categories Explained</p>
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                            4 min
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            Understanding Categories & Purpose
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Tim explains how to identify your life areas and define meaningful purpose elements.
                                        </p>
                                    </div>
                                </div>

                                {/* Tim's Example */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Tim's Example</h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                            <h4 className="font-bold text-gray-900 mb-1">Health</h4>
                                            <p className="text-xs text-gray-600">Physical • Mental</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                                            <h4 className="font-bold text-gray-900 mb-1">Relationships</h4>
                                            <p className="text-xs text-gray-600">Family • Friends • Partnership • Community</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                            <h4 className="font-bold text-gray-900 mb-1">Purpose</h4>
                                            <p className="text-xs text-gray-600">Help Others • Environment</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                                            <h4 className="font-bold text-gray-900 mb-1">Career</h4>
                                            <p className="text-xs text-gray-600">Business Growth • Leadership Development • Impacting Academic Growth</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <p className="text-xs text-gray-700">
                                            💡 <strong>Insight:</strong> Categories evolved over time—balance came gradually.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Purpose Explanation */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-yellow-100">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-16 h-16 flex-shrink-0">
                                        <PurposeStarIllustration />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Understanding Purpose</h3>
                                        <p className="text-gray-700 mb-4">
                                            Purpose is driven by long-term goals that are <strong>meaningful to you</strong> and <strong>beneficial to others</strong>.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-900 mb-2">Questions to ask:</p>
                                                <ul className="space-y-1 text-gray-700">
                                                    <li>• What impact do I want to make?</li>
                                                    <li>• How can I help others?</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 mb-2">Examples:</p>
                                                <ul className="space-y-1 text-gray-700">
                                                    <li>• Help Others</li>
                                                    <li>• Mentor Youth</li>
                                                    <li>• Address Loneliness</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all"
                                >
                                    Start Building →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enhanced Builder */}
                    {currentStep === 3 && (
                        <div className="py-8 animate-fade-in">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-6 transition group"
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium">Back to Learning</span>
                            </button>

                            {/* Header with Enhanced Progress */}
                            <div className="mb-8">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Build Your LifeFrame</h1>
                                            <p className="text-gray-600">Choose categories, then define your purpose</p>
                                        </div>
                                    </div>

                                    {/* Completion Indicator */}
                                    <div className="flex items-center gap-2">
                                        {categoryDetails.length >= 3 && purposeElements.filter(p => p.name.trim()).length >= 1 ? (
                                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-bold text-green-700">Ready to save!</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full">
                                                <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-bold text-blue-700">Keep building...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enhanced Progress Tracker with Milestones */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] hover:-translate-y-0.5 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-bold text-gray-700">Your Progress</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            {categoryDetails.length + purposeElements.filter(p => p.name.trim()).length} / 4
                                        </span>
                                    </div>

                                    {/* Visual Progress Steps */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {[
                                            { label: '3 Categories', count: 3, type: 'categories' },
                                            { label: '1 Purpose', count: 1, type: 'purpose' }
                                        ].map((milestone, idx) => {
                                            const currentCount = milestone.type === 'categories' ? categoryDetails.length : purposeElements.filter(p => p.name.trim()).length;
                                            const isComplete = currentCount >= milestone.count;

                                            return (
                                                <div key={idx} className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-gray-600">{milestone.label}</span>
                                                        <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {currentCount}/{milestone.count}
                                                        </span>
                                                    </div>
                                                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${milestone.type === 'categories'
                                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                                                }`}
                                                            style={{ width: `${Math.min(100, (currentCount / milestone.count) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Motivational Message */}
                                    <div className="flex items-start gap-2 bg-indigo-50 rounded-lg p-3">
                                        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-indigo-800">
                                            {categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0 ? (
                                                <><strong>Getting started:</strong> Pick 3-5 life areas that matter most to you, then add at least one purpose element.</>
                                            ) : categoryDetails.length < 3 ? (
                                                <><strong>Nice start!</strong> Add {3 - categoryDetails.length} more {categoryDetails.length === 2 ? 'category' : 'categories'} to reach the minimum.</>
                                            ) : purposeElements.filter(p => p.name.trim()).length === 0 ? (
                                                <><strong>Great categories!</strong> Now define your purpose — how will you make a positive impact?</>
                                            ) : (
                                                <><strong>Excellent work!</strong> You can save now, or keep refining your LifeFrame.</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Two-Column Layout for Desktop */}
                            <div className="grid lg:grid-cols-2 gap-8 mb-10">

                                {/* LEFT: Categories Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">
                                                1
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Life Categories</h2>
                                                <p className="text-sm text-gray-600">Pick 3-8 areas to focus on</p>
                                            </div>
                                        </div>
                                        {categoryDetails.length > 0 && (
                                            <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                                                <span className="text-sm font-bold text-blue-700">{categoryDetails.length} selected</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Cards Grid - DEFAULT + CUSTOM */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Default categories */}
                                        {[
                                            { name: 'Health', emoji: '💪', desc: 'Physical & mental wellbeing' },
                                            { name: 'Relationships', emoji: '❤️', desc: 'Family, friends, love' },
                                            { name: 'Community', emoji: '🤝', desc: 'Belonging & connection' },
                                            { name: 'Education', emoji: '📚', desc: 'Learning & growth' },
                                            { name: 'Career', emoji: '💼', desc: 'Work & professional goals' },
                                            { name: 'Financial', emoji: '💰', desc: 'Money & security' },
                                            { name: 'Spirituality', emoji: '🙏', desc: 'Faith & inner peace' },
                                            { name: 'Creative', emoji: '🎨', desc: 'Art & expression' }
                                        ].map((cat) => {
                                            const isSelected = selectedCategories.has(cat.name);
                                            const colors = getCategoryColor(cat.name);

                                            return (
                                                <button
                                                    key={cat.name}
                                                    onClick={() => {
                                                        const newSelected = new Set(selectedCategories);
                                                        if (isSelected) {
                                                            newSelected.delete(cat.name);
                                                            setCategoryDetails(prev => prev.filter(c => c.name !== cat.name));
                                                        } else {
                                                            newSelected.add(cat.name);
                                                            const existing = categoryDetails.find(c => c.name === cat.name);
                                                            if (!existing) {
                                                                setCategoryDetails(prev => [...prev, { name: cat.name, subCategories: [] }]);
                                                            }
                                                        }
                                                        setSelectedCategories(newSelected);
                                                    }}
                                                    className={`
                                                        group relative p-4 rounded-2xl transition-all duration-300 text-left
                                                        ${isSelected
                                                            ? `bg-gradient-to-br ${colors.bg} text-white shadow-xl ${colors.glow} scale-[1.02] ring-2 ring-white ring-offset-2`
                                                            : 'bg-white/80 backdrop-blur-sm border-2 border-gray-100 text-gray-700 shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-indigo-300 hover:scale-[1.01]'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="text-3xl">{cat.emoji}</div>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                        {cat.name}
                                                    </div>
                                                    <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                                        {cat.desc}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {/* CUSTOM CATEGORIES - Show them in the grid! */}
                                        {categoryDetails
                                            .filter(cat => ![
                                                'Health', 'Relationships', 'Community', 'Education',
                                                'Career', 'Financial', 'Spirituality', 'Creative'
                                            ].includes(cat.name))
                                            .map((cat) => {
                                                const isSelected = selectedCategories.has(cat.name);
                                                const colors = getCategoryColor(cat.name);

                                                return (
                                                    <button
                                                        key={cat.name}
                                                        onClick={() => {
                                                            const newSelected = new Set(selectedCategories);
                                                            if (isSelected) {
                                                                newSelected.delete(cat.name);
                                                                setCategoryDetails(prev => prev.filter(c => c.name !== cat.name));
                                                            } else {
                                                                newSelected.add(cat.name);
                                                            }
                                                            setSelectedCategories(newSelected);
                                                        }}
                                                        className={`
                                                            group relative p-4 rounded-2xl transition-all duration-300 text-left
                                                            ${isSelected
                                                                ? `bg-gradient-to-br ${colors.bg} text-white shadow-xl ${colors.glow} scale-[1.02] ring-2 ring-white ring-offset-2`
                                                                : 'bg-white/80 backdrop-blur-sm border-2 border-gray-100 text-gray-700 shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-indigo-300 hover:scale-[1.01]'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="text-3xl">✨</div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                            {cat.name}
                                                        </div>
                                                        <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                                            Custom category
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>

                                    {/* Custom Category Input */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-dashed border-gray-300">
                                        <p className="text-xs font-semibold text-gray-600 mb-3">Don't see what you need?</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="e.g., Travel, Hobbies, Adventure..."
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-indigo-600 focus:outline-none text-sm font-medium text-gray-900"
                                            />
                                            <button
                                                onClick={addCategory}
                                                disabled={!customCategory.trim()}
                                                className={`
                                                    px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                                    ${customCategory.trim()
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-600/20'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-Categories Section - ONLY shows if categories selected */}
                                    {categoryDetails.length > 0 && (
                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-white/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900">Add Details (Optional)</h3>
                                                <span className="text-xs text-gray-500">Refine your categories</span>
                                            </div>
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                {categoryDetails.map((category) => (
                                                    <div
                                                        key={category.name}
                                                        className="group bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-indigo-300 hover:bg-white transition-all"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setCategoryDetails(prev => prev.filter(c => c.name !== category.name));
                                                                    setSelectedCategories(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(category.name);
                                                                        return newSet;
                                                                    });
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Show existing sub-categories */}
                                                        {category.subCategories.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                {category.subCategories.map((sub) => (
                                                                    <div key={sub} className="bg-indigo-100 px-2 py-0.5 rounded-md text-xs text-indigo-700 flex items-center gap-1">
                                                                        {sub}
                                                                        <button
                                                                            onClick={() => removeSubCategory(category.name, sub)}
                                                                            className="hover:text-red-600"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add sub-category input */}
                                                        {editingCategory === category.name ? (
                                                            <div className="flex gap-1.5">
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g., Physical Health, Mental Health..."
                                                                    value={customSubCategory}
                                                                    onChange={(e) => setCustomSubCategory(e.target.value)}
                                                                    onKeyPress={(e) => e.key === 'Enter' && addSubCategory(category.name)}
                                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs text-gray-900"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => addSubCategory(category.name)}
                                                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCategory(null);
                                                                        setCustomSubCategory('');
                                                                    }}
                                                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingCategory(category.name)}
                                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                                            >
                                                                + Add sub-category
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: Purpose Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20">
                                                ⭐
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Your Purpose</h2>
                                                <p className="text-sm text-gray-600">How will you make an impact?</p>
                                            </div>
                                        </div>
                                        {purposeElements.filter(p => p.name.trim()).length > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full">
                                                <span className="text-sm font-bold text-yellow-700">{purposeElements.filter(p => p.name.trim()).length} added</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Examples */}
                                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
                                        <p className="text-xs font-semibold text-gray-700 mb-3">💡 Quick Add:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Help Others', 'Help Environment', 'Mentor Youth', 'Address Loneliness'].map((example) => (
                                                <button
                                                    key={example}
                                                    onClick={() => {
                                                        if (!purposeElements.find(p => p.name === example)) {
                                                            setPurposeElements(prev => [...prev, { name: example, description: '' }]);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-white hover:bg-yellow-100 text-gray-700 rounded-lg text-xs font-medium transition shadow-sm hover:shadow-md"
                                                >
                                                    + {example}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Purpose Elements */}
                                    <div className="space-y-3">
                                        {purposeElements.map((element, index) => (
                                            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Purpose element (e.g., Help Others)"
                                                            value={element.name}
                                                            onChange={(e) => updatePurposeElement(index, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none font-semibold text-sm mb-2 text-gray-900"
                                                        />
                                                        <textarea
                                                            placeholder="How will you achieve this? (optional)"
                                                            value={element.description}
                                                            onChange={(e) => updatePurposeElement(index, 'description', e.target.value)}
                                                            rows={2}
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none text-xs text-gray-900"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removePurposeElement(index)}
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={addPurposeElement}
                                            className="w-full py-3.5 border-2 border-dashed border-yellow-300 rounded-2xl text-yellow-700 hover:bg-yellow-50 font-semibold text-sm transition hover:border-yellow-400"
                                        >
                                            + Add Purpose Element
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button - Fixed at bottom */}
                            <div className="sticky bottom-6 flex justify-center gap-3 pt-6">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:border-indigo-600 hover:text-indigo-600 transition shadow-lg"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={saveCategories}
                                    disabled={saving || (categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0)}
                                    className={`
                    px-10 py-3 rounded-full font-bold shadow-2xl transition-all transform hover:scale-105
                    ${saving || (categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-green-600/20'
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
                                    ) : '✓ Complete LifeFrame'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}