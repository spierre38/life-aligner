'use client';

import { trackCategoriesSaved } from '@/lib/analytics';
import { evaluateLifeFrameCompletion } from '@/lib/lifeframe-completion';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { Confetti } from '@/app/components/Confetti';
import SpaceLaunchAnimation from '@/app/components/SpaceLaunchAnimation';

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
// SUB-CATEGORY EXAMPLES — per workbook
// ============================================================================

const SUBCATEGORY_EXAMPLES: Record<string, string[]> = {
    'Health':        ['Physical Health', 'Mental Health', 'Nutrition', 'Sleep', 'Fitness', 'Preventive Care'],
    'Relationships': ['Spouse / Partner', 'Children', 'Parents', 'Siblings', 'Close Friends', 'Extended Family'],
    'Community':     ['Volunteering', 'Civic Engagement', 'Neighborhood', 'Faith Community', 'Clubs & Groups'],
    'Education':     ['Formal Degree', 'Online Courses', 'Reading', 'Skill Development', 'Mentorship'],
    'Career':        ['Job Performance', 'Leadership', 'Networking', 'Side Projects', 'Work-Life Balance'],
    'Financial':     ['Savings', 'Investing', 'Debt Reduction', 'Budgeting', 'Retirement Planning'],
    'Spirituality':  ['Prayer / Meditation', 'Faith Practice', 'Inner Peace', 'Mindfulness', 'Gratitude'],
    'Creative':      ['Art & Design', 'Writing', 'Music', 'Photography', 'Crafts & Making'],
};

