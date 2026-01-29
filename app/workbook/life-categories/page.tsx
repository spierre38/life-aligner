'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

type LifeCategory = {
    name: string;
    subCategories: string[];
};

type PurposeElement = {
    name: string;
    description: string;
};

export default function LifeCategoriesWorksheet() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);

    // Worksheet data
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
        new Set(['Health', 'Relationships', 'Community', 'Education', 'Career', 'Financial', 'Spirituality'])
    );
    const [categoryDetails, setCategoryDetails] = useState<LifeCategory[]>([]);
    const [purposeElements, setPurposeElements] = useState<PurposeElement[]>([]);
    const [customCategory, setCustomCategory] = useState('');
    const [customSubCategory, setCustomSubCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    // Check auth and prerequisites
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUserId(userWithProfile.user.id);

                // Check if Interests is completed (prerequisite)
                const { data: interestsData, error: interestsError } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'interests')
                    .single();

                if (interestsError || !interestsData) {
                    console.log('Interests worksheet not completed, redirecting...');
                    router.push('/workbook/interests');
                    return;
                }

                // Check if they already have saved life categories
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'life_categories')
                    .single();

                if (data && !error) {
                    const saved = data.content;
                    if (saved.categories) {
                        setCategoryDetails(saved.categories);
                    }
                    if (saved.purpose_elements) {
                        setPurposeElements(saved.purpose_elements);
                    }
                    // Start at step 5 if they have data
                    if (saved.categories || saved.purpose_elements) {
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
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Life Categories Saved! ✨</h2>
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
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12">
                    {/* Step 1: Introduction (Purple Gradient - Like Page 16) */}
                    {currentStep === 1 && (
                        <div className="min-h-screen flex items-center justify-center animate-fade-in">
                            <div className="relative">
                                {/* Purple gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#a78bca] via-[#8b5fbf] to-[#5d2a8f] rounded-3xl transform rotate-1"></div>
                                <div className="relative bg-white rounded-3xl p-12 shadow-2xl max-w-3xl">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6">
                                            🎯
                                        </div>
                                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                                            Your Life Categories
                                        </h1>
                                        <p className="text-xl text-gray-800 leading-relaxed mb-8">
                                            Life Categories are the key areas of your life that you want to focus on and set goals within.
                                            They provide structure to your roadmap and help you ensure you're making progress across
                                            all aspects of your life that matter to you.
                                        </p>
                                        <p className="text-lg text-gray-700 mb-8">
                                            LifeFrame • Step 3 of 5 • 15-20 minutes
                                        </p>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                                        >
                                            Let's Begin →
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
                                    {/* Video Placeholder */}
                                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-2xl font-semibold mb-2">Video Coming Soon</p>
                                            <p className="text-gray-300">Understanding Life Categories & Purpose</p>
                                        </div>
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                            4 min
                                        </div>
                                    </div>

                                    {/* Video Description */}
                                    <div className="p-8">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                            Life Categories & Purpose Explained
                                        </h2>
                                        <p className="text-gray-800 mb-6">
                                            In this video, Tim Collins explains how to identify the key areas of your life,
                                            create meaningful sub-categories, and most importantly - define your Purpose.
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
                                            >
                                                Continue →
                                            </button>
                                            <button
                                                onClick={() => setCurrentStep(1)}
                                                className="px-8 py-4 rounded-full font-bold border-2 border-gray-300 text-gray-800 hover:border-purple-600 hover:text-purple-600 transition"
                                            >
                                                ← Back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Tim's Example (Like Page 17) */}
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
                                        Tim's Life Categories Example
                                    </h2>
                                    <p className="text-lg text-gray-800 mb-8">
                                        Here's how Tim Collins organized his Life Categories and Purpose over time:
                                    </p>

                                    <div className="space-y-6">
                                        {/* Example Categories */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-3">Health</h3>
                                                <p className="text-sm text-gray-700 mb-2">Sub-categories:</p>
                                                <ul className="text-gray-800 space-y-1">
                                                    <li>• Physical Health</li>
                                                    <li>• Mental Health</li>
                                                </ul>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-3">Relationships</h3>
                                                <p className="text-sm text-gray-700 mb-2">Sub-categories:</p>
                                                <ul className="text-gray-800 space-y-1">
                                                    <li>• Family</li>
                                                    <li>• Friends</li>
                                                    <li>• Partnership</li>
                                                </ul>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-3">Career</h3>
                                                <p className="text-sm text-gray-700 mb-2">Sub-categories:</p>
                                                <ul className="text-gray-800 space-y-1">
                                                    <li>• Business Growth</li>
                                                    <li>• Leadership Development</li>
                                                </ul>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-3">Purpose</h3>
                                                <p className="text-sm text-gray-700 mb-2">Elements:</p>
                                                <ul className="text-gray-800 space-y-1">
                                                    <li>• Help Others</li>
                                                    <li>• Help the Environment</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                            <p className="text-gray-800 italic">
                                                💡 <strong>Tim's Insight:</strong> "My categories evolved significantly over time.
                                                In my 20s, I focused only on Health and Career. In my 30s, I added Relationships
                                                and Purpose. Balance came gradually as I learned what truly mattered to me."
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex gap-4">
                                        <button
                                            onClick={() => setCurrentStep(4)}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
                                        >
                                            Next: Purpose Explained →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Purpose Explanation (Like Page 18) */}
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
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
                                            ⭐
                                        </div>
                                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                            Understanding Purpose
                                        </h2>
                                        <p className="text-xl text-gray-800">
                                            The most important Life Category
                                        </p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border-2 border-indigo-200">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">What is Purpose?</h3>
                                            <p className="text-gray-800 leading-relaxed">
                                                Purpose is possessing a deeply held belief in the value of one's life, driven by
                                                long-term goals that are both <strong>meaningful to you</strong> and{' '}
                                                <strong>beneficial to others</strong>.
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-gray-50 rounded-xl">
                                                <h4 className="font-bold text-gray-900 mb-3">Questions to Ask:</h4>
                                                <ul className="space-y-2 text-gray-800">
                                                    <li>• What problems do I want to help solve?</li>
                                                    <li>• What impact do I want to make?</li>
                                                    <li>• How can I use my creativity to benefit others?</li>
                                                    <li>• What defines success for me personally?</li>
                                                </ul>
                                            </div>

                                            <div className="p-6 bg-gray-50 rounded-xl">
                                                <h4 className="font-bold text-gray-900 mb-3">Example Elements:</h4>
                                                <ul className="space-y-2 text-gray-800">
                                                    <li>• Help Others</li>
                                                    <li>• Help the Environment</li>
                                                    <li>• Mentor Youth</li>
                                                    <li>• Address Adult Loneliness</li>
                                                    <li>• Improve Teen Financial Literacy</li>
                                                    <li>• Cure Alzheimer's</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                            <p className="text-gray-800">
                                                <strong>Remember:</strong> You don't need to change the world in a major way.
                                                As Mother Teresa said: <em>"Not all of us can do great things. But we can do
                                                    small things with great love."</em>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-5 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                                        >
                                            Ready to Define Your Categories →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Gamified Card Builder */}
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

                            {/* Header with Progress */}
                            <div className="mb-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        🎯
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900">Build Your LifeFrame</h1>
                                        <p className="text-lg text-gray-800">Select categories, then define your purpose</p>
                                    </div>
                                </div>

                                {/* Visual Progress Tracker */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                                        <span className="text-sm font-bold text-indigo-600">
                                            {categoryDetails.length + purposeElements.filter(p => p.name.trim()).length} items
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-600">Categories</span>
                                                <span className="text-xs font-bold text-blue-600">{categoryDetails.length}</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (categoryDetails.length / 5) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-600">Purpose</span>
                                                <span className="text-xs font-bold text-yellow-600">
                                                    {purposeElements.filter(p => p.name.trim()).length}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (purposeElements.filter(p => p.name.trim()).length / 3) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 5A: Pick Your Categories */}
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Pick Your Categories</h2>
                                        <p className="text-gray-800">Tap to add to your LifeFrame (aim for 5-8)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    {[
                                        { name: 'Health', emoji: '💪', color: 'from-red-500 to-pink-500' },
                                        { name: 'Relationships', emoji: '❤️', color: 'from-pink-500 to-rose-500' },
                                        { name: 'Community', emoji: '🤝', color: 'from-purple-500 to-indigo-500' },
                                        { name: 'Education', emoji: '📚', color: 'from-blue-500 to-cyan-500' },
                                        { name: 'Career', emoji: '💼', color: 'from-cyan-500 to-teal-500' },
                                        { name: 'Financial', emoji: '💰', color: 'from-green-500 to-emerald-500' },
                                        { name: 'Spirituality', emoji: '🙏', color: 'from-amber-500 to-yellow-500' },
                                        { name: 'Creative', emoji: '🎨', color: 'from-orange-500 to-red-500' }
                                    ].map((cat) => {
                                        const isSelected = selectedCategories.has(cat.name);
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
                          relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-105
                          ${isSelected
                                                        ? `bg-gradient-to-br ${cat.color} text-white shadow-xl scale-105`
                                                        : 'bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-800'
                                                    }
                        `}
                                            >
                                                <div className="text-3xl mb-2">{cat.emoji}</div>
                                                <div className="font-bold text-sm">{cat.name}</div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Add Custom Category - Simplified */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="+ Add your own category (e.g., Travel, Hobbies)"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                                            className="flex-1 px-4 py-3 text-gray-900 rounded-lg border-2 border-gray-300 focus:border-indigo-600 focus:outline-none"
                                        />
                                        <button
                                            onClick={addCategory}
                                            disabled={!customCategory.trim()}
                                            className={`
                        px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap
                        ${customCategory.trim()
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }
                      `}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 5B: Your Selected Categories (Editable Cards) */}
                            {categoryDetails.length > 0 && (
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                                            2
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Refine Your Categories</h2>
                                            <p className="text-gray-800">Optional: Add sub-categories for more detail</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {categoryDetails.map((category) => (
                                            <div key={category.name} className="bg-white rounded-xl border-2 border-indigo-200 p-5 hover:shadow-lg transition">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                                                    <button
                                                        onClick={() => {
                                                            setCategoryDetails(prev => prev.filter(c => c.name !== category.name));
                                                            setSelectedCategories(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.delete(category.name);
                                                                return newSet;
                                                            });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Sub-categories display */}
                                                {category.subCategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {category.subCategories.map((sub) => (
                                                            <div key={sub} className="bg-indigo-50 px-3 py-1 rounded-full text-sm text-indigo-700 flex items-center gap-1">
                                                                {sub}
                                                                <button
                                                                    onClick={() => removeSubCategory(category.name, sub)}
                                                                    className="hover:text-red-500"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add sub-category */}
                                                {editingCategory === category.name ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Add detail..."
                                                            value={customSubCategory}
                                                            onChange={(e) => setCustomSubCategory(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && addSubCategory(category.name)}
                                                            className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-sm"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => addSubCategory(category.name)}
                                                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCategory(null)}
                                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingCategory(category.name)}
                                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                                                    >
                                                        + Add sub-category
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5C: Define Your Purpose */}
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                                        ⭐
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Define Your Purpose</h2>
                                        <p className="text-gray-800">How will you make a positive impact?</p>
                                    </div>
                                </div>

                                {/* Quick-add examples */}
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 mb-6">
                                    <p className="text-sm font-semibold text-gray-800 mb-3">💡 Quick Add Examples:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Help Others', 'Help the Environment', 'Mentor Youth', 'Address Adult Loneliness',
                                            'Improve Teen Financial Literacy', 'Protect My Family'].map((example) => (
                                                <button
                                                    key={example}
                                                    onClick={() => {
                                                        if (!purposeElements.find(p => p.name === example)) {
                                                            setPurposeElements(prev => [...prev, { name: example, description: '' }]);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-white hover:bg-yellow-100 text-gray-800 rounded-lg text-sm font-medium transition shadow-sm hover:shadow"
                                                >
                                                    + {example}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                {/* Purpose elements */}
                                <div className="space-y-4">
                                    {purposeElements.map((element, index) => (
                                        <div key={index} className="bg-white rounded-xl border-2 border-yellow-300 p-5 shadow-sm hover:shadow-md transition">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Your purpose (e.g., Help Others)"
                                                        value={element.name}
                                                        onChange={(e) => updatePurposeElement(index, 'name', e.target.value)}
                                                        className="w-full px-4 py-2 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none font-semibold mb-2"
                                                    />
                                                    <textarea
                                                        placeholder="How will you achieve this? (optional)"
                                                        value={element.description}
                                                        onChange={(e) => updatePurposeElement(index, 'description', e.target.value)}
                                                        rows={2}
                                                        className="w-full px-4 py-2 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removePurposeElement(index)}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addPurposeElement}
                                        className="w-full py-4 border-2 border-dashed border-yellow-300 rounded-xl text-yellow-700 hover:bg-yellow-50 font-semibold transition"
                                    >
                                        + Add Another Purpose Element
                                    </button>
                                </div>
                            </div>

                            {/* Save Button - Sticky at bottom */}
                            <div className="sticky bottom-8 flex justify-center gap-4 pt-6">
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-800 rounded-full font-bold text-lg hover:border-indigo-600 hover:text-indigo-600 transition shadow-lg"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={saveCategories}
                                    disabled={saving || (categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0)}
                                    className={`
                    px-12 py-4 rounded-full font-bold text-xl shadow-2xl transition-all transform hover:scale-105
                    ${saving || (categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-2xl'
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
