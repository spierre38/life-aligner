'use client';

import { trackValuesSaved } from '@/lib/analytics';
import { useToast } from '@/app/components/Toast';
import { logActivity } from '@/lib/accountability';
import VideoPlayer from '@/app/components/VideoPlayer';
import { getVideo } from '@/lib/videos';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { Confetti } from '@/app/components/Confetti';

// ── Inline SVG Illustration (dark-friendly) ──────────────────────────────────
const CompassIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="compassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#compassGrad)" opacity="0.08" />
        <circle cx="100" cy="100" r="60" fill="url(#compassGrad)" opacity="0.12" />
        <circle cx="100" cy="100" r="50" stroke="#a78bfa" strokeWidth="1.5" opacity="0.25" />
        <polygon points="100,45 108,90 100,80 92,90" fill="#ef4444" opacity="0.85" />
        <polygon points="100,155 108,110 100,120 92,110" fill="#818cf8" opacity="0.85" />
        <circle cx="100" cy="100" r="6" fill="#a78bfa" />
        <circle cx="100" cy="100" r="3" fill="white" opacity="0.9" />
    </svg>
);

// ── Icons ────────────────────────────────────────────────────────────────────
const WbIcons = {
    compass: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    lightbulb: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
    target: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    sparkle: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    heart: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    shield: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    pin: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    quote: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>,
};

// Values from the workbook (pages 12-13)
const VALUES_LIST = [
    { name: 'Authenticity', description: 'Staying true to your values and authentic self.' },
    { name: 'Compassion', description: "Concern for others' misfortunes, tied to empathy, love, and forgiveness." },
    { name: 'Commitment', description: 'Commitment to a cause or purpose.' },
    { name: 'Continuous Improvement', description: 'A process of analyzing and improving through curiosity and learning.' },
    { name: 'Courage', description: 'The ability to face fears, take risks and act innovatively to achieve a goal.' },
    { name: 'Creativity', description: 'The use of imagination or original ideas in accomplishing tasks.' },
    { name: 'Dependability', description: 'Being trustworthy and reliable.' },
    { name: 'Effort/Hard Work', description: 'Making a vigorous and determined attempt to achieve success.' },
    { name: 'Fairness', description: 'Impartial treatment without favoritism or discrimination.' },
    { name: 'Generosity', description: 'The virtue of freely helping, giving and being kind to others.' },
    { name: 'Gratitude', description: 'Appreciating what you have and expressing thanks.' },
    { name: 'Honesty and Integrity', description: 'Being truthful and following strong moral principles.' },
    { name: 'Humility', description: 'Valuing others and keeping a modest view of oneself.' },
    { name: 'Open Mindedness', description: 'Willingness to consider new ideas without prejudice.' },
    { name: 'Perseverance', description: 'Continuing despite difficulty, challenge or delay.' },
    { name: 'Positivity / Optimism', description: 'Acting positively in the present and being hopeful about the future.' },
    { name: 'Proactivity', description: 'Anticipating and acting to shape outcomes.' },
    { name: 'Self-respect', description: 'Caring about yourself and not tolerating disrespect.' },
    { name: 'Tolerance', description: 'Accepting opinions or behavior you may not agree with.' },
    { name: 'Wisdom', description: 'The quality of having experience, knowledge, and good judgment.' },
];

type SelectedValue = {
    name: string;
    description: string;
    priority: number;
};