export default function LifeCategoriesWorksheet() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSpaceLaunch, setShowSpaceLaunch] = useState(false);
    const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
    const [isStepAnimating, setIsStepAnimating] = useState(false);

    const goToStep = (next: number) => {
        const dir = next > currentStep ? 'forward' : 'backward';
        setStepDirection(dir);
        setIsStepAnimating(true);
        setTimeout(() => {
            setCurrentStep(next);
            setIsStepAnimating(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 250);
    };


    // Micro-animation state
    const [pulsingCard, setPulsingCard] = useState<string | null>(null);
    const [newPurposeIdx, setNewPurposeIdx] = useState<number | null>(null);

    // Worksheet data
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [categoryDetails, setCategoryDetails] = useState<LifeCategory[]>([]);
    const [purposeElements, setPurposeElements] = useState<PurposeElement[]>([]);
    const [customCategory, setCustomCategory] = useState('');
    const [customSubCategory, setCustomSubCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    // Check auth and prerequisites
    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const userWithProfile = await getUserWithProfile();

                if (!mounted) return;

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

                if (!mounted) return;

                if (interestsError || !interestsData) {
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

                if (!mounted) return;

                if (data && !error) {
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
                }
            } catch (error) {
                console.error('Auth check error:', error);
                if (mounted) {
                    router.push('/login');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        checkAuth();

        return () => { mounted = false; };
    }, []);

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
        setPurposeElements(prev => {
            const next = [...prev, { name: '', description: '' }];
            setNewPurposeIdx(next.length - 1);
            setTimeout(() => setNewPurposeIdx(null), 500);
            return next;
        });
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

            // Re-evaluate full LifeFrame completion after save
            const { data: allEntries } = await supabase
                .from('workbook_entries')
                .select('category, content')
                .eq('user_id', userId);

            const completion = evaluateLifeFrameCompletion(allEntries || []);

            if (completion.allComplete) {
                // LifeFrame unlocked → show rocket cinematic!
                setShowSpaceLaunch(true);
            } else {
                // Saved but LifeFrame not yet complete
                setShowSuccess(true);
                setShowConfetti(true);
                setTimeout(() => { router.push('/dashboard'); }, 2000);
            }
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
                <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                    <div className="text-center">
                        <div
                            className="w-14 h-14 rounded-full animate-spin mx-auto mb-4"
                            style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-text)' }}
                        />
                        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Checking prerequisites...</p>
                    </div>
                </div>
            </>
        );
    }

    if (showSpaceLaunch) {
        const handleLaunchComplete = () => {
            router.push('/dashboard');
        };
        return (
            <SpaceLaunchAnimation
                categories={categoryDetails.map(c => c.name)}
                onComplete={handleLaunchComplete}
            />
        );
    }

    if (showSuccess) {
        return (
            <>
                <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
                <AuthNavbar />
                <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                    <div className="text-center">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: 'rgba(0,200,100,0.15)', border: '2px solid rgba(0,200,100,0.4)' }}
                        >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(0,200,100,0.9)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-light mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>LifeFrame Complete ✦</h2>
                        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Redirecting to your dashboard...</p>
                    </div>
                </div>
            </>
        );
    }

    // Helper function for category colors
    const getCategoryColor = (name: string) => {
        const colorMap: Record<string, { accent: string; glow: string; border: string }> = {
            'Health': { accent: 'rgba(239,68,68,0.8)', glow: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
            'Relationships': { accent: 'rgba(236,72,153,0.8)', glow: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)' },
            'Community': { accent: 'rgba(168,85,247,0.8)', glow: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
            'Education': { accent: 'rgba(59,130,246,0.8)', glow: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
            'Career': { accent: 'rgba(6,182,212,0.8)', glow: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)' },
            'Financial': { accent: 'rgba(34,197,94,0.8)', glow: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
            'Spirituality': { accent: 'rgba(245,158,11,0.8)', glow: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
            'Creative': { accent: 'rgba(249,115,22,0.8)', glow: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' }
        };
        return colorMap[name] || { accent: 'rgba(139,92,246,0.8)', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' };
    };

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen pt-16" style={{ background: 'var(--color-bg)' }}>
                {/* Progress Bar */}
                <div className="fixed top-16 left-0 w-full h-[2px] z-40" style={{ background: 'var(--color-surface-2)' }}>
                    <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%`, background: 'var(--color-text)' }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                        <div className="min-h-[80vh] flex items-center justify-center animate-slide-in-up">
                            <div className="max-w-2xl w-full">
                                <div
                                    className="rounded-3xl p-8 md:p-12"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6">
                                            <CategoriesPieIllustration />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-light mb-6" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            Life Categories
                                        </h1>
                                        <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
                                            Life Categories are the areas of your life that you want to focus on and set goals within. They provide structure to your Roadmap and help ensure you're making progress across all aspects of your life that matter to you.
                                        </p>
                                        <div
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
                                            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                                        >
                                            <span>📚</span>
                                            <span>LifeFrame • Step 3 of 3 • 15-20 min</span>
                                        </div>
                                        <button
                                            onClick={() => goToStep(2)}
                                            className="px-10 py-4 rounded-full font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
                                            style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
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
                        <div className={`min-h-[80vh] py-8 ${isStepAnimating ? (stepDirection === 'forward' ? 'step-exit-forward' : 'step-exit-backward') : (stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward')}`}>
                            <button
                                onClick={() => goToStep(1)}
                                className="flex items-center gap-2 mb-6 transition hover:opacity-70"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>

                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Video Card 1 */}
                                <div
                                    className="rounded-3xl overflow-hidden"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                                >
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
                                        <div className="absolute top-3 left-3 bg-indigo-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                            Video 1
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                            4 min
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                                            Understanding Categories & Purpose
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                            Tim explains how to identify your life areas and define meaningful purpose elements.
                                        </p>
                                    </div>
                                </div>

                                {/* Video Card 2 */}
                                <div
                                    className="rounded-3xl overflow-hidden"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                                >
                                    <div className="relative bg-gradient-to-br from-purple-900 to-pink-900 aspect-video flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-xl font-semibold mb-1">Video Coming Soon</p>
                                            <p className="text-purple-300 text-sm">Defining Your Purpose</p>
                                        </div>
                                        <div className="absolute top-3 left-3 bg-purple-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                            Video 2
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                            3 min
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                                            Defining Your Purpose
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                            Tim explores how purpose is driven by long-term goals that are meaningful to you and beneficial to others.
                                        </p>
                                    </div>
                                </div>

                                {/* Tim's Example */}
                                <div
                                    className="rounded-3xl p-6"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                                >
                                    <h3 className="text-2xl font-light mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Tim's Example</h3>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <h4 className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Health</h4>
                                            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Physical • Mental</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <h4 className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Relationships</h4>
                                            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Family • Friends • Partnership • Community</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)' }}>
                                            <h4 className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Purpose</h4>
                                            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Help Others • Environment</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <h4 className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Career</h4>
                                            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Business Growth • Leadership Development • Impacting Academic Growth</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            💡 <strong>Insight:</strong> Categories evolved over time—balance came gradually.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Purpose Explanation */}
                            <div
                                className="rounded-3xl p-8"
                                style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,180,0,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                            >
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-16 h-16 flex-shrink-0">
                                        <PurposeStarIllustration />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-light mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Understanding Purpose</h3>
                                        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                                            Purpose is driven by long-term goals that are <strong>meaningful to you</strong> and <strong>beneficial to others</strong>.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Questions to ask:</p>
                                                <ul className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    <li>• What impact do I want to make?</li>
                                                    <li>• How can I help others?</li>
                                                    <li>• What do I want my life to look like in 5 years?</li>
                                                    <li>• Where am I spending most of my time and energy?</li>
                                                    <li>• Which areas of my life feel neglected?</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Examples:</p>
                                                <ul className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    <li>• Help Others</li>
                                                    <li>• Mentor Youth</li>
                                                    <li>• Address Loneliness</li>
                                                    <li>• Environmental Justice</li>
                                                    <li>• Support Veterans</li>
                                                    <li>• Financial Literacy Education</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => goToStep(3)}
                                    className="px-10 py-4 rounded-full font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                                >
                                    Start Building →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enhanced Builder */}
                    {currentStep === 3 && (
                        <div className={`py-8 ${isStepAnimating ? (stepDirection === 'forward' ? 'step-exit-forward' : 'step-exit-backward') : (stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward')}`}>
                            <button
                                onClick={() => goToStep(2)}
                                className="flex items-center gap-2 mb-6 transition hover:opacity-70 group"
                                style={{ color: 'var(--color-text-muted)' }}
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
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                        >
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>Build Your LifeFrame</h1>
                                            <p style={{ color: 'var(--color-text-muted)' }}>Choose categories, then define your purpose</p>
                                        </div>
                                    </div>

                                    {/* Completion Indicator */}
                                    <div className="flex items-center gap-2">
                                        {categoryDetails.length >= 3 && purposeElements.filter(p => p.name.trim()).length >= 1 ? (
                                            <div
                                                className="flex items-center gap-2 px-4 py-2 rounded-full"
                                                style={{ background: 'rgba(0,200,100,0.12)', border: '1px solid rgba(0,200,100,0.3)' }}
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'rgba(0,200,100,0.9)' }}>
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-semibold" style={{ color: 'rgba(0,200,100,0.9)' }}>Ready to save!</span>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center gap-2 px-4 py-2 rounded-full"
                                                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                                            >
                                                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-dim)' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Keep building...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enhanced Progress Tracker */}
                                <div
                                    className="rounded-2xl p-6 transition-all duration-300"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Your Progress</span>
                                        <span className="text-2xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            {categoryDetails.length + purposeElements.filter(p => p.name.trim()).length} / 4
                                        </span>
                                    </div>

                                    {/* Visual Progress Steps */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {[
                                            { label: '3 Categories', count: 3, type: 'categories', color: 'rgba(100,120,255,0.8)' },
                                            { label: '1 Purpose', count: 1, type: 'purpose', color: 'rgba(255,180,0,0.8)' }
                                        ].map((milestone, idx) => {
                                            const currentCount = milestone.type === 'categories' ? categoryDetails.length : purposeElements.filter(p => p.name.trim()).length;
                                            const isComplete = currentCount >= milestone.count;

                                            return (
                                                <div key={idx} className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{milestone.label}</span>
                                                        <span className="text-xs font-semibold" style={{ color: isComplete ? milestone.color : 'var(--color-text-dim)' }}>
                                                            {currentCount}/{milestone.count}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                                                        <div
                                                            className="h-full transition-all duration-500 rounded-full"
                                                            style={{ width: `${Math.min(100, (currentCount / milestone.count) * 100)}%`, background: milestone.color }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Motivational Message */}
                                    <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-text-dim)' }}>
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                                            >
                                                1
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Life Categories</h2>
                                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pick 3-8 areas to focus on</p>
                                            </div>
                                        </div>
                                        {categoryDetails.length > 0 && (
                                            <div
                                                className="px-3 py-1 rounded-full"
                                                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                                            >
                                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>{categoryDetails.length} selected</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Cards Grid - DEFAULT + CUSTOM */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Default categories */}
                                        {[
                                            { name: 'Health', icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z', desc: 'Physical & mental wellbeing' },
                                            { name: 'Relationships', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', desc: 'Family, friends, love' },
                                            { name: 'Community', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', desc: 'Belonging & connection' },
                                            { name: 'Education', icon: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z', desc: 'Learning & growth' },
                                            { name: 'Career', icon: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z', desc: 'Work & professional goals' },
                                            { name: 'Financial', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', desc: 'Money & security' },
                                            { name: 'Spirituality', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', desc: 'Faith & inner peace' },
                                            { name: 'Creative', icon: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586', desc: 'Art & expression' }
                                        ].map((cat) => {
                                            const isSelected = selectedCategories.has(cat.name);
                                            const colors = getCategoryColor(cat.name);
                                            const isPulsing = pulsingCard === cat.name;

                                            return (
                                                <button
                                                    key={cat.name}
                                                    onClick={() => {
                                                        // Trigger select-pulse animation
                                                        setPulsingCard(cat.name);
                                                        setTimeout(() => setPulsingCard(null), 420);

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
                                                    className={[
                                                        'group relative p-4 rounded-2xl transition-all duration-300 text-left',
                                                        isPulsing ? 'animate-select-pulse' : ''
                                                    ].join(' ')}
                                                    style={isSelected ? {
                                                        background: colors.glow,
                                                        border: `1px solid ${colors.border}`,
                                                        boxShadow: `0 0 20px ${colors.glow}, inset 0 0 0 0 transparent`,
                                                        transform: 'scale(1.02)',
                                                    } : {
                                                        background: 'var(--color-surface)',
                                                        border: '1px solid var(--color-border)',
                                                        color: 'var(--color-text-muted)'
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                            style={{ background: isSelected ? colors.accent.replace('0.8', '0.15') : 'var(--color-surface-2)' }}
                                                        >
                                                            <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isSelected ? colors.accent : 'var(--color-text-dim)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d={cat.icon} />
                                                            </svg>
                                                        </div>
                                                        {isSelected && (
                                                            <div
                                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                                style={{ background: colors.accent }}
                                                            >
                                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="font-semibold mb-1"
                                                        style={{ color: isSelected ? colors.accent : 'var(--color-text)' }}
                                                    >
                                                        {cat.name}
                                                    </div>
                                                    <div className="text-xs"
                                                        style={{ color: 'var(--color-text-dim)' }}
                                                    >
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
                                                        className="group relative p-4 rounded-2xl transition-all duration-300 text-left"
                                                        style={isSelected ? {
                                                            background: colors.glow,
                                                            border: `1px solid ${colors.border}`,
                                                            boxShadow: `0 0 20px ${colors.glow}`,
                                                            transform: 'scale(1.02)',
                                                        } : {
                                                            background: 'var(--color-surface)',
                                                            border: '1px solid var(--color-border)',
                                                            color: 'var(--color-text-muted)'
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div
                                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                                style={{ background: isSelected ? colors.accent.replace('0.8', '0.15') : 'var(--color-surface-2)' }}
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isSelected ? colors.accent : 'var(--color-text-dim)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                                </svg>
                                                            </div>
                                                            {isSelected && (
                                                                <div
                                                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                                                    style={{ background: colors.accent }}
                                                                >
                                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="font-semibold mb-1"
                                                            style={{ color: isSelected ? colors.accent : 'var(--color-text)' }}
                                                        >
                                                            {cat.name}
                                                        </div>
                                                        <div className="text-xs"
                                                            style={{ color: 'var(--color-text-dim)' }}
                                                        >
                                                            Custom category
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>

                                    {/* Custom Category Input */}
                                    <div
                                        className="rounded-2xl p-4 border-2 border-dashed"
                                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                    >
                                        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Don't see what you need?</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="e.g., Travel, Hobbies, Adventure..."
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition"
                                                style={{
                                                    background: 'var(--color-surface-2)',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-text)',
                                                }}
                                            />
                                            <button
                                                onClick={addCategory}
                                                disabled={!customCategory.trim()}
                                                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30"
                                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                     {/* Sub-Categories Section — Inline per selected category */}
                                    {categoryDetails.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Break It Down</h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}>
                                                    What matters within each area?
                                                </span>
                                            </div>
                                            {categoryDetails.map((category) => {
                                                const colors = getCategoryColor(category.name);
                                                const isEditing = editingCategory === category.name;

                                                return (
                                                    <div
                                                        key={category.name}
                                                        className="rounded-2xl overflow-hidden transition-all"
                                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                                    >
                                                        {/* Category header bar */}
                                                        <div
                                                            className="px-4 py-3 flex items-center justify-between"
                                                            style={{
                                                                background: 'var(--color-surface-2)',
                                                                borderBottom: `2px solid ${colors.accent}`,
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ background: colors.accent }}
                                                                />
                                                                <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{category.name}</span>
                                                                {category.subCategories.length > 0 && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: colors.glow, color: colors.accent, border: `1px solid ${colors.border}` }}>
                                                                        {category.subCategories.length} sub
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setCategoryDetails(prev => prev.filter(c => c.name !== category.name));
                                                                    setSelectedCategories(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(category.name);
                                                                        return newSet;
                                                                    });
                                                                }}
                                                                className="transition hover:opacity-70"
                                                                style={{ color: 'var(--color-text-dim)' }}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Sub-categories body */}
                                                        <div className="px-4 py-3">
                                                            {category.subCategories.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                                    {category.subCategories.map((sub) => (
                                                                        <span
                                                                            key={sub}
                                                                            className="group px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                                                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                                                        >
                                                                            {sub}
                                                                            <button
                                                                                onClick={() => removeSubCategory(category.name, sub)}
                                                                                className="opacity-40 hover:opacity-100 hover:text-red-400 transition ml-0.5"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    {/* Suggestion chips */}
                                                                    {(() => {
                                                                        const suggestions = (SUBCATEGORY_EXAMPLES[category.name] || []).filter(
                                                                            s => !category.subCategories.includes(s)
                                                                        );
                                                                        if (suggestions.length === 0) return null;
                                                                        return (
                                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                                {suggestions.slice(0, 4).map(s => (
                                                                                    <button
                                                                                        key={s}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setCategoryDetails(prev => prev.map(cat =>
                                                                                                cat.name === category.name
                                                                                                    ? { ...cat, subCategories: [...cat.subCategories, s] }
                                                                                                    : cat
                                                                                            ));
                                                                                        }}
                                                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all hover:scale-105 active:scale-95"
                                                                                        style={{
                                                                                            background: colors.glow,
                                                                                            border: `1px solid ${colors.border}`,
                                                                                            color: colors.accent,
                                                                                        }}
                                                                                    >
                                                                                        + {s}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    <div className="flex gap-1.5">
                                                                        <input
                                                                            type="text"
                                                                            placeholder={`e.g., ${(SUBCATEGORY_EXAMPLES[category.name] || ['Physical Health, Mental Health'])[0]}...`}
                                                                            value={customSubCategory}
                                                                            onChange={(e) => setCustomSubCategory(e.target.value)}
                                                                            onKeyDown={(e) => e.key === 'Enter' && addSubCategory(category.name)}
                                                                            className="flex-1 px-3 py-1.5 rounded-lg focus:outline-none text-xs transition"
                                                                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            onClick={() => addSubCategory(category.name)}
                                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                                                                            style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                                                                        >
                                                                            ✓
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setEditingCategory(null); setCustomSubCategory(''); }}
                                                                            className="px-3 py-1.5 rounded-lg text-xs transition hover:opacity-70"
                                                                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setEditingCategory(category.name)}
                                                                    className="text-xs font-semibold transition hover:opacity-70 flex items-center gap-1"
                                                                    style={{ color: 'var(--color-text-muted)' }}
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    Add sub-category
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: Purpose Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ background: 'rgba(255,180,0,0.15)', border: '1px solid rgba(255,180,0,0.3)' }}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,0,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="6" />
                                                    <circle cx="12" cy="12" r="2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Your Purpose</h2>
                                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>How will you make an impact?</p>
                                            </div>
                                        </div>
                                        {purposeElements.filter(p => p.name.trim()).length > 0 && (
                                            <div
                                                className="px-3 py-1 rounded-full"
                                                style={{ background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.2)' }}
                                            >
                                                <span className="text-sm font-semibold" style={{ color: 'rgba(255,180,0,0.8)' }}>{purposeElements.filter(p => p.name.trim()).length} added</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Examples */}
                                    <div
                                        className="rounded-2xl p-4"
                                        style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,180,0,0.2)' }}
                                    >
                                        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Quick Add:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Help Others', 'Help Environment', 'Mentor Youth', 'Address Loneliness'].map((example) => (
                                                <button
                                                    key={example}
                                                    onClick={() => {
                                                        if (!purposeElements.find(p => p.name === example)) {
                                                            setPurposeElements(prev => {
                                                                const next = [...prev, { name: example, description: '' }];
                                                                setNewPurposeIdx(next.length - 1);
                                                                setTimeout(() => setNewPurposeIdx(null), 500);
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80 active:scale-95"
                                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                                >
                                                    + {example}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Purpose Elements */}
                                    <div className="space-y-3">
                                        {purposeElements.map((element, index) => (
                                            <div
                                                key={index}
                                                className={['rounded-2xl p-4 transition-all duration-300', index === newPurposeIdx ? 'animate-pop-in' : ''].join(' ')}
                                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Purpose element (e.g., Help Others)"
                                                            value={element.name}
                                                            onChange={(e) => updatePurposeElement(index, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-xl font-semibold text-sm mb-2 focus:outline-none transition"
                                                            style={{
                                                                background: 'var(--color-surface-2)',
                                                                border: '1px solid var(--color-border)',
                                                                color: 'var(--color-text)',
                                                            }}
                                                        />
                                                        <textarea
                                                            placeholder="How will you achieve this? (optional)"
                                                            value={element.description}
                                                            onChange={(e) => updatePurposeElement(index, 'description', e.target.value)}
                                                            rows={2}
                                                            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition"
                                                            style={{
                                                                background: 'var(--color-surface-2)',
                                                                border: '1px solid var(--color-border)',
                                                                color: 'var(--color-text)',
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removePurposeElement(index)}
                                                        className="transition hover:text-red-400"
                                                        style={{ color: 'var(--color-text-dim)' }}
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
                                            className="w-full py-3.5 border-2 border-dashed rounded-2xl text-sm font-semibold transition"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                                        >
                                            + Add Purpose Element
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div
                                className="flex justify-center gap-3 pt-8 mt-4"
                                style={{ borderTop: '1px solid var(--color-border)' }}
                            >
                                <button
                                    onClick={() => goToStep(2)}
                                    className="px-6 py-3 rounded-full font-semibold transition hover:opacity-70"
                                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => {
                                        const catText = categoryDetails.map(c =>
                                            `${c.name}${c.subCategories.length > 0 ? '\n  Sub-categories: ' + c.subCategories.join(', ') : ''}`
                                        ).join('\n\n');
                                        const purposeText = purposeElements.filter(p => p.name.trim()).map(p =>
                                            `• ${p.name}${p.description ? '\n  ' + p.description : ''}`
                                        ).join('\n');
                                        const text = `My Life Categories\n${'='.repeat(30)}\n\n${catText}\n\nPurpose Elements\n${'-'.repeat(20)}\n${purposeText || '(None defined yet)'}`;
                                        const blob = new Blob([text], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'my-life-categories.txt';
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    disabled={categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0}
                                    className="px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 disabled:opacity-30"
                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export
                                </button>
                                <button
                                    onClick={saveCategories}
                                    disabled={saving || (categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0)}
                                    className="px-10 py-3 rounded-full font-semibold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
                                    style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
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