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
import VideoPlayer from '@/app/components/VideoPlayer';
import { getVideo } from '@/lib/videos';
import { parseVideoProgress } from '@/lib/video-progress';

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
    const [selectedStep2VideoId, setSelectedStep2VideoId] = useState<'v5-lifeframe-roadmap' | 'v13-life-categories-2'>('v5-lifeframe-roadmap');
    const [selectedStep3VideoId, setSelectedStep3VideoId] = useState<'v15-purpose' | 'v6-your-story' | 'v16-worksheet3'>('v15-purpose');
    const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(new Set());
    const [activeVideo, setActiveVideo] = useState<{ video: any; src: string } | null>(null);

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

                // Load watched video status
                if (userWithProfile.profile?.video_progress) {
                    const prog = parseVideoProgress(userWithProfile.profile.video_progress);
                    setWatchedVideoIds(new Set(prog.watched));
                }

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
                    // Start at step 4 (builder) if they have data
                    if (saved.categories || saved.purpose_elements) {
                        setCurrentStep(4);
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
                        style={{ width: `${(currentStep / 4) * 100}%`, background: 'var(--color-text)' }}
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
                                            Life Categories & Purpose
                                        </h1>
                                        <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
                                            Life Categories define the core focus areas of your life. Combined with your personal Purpose, they create the blueprint for your Roadmap.
                                        </p>
                                        <div
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
                                            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                                        >
                                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <span>LifeFrame • Step 1 of 4 • 15-20 min</span>
                                        </div>
                                        <div>
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
                        </div>
                    )}

                    {/* Step 2: Video 5 — The LifeFrame & Roadmap */}
                    {currentStep === 2 && (
                        <div className={`min-h-[80vh] py-8 ${isStepAnimating ? (stepDirection === 'forward' ? 'step-exit-forward' : 'step-exit-backward') : (stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward')}`}>
                            <div className="max-w-4xl mx-auto">
                                <button
                                    onClick={() => goToStep(1)}
                                    className="flex items-center gap-2 mb-6 transition hover:opacity-70"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Overview
                                </button>

                                <div
                                    className="rounded-3xl overflow-hidden mb-8"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    {/* Video Switcher Tabs */}
                                    <div className="p-4 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                                        <button
                                            onClick={() => setSelectedStep2VideoId('v5-lifeframe-roadmap')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${selectedStep2VideoId === 'v5-lifeframe-roadmap' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedStep2VideoId === 'v5-lifeframe-roadmap' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                            <span>Video 11: The LifeFrame & Roadmap (2:50)</span>
                                            {watchedVideoIds.has('v5-lifeframe-roadmap') && <span className="text-emerald-400 font-bold text-[11px] ml-0.5">✓</span>}
                                        </button>
                                        <button
                                            onClick={() => setSelectedStep2VideoId('v13-life-categories-2')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${selectedStep2VideoId === 'v13-life-categories-2' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedStep2VideoId === 'v13-life-categories-2' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            <span>Video 12: Case Studies & Categories (3:50)</span>
                                            {watchedVideoIds.has('v13-life-categories-2') && <span className="text-emerald-400 font-bold text-[11px] ml-0.5">✓</span>}
                                        </button>
                                    </div>

                                    {/* Video Area */}
                                    <div
                                        className="relative aspect-video flex items-center justify-center cursor-pointer group transition-all overflow-hidden"
                                        style={{ background: '#0a0a14' }}
                                        onClick={() => {
                                            const v = getVideo(selectedStep2VideoId);
                                            if (v?.blobUrl) setActiveVideo({ video: v, src: v.blobUrl });
                                        }}
                                    >
                                        {/* Real Video preview frame */}
                                        {getVideo(selectedStep2VideoId)?.blobUrl && (
                                            <video
                                                key={selectedStep2VideoId}
                                                src={`${getVideo(selectedStep2VideoId)?.blobUrl}#t=0.5`}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />

                                        {/* Watched badge */}
                                        {watchedVideoIds.has(selectedStep2VideoId) && (
                                            <div
                                                className="absolute top-4 right-4 px-2.5 py-1 rounded text-xs font-semibold z-10 flex items-center gap-1 shadow-md"
                                                style={{
                                                    background: 'rgba(34,197,94,0.25)',
                                                    color: 'rgba(34,197,94,0.95)',
                                                    border: '1px solid rgba(34,197,94,0.4)',
                                                    backdropFilter: 'blur(8px)',
                                                }}
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>Watched</span>
                                            </div>
                                        )}

                                        <div className="text-center z-10">
                                            <div
                                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 shadow-2xl"
                                                style={{ background: 'rgba(99,102,241,0.3)', backdropFilter: 'blur(10px)', border: '2px solid rgba(129,140,248,0.6)' }}
                                            >
                                                <svg className="w-9 h-9 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs uppercase tracking-widest font-semibold mb-1 text-indigo-300">
                                                {selectedStep2VideoId === 'v5-lifeframe-roadmap' ? 'Watch Video 5' : 'Watch Video 13'}
                                            </p>
                                            <p className="text-xl font-light text-white" style={{ letterSpacing: '-0.02em' }}>
                                                {selectedStep2VideoId === 'v5-lifeframe-roadmap' ? 'The LifeFrame & Roadmap' : 'Structuring Your Life Categories'}
                                            </p>
                                        </div>

                                        <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm z-10">
                                            {selectedStep2VideoId === 'v5-lifeframe-roadmap' ? 'Video 5' : 'Video 13'}
                                        </div>
                                        <div
                                            className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-medium z-10"
                                            style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
                                        >
                                            {selectedStep2VideoId === 'v5-lifeframe-roadmap' ? '2:50' : '3:50'}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="p-8 md:p-10">
                                        <h2 className="text-3xl font-light mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            Understanding Categories & Structure
                                        </h2>
                                        <p className="text-base md:text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                            Life Categories give structure to your life. They provide buckets for your goals, ensure all important areas receive attention, and anchor your Roadmap into concrete daily habits.
                                        </p>

                                        {/* Tim's Real Example */}
                                        <div
                                            className="rounded-2xl p-6 mb-8"
                                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                                        >
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                                <span>Tim's Real-Life Categories</span>
                                            </h3>

                                            <div className="grid sm:grid-cols-3 gap-3 mb-4">
                                                <div className="p-3.5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                    <h4 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>Health</h4>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Physical • Mental</p>
                                                </div>
                                                <div className="p-3.5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                    <h4 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>Relationships</h4>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Family • Friends • Community</p>
                                                </div>
                                                <div className="p-3.5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                    <h4 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>Career</h4>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Growth • Leadership • Impact</p>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl text-xs flex items-start gap-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'var(--color-text-muted)' }}>
                                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <strong style={{ color: 'var(--color-text)' }}>Insight from Tim:</strong> Categories evolve over time — start with what matters most right now, and balance will come gradually.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                            <button
                                                onClick={() => goToStep(1)}
                                                className="px-6 py-3 rounded-full text-sm font-medium transition hover:opacity-70"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={() => goToStep(3)}
                                                className="px-8 py-3.5 rounded-full font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98]"
                                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                                            >
                                                Continue to Purpose →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Video 6 — Defining Your Purpose */}
                    {currentStep === 3 && (
                        <div className={`min-h-[80vh] py-8 ${isStepAnimating ? (stepDirection === 'forward' ? 'step-exit-forward' : 'step-exit-backward') : (stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward')}`}>
                            <div className="max-w-4xl mx-auto">
                                <button
                                    onClick={() => goToStep(2)}
                                    className="flex items-center gap-2 mb-6 transition hover:opacity-70"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Categories
                                </button>

                                <div
                                    className="rounded-3xl overflow-hidden mb-8"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    {/* Video Switcher Tabs */}
                                    <div className="p-4 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                                        <button
                                            onClick={() => setSelectedStep3VideoId('v15-purpose')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${selectedStep3VideoId === 'v15-purpose' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedStep3VideoId === 'v15-purpose' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            <span>Video 14: Purpose & Meaning (3:08)</span>
                                            {watchedVideoIds.has('v15-purpose') && <span className="text-emerald-400 font-bold text-[11px] ml-0.5">✓</span>}
                                        </button>
                                        <button
                                            onClick={() => setSelectedStep3VideoId('v6-your-story')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${selectedStep3VideoId === 'v6-your-story' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedStep3VideoId === 'v6-your-story' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                            <span>Video 16: Tim's Story (4:33)</span>
                                            {watchedVideoIds.has('v6-your-story') && <span className="text-emerald-400 font-bold text-[11px] ml-0.5">✓</span>}
                                        </button>
                                        <button
                                            onClick={() => setSelectedStep3VideoId('v16-worksheet3')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${selectedStep3VideoId === 'v16-worksheet3' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedStep3VideoId === 'v16-worksheet3' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span>Video 15: Worksheet 3 Guide (0:50)</span>
                                            {watchedVideoIds.has('v16-worksheet3') && <span className="text-emerald-400 font-bold text-[11px] ml-0.5">✓</span>}
                                        </button>
                                    </div>

                                    {/* Video Area */}
                                    <div
                                        className="relative aspect-video flex items-center justify-center cursor-pointer group transition-all overflow-hidden"
                                        style={{ background: '#0a0a14' }}
                                        onClick={() => {
                                            const v = getVideo(selectedStep3VideoId);
                                            if (v?.blobUrl) setActiveVideo({ video: v, src: v.blobUrl });
                                        }}
                                    >
                                        {/* Real Video preview frame */}
                                        {getVideo(selectedStep3VideoId)?.blobUrl && (
                                            <video
                                                key={selectedStep3VideoId}
                                                src={`${getVideo(selectedStep3VideoId)?.blobUrl}#t=0.5`}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />

                                        {/* Watched badge */}
                                        {watchedVideoIds.has(selectedStep3VideoId) && (
                                            <div
                                                className="absolute top-4 right-4 px-2.5 py-1 rounded text-xs font-semibold z-10 flex items-center gap-1 shadow-md"
                                                style={{
                                                    background: 'rgba(34,197,94,0.25)',
                                                    color: 'rgba(34,197,94,0.95)',
                                                    border: '1px solid rgba(34,197,94,0.4)',
                                                    backdropFilter: 'blur(8px)',
                                                }}
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>Watched</span>
                                            </div>
                                        )}

                                        <div className="text-center z-10">
                                            <div
                                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 shadow-2xl"
                                                style={{ background: 'rgba(168,85,247,0.3)', backdropFilter: 'blur(10px)', border: '2px solid rgba(192,132,252,0.6)' }}
                                            >
                                                <svg className="w-9 h-9 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs uppercase tracking-widest font-semibold mb-1 text-purple-300">
                                                {selectedStep3VideoId === 'v15-purpose' ? 'Watch Video 15' : selectedStep3VideoId === 'v6-your-story' ? 'Watch Video 6' : 'Watch Video 16'}
                                            </p>
                                            <p className="text-xl font-light text-white" style={{ letterSpacing: '-0.02em' }}>
                                                {selectedStep3VideoId === 'v15-purpose' ? 'Finding Your Purpose' : selectedStep3VideoId === 'v6-your-story' ? "Your Story — Tim's Journey" : 'Life Categories — Worksheet 3 Guide'}
                                            </p>
                                        </div>

                                        <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm z-10">
                                            {selectedStep3VideoId === 'v15-purpose' ? 'Video 15' : selectedStep3VideoId === 'v6-your-story' ? 'Video 6' : 'Video 16'}
                                        </div>
                                        <div
                                            className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-medium z-10"
                                            style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
                                        >
                                            {selectedStep3VideoId === 'v15-purpose' ? '3:40' : selectedStep3VideoId === 'v6-your-story' ? '4:33' : '0:50'}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="p-8 md:p-10">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-12 h-12 flex-shrink-0 mt-1">
                                                <PurposeStarIllustration />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-light mb-2" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                                    Defining Your Purpose
                                                </h2>
                                                <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                    Purpose is driven by long-term goals that are <strong style={{ color: 'var(--color-text)' }}>meaningful to you</strong> and <strong style={{ color: 'var(--color-text)' }}>beneficial to others</strong>.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Questions & Examples */}
                                        <div
                                            className="rounded-2xl p-6 mb-8 grid md:grid-cols-2 gap-6"
                                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                                        >
                                            <div>
                                                <p className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Questions to Ask Yourself:</span>
                                                </p>
                                                <ul className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                    <li className="flex items-start gap-2"><span>•</span><span>What impact do I want to make in the world?</span></li>
                                                    <li className="flex items-start gap-2"><span>•</span><span>How can my strengths help others?</span></li>
                                                    <li className="flex items-start gap-2"><span>•</span><span>What do I want my legacy to look like in 5–10 years?</span></li>
                                                    <li className="flex items-start gap-2"><span>•</span><span>Which area of contribution energizes me most?</span></li>
                                                </ul>
                                            </div>

                                            <div>
                                                <p className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                                                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                    <span>Real-World Purpose Examples:</span>
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Help Others', 'Mentor Youth', 'Support Veterans', 'Environmental Justice', 'Financial Literacy', 'Community Care'].map((ex, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
                                                        >
                                                            {ex}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                            <button
                                                onClick={() => goToStep(2)}
                                                className="px-6 py-3 rounded-full text-sm font-medium transition hover:opacity-70"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={() => goToStep(4)}
                                                className="px-8 py-3.5 rounded-full font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98]"
                                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                                            >
                                                Start Building Your LifeFrame →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Enhanced Builder */}
                    {currentStep === 4 && (
                        <div className={`py-8 ${isStepAnimating ? (stepDirection === 'forward' ? 'step-exit-forward' : 'step-exit-backward') : (stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward')}`}>
                            <button
                                onClick={() => goToStep(3)}
                                className="flex items-center gap-2 mb-6 transition hover:opacity-70 group"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium">Back to Purpose Video</span>
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
                                                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Add Sub-Categories</h3>
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
                                        const win = window.open('', '_blank', 'width=800,height=900');
                                        if (!win) return;
                                        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                        const filteredPurpose = purposeElements.filter(p => p.name.trim());
                                        win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Life Categories — Tim Collins Framework</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #fff; color: #111; padding: 48px 56px; max-width: 720px; margin: 0 auto; }
    .header { border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 32px; }
    .brand { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-bottom: 12px; }
    h1 { font-size: 32px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 6px; }
    .date { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #888; }
    .section-label { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #888; margin-bottom: 20px; margin-top: 32px; }
    .cat-item { padding: 16px 0; border-bottom: 1px solid #eee; }
    .cat-num { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #bbb; display: inline-block; min-width: 24px; }
    .cat-name { font-size: 16px; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.01em; }
    .sub-cats { font-size: 13px; color: #555; line-height: 1.6; padding-left: 24px; }
    .sub-chip { display: inline-block; background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 12px; padding: 2px 10px; margin: 2px 4px 2px 0; font-size: 12px; color: #444; }
    .purpose-item { display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #eee; align-items: flex-start; }
    .purpose-bullet { color: #bbb; font-size: 18px; line-height: 1; padding-top: 2px; }
    .purpose-name { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
    .purpose-desc { font-size: 13px; color: #555; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: #aaa; text-align: center; letter-spacing: 0.08em; }
    @media print { body { padding: 32px 40px; } .no-print { display: none; } }
    .print-btn { font-family: 'Helvetica Neue', Arial, sans-serif; background: #111; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 32px; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">&#8595; Save as PDF / Print</button>
  <div class="header">
    <div class="brand">Tim Collins Framework</div>
    <h1>My Life Categories</h1>
    <div class="date">Completed ${date}</div>
  </div>
  <div class="section-label">Life Categories (${categoryDetails.length})</div>
  ${categoryDetails.map((c, i) => `
  <div class="cat-item">
    <div class="cat-name"><span class="cat-num">${String(i + 1).padStart(2, '0')}</span> ${c.name}</div>
    ${c.subCategories.length > 0 ? `<div class="sub-cats">${c.subCategories.map(s => `<span class="sub-chip">${s}</span>`).join('')}</div>` : ''}
  </div>`).join('')}
  ${filteredPurpose.length > 0 ? `
  <div class="section-label">Purpose Elements (${filteredPurpose.length})</div>
  ${filteredPurpose.map(p => `
  <div class="purpose-item">
    <div class="purpose-bullet">•</div>
    <div>
      <div class="purpose-name">${p.name}</div>
      ${p.description ? `<div class="purpose-desc">${p.description}</div>` : ''}
    </div>
  </div>`).join('')}` : ''}
  <div class="footer">Generated by timcollinsframework.com &nbsp;•&nbsp; Tim Collins Framework &copy; ${new Date().getFullYear()}</div>
</body>
</html>`);
                                        win.document.close();
                                    }}
                                    disabled={categoryDetails.length === 0 && purposeElements.filter(p => p.name.trim()).length === 0}
                                    className="px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 disabled:opacity-30"
                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export PDF
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

            {/* Video Player Modal */}
            {activeVideo && (
                <VideoPlayer
                    video={activeVideo.video}
                    src={activeVideo.src}
                    onClose={() => setActiveVideo(null)}
                    onWatched={(vid) => setWatchedVideoIds(prev => new Set(prev).add(vid))}
                />
            )}
        </>
    );
}