export default function ValuesWorksheet() {
    const router = useRouter();
    const { showToast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [phase, setPhase] = useState<'select' | 'prioritize'>('select');
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
    const [prioritizedValues, setPrioritizedValues] = useState<SelectedValue[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);
    const [editingPriority, setEditingPriority] = useState<{ name: string, value: string } | null>(null);
    const [showFewValuesConfirm, setShowFewValuesConfirm] = useState(false);
    const [showTooManyValuesConfirm, setShowTooManyValuesConfirm] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<'v1-welcome' | 'v10-values-worksheet'>('v1-welcome');
    const [activeVideo, setActiveVideo] = useState<{ video: any; src: string } | null>(null);

    // Scroll to top when transitioning between steps
    const goToStep = (step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Ref for auto-scroll during drag
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    // Touch drag ref
    const touchDragName = useRef<string | null>(null);

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

                // Check if they already have saved values
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'values')
                    .single();

                if (data && !error) {
                    // Load existing values and skip to step 5
                    const saved = data.content.selected_values || [];
                    setSelectedValues(new Set(saved.map((v: SelectedValue) => v.name)));
                    setPrioritizedValues(saved);
                    if (saved.length > 0) {
                        setPhase('prioritize');
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

    // Cleanup scroll interval on unmount
    useEffect(() => {
        return () => {
            if (scrollInterval.current) {
                clearInterval(scrollInterval.current);
            }
        };
    }, []);

    const toggleValue = (valueName: string) => {
        const newSelected = new Set(selectedValues);
        if (newSelected.has(valueName)) {
            newSelected.delete(valueName);
        } else {
            newSelected.add(valueName);
        }
        setSelectedValues(newSelected);
    };

    const moveToPhase2 = () => {
        if (selectedValues.size < 5) {
            setShowFewValuesConfirm(true);
            return;
        }
        if (selectedValues.size > 10) {
            setShowTooManyValuesConfirm(true);
            return;
        }
        proceedToPhase2();
    };

    const proceedToPhase2 = () => {
        setShowFewValuesConfirm(false);
        const values = Array.from(selectedValues).map((name, index) => ({
            name,
            description: VALUES_LIST.find(v => v.name === name)?.description || '',
            priority: index + 1,
        }));
        setPrioritizedValues(values);
        setPhase('prioritize');
    };

    const updatePriority = (valueName: string, newPriority: number) => {
        setPrioritizedValues(prev => {
            const clampedPriority = Math.max(1, Math.min(prev.length, Math.floor(newPriority)));
            const updatingIndex = prev.findIndex(v => v.name === valueName);
            if (updatingIndex === -1) return prev;
            const otherValues = prev.filter((_, i) => i !== updatingIndex);
            const newValues = [...otherValues];
            newValues.splice(clampedPriority - 1, 0, {
                ...prev[updatingIndex],
                priority: clampedPriority
            });
            return newValues.map((v, index) => ({ ...v, priority: index + 1 }));
        });
    };

    const handlePriorityInputChange = (valueName: string, inputValue: string) => {
        setEditingPriority({ name: valueName, value: inputValue });
    };

    const handlePriorityInputBlur = (valueName: string) => {
        if (editingPriority && editingPriority.name === valueName) {
            const numValue = parseInt(editingPriority.value) || 1;
            updatePriority(valueName, numValue);
            setEditingPriority(null);
        }
    };

    const handlePriorityKeyDown = (e: React.KeyboardEvent, valueName: string) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    const removeValue = (valueName: string) => {
        setPrioritizedValues(prev => {
            const filtered = prev.filter(v => v.name !== valueName);
            return filtered.map((v, index) => ({ ...v, priority: index + 1 }));
        });
        setSelectedValues(prev => {
            const newSet = new Set(prev);
            newSet.delete(valueName);
            return newSet;
        });
    };

    // Auto-scroll during drag
    const handleAutoScroll = (clientY: number) => {
        const scrollThreshold = 100;
        const scrollSpeed = 10;
        const windowHeight = window.innerHeight;
        const distanceFromTop = clientY;
        const distanceFromBottom = windowHeight - clientY;

        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }

        if (distanceFromTop < scrollThreshold) {
            scrollInterval.current = setInterval(() => {
                window.scrollBy(0, -scrollSpeed);
            }, 16);
        } else if (distanceFromBottom < scrollThreshold) {
            scrollInterval.current = setInterval(() => {
                window.scrollBy(0, scrollSpeed);
            }, 16);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, valueName: string) => {
        setDraggedItem(valueName);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, valueName: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverItem(valueName);
        handleAutoScroll(e.clientY);
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    const handleDrop = (e: React.DragEvent, targetValueName: string) => {
        e.preventDefault();
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
        if (!draggedItem || draggedItem === targetValueName) {
            setDraggedItem(null);
            setDragOverItem(null);
            return;
        }
        setPrioritizedValues(prev => {
            const draggedIndex = prev.findIndex(v => v.name === draggedItem);
            const targetIndex = prev.findIndex(v => v.name === targetValueName);
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            const newValues = [...prev];
            const [draggedValue] = newValues.splice(draggedIndex, 1);
            newValues.splice(targetIndex, 0, draggedValue);
            return newValues.map((v, index) => ({ ...v, priority: index + 1 }));
        });
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    // Touch drag handlers (mobile)
    const handleTouchStart = (valueName: string) => {
        touchDragName.current = valueName;
        setDraggedItem(valueName);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchDragName.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const target = el?.closest('[data-value-name]') as HTMLElement | null;
        const targetName = target?.dataset.valueName ?? null;
        if (targetName && targetName !== touchDragName.current) {
            setDragOverItem(targetName);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchDragName.current) return;
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const target = el?.closest('[data-value-name]') as HTMLElement | null;
        const targetName = target?.dataset.valueName ?? null;

        if (targetName && targetName !== touchDragName.current) {
            const draggedName = touchDragName.current;
            setPrioritizedValues(prev => {
                const draggedIndex = prev.findIndex(v => v.name === draggedName);
                const targetIndex = prev.findIndex(v => v.name === targetName);
                if (draggedIndex === -1 || targetIndex === -1) return prev;
                const newValues = [...prev];
                const [moved] = newValues.splice(draggedIndex, 1);
                newValues.splice(targetIndex, 0, moved);
                return newValues.map((v, i) => ({ ...v, priority: i + 1 }));
            });
        }

        touchDragName.current = null;
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const saveValues = async () => {
        if (!userId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'values',
                    content: {
                        selected_values: prioritizedValues,
                    },
                }, {
                    onConflict: 'user_id,category',
                });

            if (error) throw error;

            trackValuesSaved(prioritizedValues.length);
            setShowSuccess(true);
            setShowConfetti(true);
            showToast('Values saved successfully!', 'success');

            // Social feed logging
            logActivity('value_changed', {
                value_count: prioritizedValues.length,
                top_value: prioritizedValues[0]?.name || 'a core value'
            }).catch(console.error);

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving values:', error);
            showToast('Failed to save values. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen pt-24" style={{ background: 'var(--color-bg)' }}>
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="h-64 rounded-3xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
                    </div>
                </div>
            </>
        );
    }

    // ── Success state ────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <>
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                <div className="text-center animate-slide-in-up">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                        <svg className="w-12 h-12" style={{ color: 'rgba(34,197,94,0.9)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-light mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>Values Saved ✦</h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Redirecting to your dashboard...</p>
                </div>
            </div>
            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
            </>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen pt-16 relative" style={{ background: 'var(--color-bg)' }}>
                {/* Progress Bar */}
                <div className="fixed top-16 left-0 w-full h-[2px] z-40" style={{ background: 'var(--color-surface-2)' }}>
                    <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%`, background: 'var(--color-text)' }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">

                    {/* ── Step 1: Introduction ──────────────────────────── */}
                    {currentStep === 1 && (
                        <div className="min-h-screen flex items-center justify-center animate-slide-in-up">
                            <div className="max-w-2xl w-full">
                                <div
                                    className="rounded-3xl p-8 md:p-12"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6">
                                            <CompassIllustration />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-light mb-6" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            Define Your Values
                                        </h1>
                                        <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
                                            Your Values are the principles and standards of behavior that guide your life decisions.
                                            They form the foundation of your LifeFrame and influence everything that follows.
                                        </p>
                                        <div
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
                                            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                                        >
                                            {WbIcons.compass('w-4 h-4')}
                                            <span>LifeFrame • Step 1 of 3 • 15-30 min</span>
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

                    {/* ── Step 2: Video Placeholder ────────────────────── */}
                    {currentStep === 2 && (
                        <div className="min-h-screen flex items-center justify-center animate-slide-in-up">
                            <div className="max-w-4xl w-full">
                                <button
                                    onClick={() => goToStep(1)}
                                    className="flex items-center gap-2 mb-8 transition hover:opacity-70"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div
                                    className="rounded-3xl overflow-hidden"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    {/* Video Switcher Tabs */}
                                    <div className="p-4 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                                        <button
                                            onClick={() => setSelectedVideoId('v1-welcome')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${selectedVideoId === 'v1-welcome' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedVideoId === 'v1-welcome' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            <span>Video 1: Welcome & Overview (5:17)</span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedVideoId('v10-values-worksheet')}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${selectedVideoId === 'v10-values-worksheet' ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={selectedVideoId === 'v10-values-worksheet' ? { background: 'var(--color-text)', color: 'var(--color-bg)' } : { color: 'var(--color-text)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                            <span>Video 10: Worksheet 1 Guide (1:00)</span>
                                        </button>
                                    </div>

                                    {/* Video area */}
                                    <div
                                        className="relative aspect-video flex items-center justify-center cursor-pointer group transition-all overflow-hidden"
                                        style={{ background: '#0a0a14' }}
                                        onClick={() => {
                                            const v = getVideo(selectedVideoId);
                                            if (v?.blobUrl) setActiveVideo({ video: v, src: v.blobUrl });
                                        }}
                                    >
                                        {/* Video preview thumbnail */}
                                        {getVideo(selectedVideoId)?.blobUrl && (
                                            <video
                                                key={selectedVideoId}
                                                src={`${getVideo(selectedVideoId)?.blobUrl}#t=0.5`}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />

                                        <div className="text-center z-10">
                                            <div
                                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 shadow-2xl"
                                                style={{ background: 'rgba(139,92,246,0.3)', backdropFilter: 'blur(10px)', border: '2px solid rgba(167,139,250,0.6)' }}
                                            >
                                                <svg className="w-9 h-9 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(167,139,250,0.9)' }}>
                                                {selectedVideoId === 'v1-welcome' ? 'Watch Introduction' : 'Watch Worksheet Instructions'}
                                            </p>
                                            <p className="text-xl font-light text-white" style={{ letterSpacing: '-0.02em' }}>
                                                {selectedVideoId === 'v1-welcome' ? 'Welcome to the Tim Collins Framework' : 'Values — Worksheet 1 Guide'}
                                            </p>
                                        </div>

                                        <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm z-10">
                                            {selectedVideoId === 'v1-welcome' ? 'Video 1' : 'Video 10'}
                                        </div>

                                        <div
                                            className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-medium z-10"
                                            style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
                                        >
                                            {selectedVideoId === 'v1-welcome' ? '5:17' : '1:00'}
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <h2 className="text-3xl font-light mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            {selectedVideoId === 'v1-welcome' ? 'What Are Values?' : 'How to Pick Your Values'}
                                        </h2>
                                        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                                            {selectedVideoId === 'v1-welcome'
                                                ? 'Learn how to identify the principles that will guide your decisions and bring you deep satisfaction. Tim explains the difference between values, interests, and goals.'
                                                : 'Tim walks through how to browse the curated value library, select the ones that resonate most, and rank your top priorities.'}
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => goToStep(1)}
                                                className="px-8 py-4 rounded-full font-semibold transition hover:opacity-70"
                                                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={() => goToStep(3)}
                                                className="flex-1 px-8 py-4 rounded-full font-semibold transition hover:opacity-90"
                                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                                            >
                                                Continue →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Examples of Values in Action ──────────── */}
                    {currentStep === 3 && (
                        <div className="min-h-screen flex items-center justify-center py-20 animate-slide-in-up">
                            <div className="max-w-5xl w-full">
                                <button
                                    onClick={() => goToStep(2)}
                                    className="flex items-center gap-2 mb-8 transition hover:opacity-70"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div
                                    className="rounded-3xl p-8 md:p-12"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    <h2 className="text-3xl md:text-4xl font-light mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                        Values in Action
                                    </h2>
                                    <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
                                        Here are real examples of how values guide people's lives:
                                    </p>

                                    <div className="space-y-5">
                                        {/* Tim */}
                                        <div className="pl-6" style={{ borderLeft: '3px solid rgba(99,102,241,0.4)' }}>
                                            <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                <div
                                                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(129,140,248,0.9)' }}
                                                >
                                                    {WbIcons.compass('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tim - Authenticity & Continuous Improvement</h3>
                                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                        Tim built a $2B company by staying true to his principles. His values of
                                                        <strong> authenticity</strong> (never compromising who he is) and <strong>continuous improvement</strong> (always
                                                        learning and growing) guided every business decision.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Jess */}
                                        <div className="pl-6" style={{ borderLeft: '3px solid rgba(34,197,94,0.4)' }}>
                                            <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                <div
                                                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(34,197,94,0.15)', color: 'rgba(74,222,128,0.9)' }}
                                                >
                                                    {WbIcons.sparkle('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>Jess - Creativity & Generosity</h3>
                                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                        After a successful career in admissions in education, Jess opened an art school for adults to address loneliness in her community. Her values of
                                                        <strong> creativity</strong> and <strong>generosity</strong> shaped her business model.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Laura */}
                                        <div className="pl-6" style={{ borderLeft: '3px solid rgba(236,72,153,0.4)' }}>
                                            <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                                <div
                                                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(236,72,153,0.15)', color: 'rgba(244,114,182,0.9)' }}
                                                >
                                                    {WbIcons.heart('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>Laura - Compassion & Perseverance</h3>
                                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                        Laura turned her passion for fitness into a career as a group class instructor and personal trainer. Her values of
                                                        <strong> compassion</strong> and <strong>perseverance</strong> drive her to help others achieve their health goals every day.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Insight callout */}
                                        <div className="flex items-start gap-3 rounded-xl p-5" style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}>
                                            <span style={{ color: 'rgba(255,180,0,0.8)' }} className="flex-shrink-0 mt-0.5">{WbIcons.lightbulb('w-5 h-5')}</span>
                                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                                <strong>Notice the pattern:</strong> Each person's values directly influenced their major life
                                                decisions. When your actions align with your values, you experience fulfillment — even when facing
                                                challenges.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => goToStep(4)}
                                            className="w-full px-8 py-4 rounded-full font-semibold transition hover:opacity-90"
                                            style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                                        >
                                            Next: Why Values Matter →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Why Values Matter ─────────────────────── */}
                    {currentStep === 4 && (
                        <div className="min-h-screen flex items-center justify-center py-20 animate-slide-in-up">
                            <div className="max-w-4xl w-full">
                                <button
                                    onClick={() => goToStep(3)}
                                    className="flex items-center gap-2 mb-8 transition hover:opacity-70"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div
                                    className="rounded-3xl p-8 md:p-12"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                                >
                                    <div className="text-center mb-10">
                                        <h2 className="text-3xl md:text-4xl font-light mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                            Why Values Matter
                                        </h2>
                                        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
                                            The foundation of everything that follows
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(129,140,248,0.9)' }}
                                            >
                                                {WbIcons.compass('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>Values Guide Your Decisions</h3>
                                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                    When faced with tough choices, your values act as a compass. Should you take that job?
                                                    Move to that city? End that relationship? Your values provide clarity.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(168,85,247,0.15)', color: 'rgba(192,132,252,0.9)' }}
                                            >
                                                {WbIcons.sparkle('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>Values Shape Your Purpose</h3>
                                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                    Your purpose emerges from your values. If you value creativity and generosity, your purpose
                                                    might involve using your creative gifts to help others. Values → Purpose → Goals.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(236,72,153,0.15)', color: 'rgba(244,114,182,0.9)' }}
                                            >
                                                {WbIcons.shield('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>Values Build Self-Esteem</h3>
                                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                                    When your actions align with your values, you respect yourself. You feel authentic.
                                                    This alignment is the foundation of lasting contentment.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tim quote */}
                                        <div className="relative rounded-2xl p-6" style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.15)' }}>
                                            <span className="absolute -top-3 left-6" style={{ color: 'rgba(255,180,0,0.4)' }}>{WbIcons.quote('w-8 h-8')}</span>
                                            <p className="italic leading-relaxed mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                                "The more you put into defining your values, the more you'll get out of this entire
                                                framework. Your values influence everything: your purpose, your goals, your relationships,
                                                and ultimately your level of contentment."
                                            </p>
                                            <p className="font-semibold mt-3 text-sm" style={{ color: 'rgba(255,180,0,0.7)' }}>— Tim Collins</p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => goToStep(5)}
                                            className="w-full px-8 py-5 rounded-full font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
                                            style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                                        >
                                            Ready to Select Your Values →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: The Worksheet ────────────────────────── */}
                    {currentStep === 5 && (
                        <div className="py-8 animate-slide-in-up">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2 mb-8 transition hover:opacity-70"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(129,140,248,0.9)' }}
                                >
                                    {WbIcons.pin('w-6 h-6')}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>Define Your Values</h1>
                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select and prioritize what matters most to you</p>
                                </div>
                            </div>

                            {/* Phase indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-[2px] flex-1 rounded-full" style={{ background: phase === 'select' ? 'var(--color-text)' : 'rgba(34,197,94,0.6)' }}></div>
                                <div className="h-[2px] flex-1 rounded-full" style={{ background: phase === 'prioritize' ? 'var(--color-text)' : 'var(--color-surface-2)' }}></div>
                            </div>

                            {/* Instructions Box */}
                            {phase === 'select' && (
                                <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    <div className="flex items-start gap-3">
                                        <span style={{ color: 'rgba(129,140,248,0.8)' }} className="flex-shrink-0 mt-0.5">{WbIcons.lightbulb('w-6 h-6')}</span>
                                        <div>
                                            <h3 className="font-medium text-lg mb-2" style={{ color: 'var(--color-text)' }}>How to Select Your Values</h3>
                                            <ul className="space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(129,140,248,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Click on values</strong> that resonate with you</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(129,140,248,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Hover to read</strong> the full description of each value</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(129,140,248,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Aim for 5 to 10 values</strong> — the ones most important to who you want to be</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(129,140,248,0.8)' }} className="font-bold">•</span>
                                                    <span>Think about: <em>What type of person do I want to be?</em></span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {phase === 'prioritize' && (
                                <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                                    <div className="flex items-start gap-3">
                                        <span style={{ color: 'rgba(192,132,252,0.8)' }} className="flex-shrink-0 mt-0.5">{WbIcons.target('w-6 h-6')}</span>
                                        <div>
                                            <h3 className="font-medium text-lg mb-2" style={{ color: 'var(--color-text)' }}>How to Prioritize Your Values</h3>
                                            <ul className="space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(192,132,252,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Drag and drop</strong> values to reorder them (use the ⋮⋮ handle)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(192,132,252,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Type a number</strong> to set priority directly (1 = most important)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(192,132,252,0.8)' }} className="font-bold">•</span>
                                                    <span><strong>Remove values</strong> by clicking the ✕ if you change your mind</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span style={{ color: 'rgba(192,132,252,0.8)' }} className="font-bold">•</span>
                                                    <span>Your #1 value should be the most important principle guiding your life</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {phase === 'select'
                                    ? `Selected: ${selectedValues.size} values`
                                    : "Your values are now prioritized from most to least important."
                                }
                            </p>

                            {/* Phase 1: Select Values */}
                            {phase === 'select' && (
                                <>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                                        {VALUES_LIST.map((value) => (
                                            <div
                                                key={value.name}
                                                onClick={() => toggleValue(value.name)}
                                                onMouseEnter={() => setHoveredValue(value.name)}
                                                onMouseLeave={() => setHoveredValue(null)}
                                                className="relative p-5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
                                                style={
                                                    selectedValues.has(value.name)
                                                        ? {
                                                            background: 'rgba(99,102,241,0.15)',
                                                            border: '2px solid rgba(129,140,248,0.5)',
                                                            boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
                                                        }
                                                        : {
                                                            background: 'var(--color-surface)',
                                                            border: '2px solid var(--color-border)',
                                                        }
                                                }
                                            >
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {value.name}
                                                    </h3>
                                                    {selectedValues.has(value.name) && (
                                                        <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(129,140,248,0.9)' }} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div
                                                    className="text-sm transition-all duration-300"
                                                    style={{
                                                        color: 'var(--color-text-muted)',
                                                        opacity: (hoveredValue === value.name || selectedValues.has(value.name)) ? 1 : 0,
                                                        maxHeight: (hoveredValue === value.name || selectedValues.has(value.name)) ? '80px' : '0',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {value.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={moveToPhase2}
                                            disabled={selectedValues.size === 0}
                                            className="px-8 py-4 rounded-full font-semibold text-lg transition-all active:scale-[0.98]"
                                            style={
                                                selectedValues.size === 0
                                                    ? { background: 'var(--color-surface-2)', color: 'var(--color-text-dim)', cursor: 'not-allowed' }
                                                    : { background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }
                                            }
                                        >
                                            Continue to Prioritize →
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Phase 2: Prioritize Values */}
                            {phase === 'prioritize' && (
                                <div className="max-w-4xl mx-auto">
                                    <div
                                        className="rounded-3xl p-6 md:p-8 mb-8"
                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-light" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Your Values (Prioritized)</h2>
                                            <button
                                                onClick={() => setPhase('select')}
                                                className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
                                                style={{ color: 'rgba(129,140,248,0.9)' }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Edit Selection
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {prioritizedValues.map((value) => (
                                                <div
                                                    key={value.name}
                                                    data-value-name={value.name}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, value.name)}
                                                    onDragOver={(e) => handleDragOver(e, value.name)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, value.name)}
                                                    onDragEnd={handleDragEnd}
                                                    onTouchStart={() => handleTouchStart(value.name)}
                                                    onTouchMove={handleTouchMove}
                                                    onTouchEnd={handleTouchEnd}
                                                    className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-move touch-none"
                                                    style={
                                                        draggedItem === value.name
                                                            ? { opacity: 0.4, transform: 'scale(0.97)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
                                                            : dragOverItem === value.name
                                                                ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(129,140,248,0.4)', transform: 'scale(1.02)' }
                                                                : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
                                                    }
                                                >
                                                    {/* Drag handle */}
                                                    <div className="cursor-grab active:cursor-grabbing" style={{ color: 'var(--color-text-dim)' }}>
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                                        </svg>
                                                    </div>

                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={prioritizedValues.length}
                                                            value={editingPriority?.name === value.name ? editingPriority.value : value.priority}
                                                            onChange={(e) => handlePriorityInputChange(value.name, e.target.value)}
                                                            onBlur={() => handlePriorityInputBlur(value.name)}
                                                            onKeyDown={(e) => handlePriorityKeyDown(e, value.name)}
                                                            className="w-14 px-2 py-1.5 text-center font-semibold text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                                            style={{
                                                                background: 'var(--color-bg)',
                                                                border: editingPriority?.name === value.name ? '1px solid rgba(129,140,248,0.6)' : '1px solid var(--color-border)',
                                                                color: 'var(--color-text)',
                                                                ...(editingPriority?.name === value.name ? { boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' } : {}),
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {editingPriority?.name === value.name && (
                                                            <div className="absolute -bottom-5 left-0 text-xs whitespace-nowrap" style={{ color: 'rgba(129,140,248,0.7)' }}>
                                                                Press Enter ↵
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium" style={{ color: 'var(--color-text)' }}>{value.name}</h3>
                                                        <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>{value.description}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => removeValue(value.name)}
                                                        className="p-2 rounded-lg transition hover:opacity-70"
                                                        style={{ color: 'rgba(239,68,68,0.7)' }}
                                                        aria-label="Remove value"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {prioritizedValues.length === 0 && (
                                            <div className="text-center py-12">
                                                <p style={{ color: 'var(--color-text-dim)' }}>No values selected yet.</p>
                                                <button
                                                    onClick={() => setPhase('select')}
                                                    className="mt-4 font-medium transition hover:opacity-70"
                                                    style={{ color: 'rgba(129,140,248,0.9)' }}
                                                >
                                                    ← Go back to select values
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-center gap-3 flex-wrap">
                                        <button
                                            onClick={() => setPhase('select')}
                                            className="px-8 py-4 rounded-full font-semibold transition hover:opacity-70"
                                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                const text = `My Values (Prioritized)\n${'='.repeat(30)}\n\n${prioritizedValues.map((v, i) => `${i + 1}. ${v.name}\n   ${v.description}\n`).join('\n')}`;
                                                const blob = new Blob([text], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'my-values.txt';
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            disabled={prioritizedValues.length === 0}
                                            className="px-8 py-4 rounded-full font-semibold flex items-center gap-2 transition hover:opacity-90 active:scale-[0.98]"
                                            style={
                                                prioritizedValues.length === 0
                                                    ? { background: 'var(--color-surface-2)', color: 'var(--color-text-dim)', cursor: 'not-allowed' }
                                                    : { background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
                                            }
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export
                                        </button>
                                        <button
                                            onClick={saveValues}
                                            disabled={saving || prioritizedValues.length === 0}
                                            className="px-8 py-4 rounded-full font-semibold text-lg transition-all active:scale-[0.98]"
                                            style={
                                                saving || prioritizedValues.length === 0
                                                    ? { background: 'var(--color-surface-2)', color: 'var(--color-text-dim)', cursor: 'not-allowed' }
                                                    : { background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }
                                            }
                                        >
                                            {saving ? 'Saving...' : 'Save & Continue →'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Few Values Confirmation Dialog */}
            {showFewValuesConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                    <div
                        className="rounded-2xl max-w-sm w-full p-8 text-center"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.2)' }}
                        >
                            <svg className="w-8 h-8" style={{ color: 'rgba(255,180,0,0.8)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                            Only {selectedValues.size} {selectedValues.size === 1 ? 'Value' : 'Values'} Selected
                        </h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                            We recommend selecting <strong>5 to 10 values</strong> to get the most out of your LifeFrame. This range gives you a focused yet rich picture of what drives you.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFewValuesConfirm(false)}
                                className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90"
                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                Select More
                            </button>
                            <button
                                onClick={proceedToPhase2}
                                className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-70"
                                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
                            >
                                Continue Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Too Many Values Confirmation Dialog */}
            {showTooManyValuesConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                    <div
                        className="rounded-2xl max-w-sm w-full p-8 text-center"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.2)' }}
                        >
                            <svg className="w-8 h-8" style={{ color: 'rgba(255,180,0,0.8)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Are You Sure?</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                            You've selected <strong>{selectedValues.size} values</strong>. We suggest narrowing to <strong>5 to 10</strong> for the most impact. Fewer values help you stay focused on what matters most.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTooManyValuesConfirm(false)}
                                className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90"
                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                Go Back & Refine
                            </button>
                            <button
                                onClick={() => { setShowTooManyValuesConfirm(false); proceedToPhase2(); }}
                                className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-70"
                                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
                            >
                                Continue with {selectedValues.size}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Player Modal */}
            {activeVideo && (
                <VideoPlayer
                    video={activeVideo.video}
                    src={activeVideo.src}
                    onClose={() => setActiveVideo(null)}
                />
            )}
        </>
    );
}
