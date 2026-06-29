'use client';

import { trackValuesSaved } from '@/lib/analytics';
import { useToast } from '@/app/components/Toast';
import { logActivity } from '@/lib/accountability';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { Confetti } from '@/app/components/Confetti';

// ── Inline SVG Illustrations ──────────────────────────────────────────────────
const CompassIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="compassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#compassGrad)" opacity="0.1" />
        <circle cx="100" cy="100" r="60" fill="url(#compassGrad)" opacity="0.15" />
        <circle cx="100" cy="100" r="50" stroke="#4f46e5" strokeWidth="2" opacity="0.3" />
        <polygon points="100,45 108,90 100,80 92,90" fill="#ef4444" />
        <polygon points="100,155 108,110 100,120 92,110" fill="#6366f1" />
        <circle cx="100" cy="100" r="6" fill="#4f46e5" />
        <circle cx="100" cy="100" r="3" fill="white" />
    </svg>
);

const WbIcons = {
    pin: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    lightbulb: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
    target: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    sparkle: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    heart: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    shield: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    compass: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    quote: (cn = 'w-6 h-6') => <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>,
};

// Values from the workbook (pages 12-13)
const VALUES_LIST = [
    {
        name: 'Authenticity',
        description: 'Staying true to your values and authentic self.',
    },
    {
        name: 'Compassion',
        description: "Concern for others' misfortunes, tied to empathy, love, and forgiveness.",
    },
    {
        name: 'Commitment',
        description: 'Commitment to a cause or purpose.',
    },
    {
        name: 'Continuous Improvement',
        description: 'A process of analyzing and improving through curiosity and learning.',
    },
    {
        name: 'Courage',
        description: 'The ability to face fears, take risks and act innovatively to achieve a goal.',
    },
    {
        name: 'Creativity',
        description: 'The use of imagination or original ideas in accomplishing tasks.',
    },
    {
        name: 'Dependability',
        description: 'Being trustworthy and reliable.',
    },
    {
        name: 'Effort/Hard Work',
        description: 'Making a vigorous and determined attempt to achieve success.',
    },
    {
        name: 'Fairness',
        description: 'Impartial treatment without favoritism or discrimination.',
    },
    {
        name: 'Generosity',
        description: 'The virtue of freely helping, giving and being kind to others.',
    },
    {
        name: 'Gratitude',
        description: 'Appreciating what you have and expressing thanks.',
    },
    {
        name: 'Honesty and Integrity',
        description: 'Being truthful and following strong moral principles.',
    },
    {
        name: 'Humility',
        description: 'Valuing others and keeping a modest view of oneself.',
    },
    {
        name: 'Open Mindedness',
        description: 'Willingness to consider new ideas without prejudice.',
    },
    {
        name: 'Perseverance',
        description: 'Continuing despite difficulty, challenge or delay.',
    },
    {
        name: 'Positivity / Optimism',
        description: 'Acting positively in the present and being hopeful about the future.',
    },
    {
        name: 'Proactivity',
        description: 'Anticipating and acting to shape outcomes.',
    },
    {
        name: 'Self-respect',
        description: 'Caring about yourself and not tolerating disrespect.',
    },
    {
        name: 'Tolerance',
        description: 'Accepting opinions or behavior you may not agree with.',
    },
    {
        name: 'Wisdom',
        description: 'The quality of having experience, knowledge, and good judgment.',
    },
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
            // Clamp the priority to valid range
            const clampedPriority = Math.max(1, Math.min(prev.length, Math.floor(newPriority)));

            // Find the item being updated
            const updatingIndex = prev.findIndex(v => v.name === valueName);
            if (updatingIndex === -1) return prev;

            // Create a new array without the updating item
            const otherValues = prev.filter((_, i) => i !== updatingIndex);

            // Insert the item at its new priority position (priority is 1-indexed)
            const newValues = [...otherValues];
            newValues.splice(clampedPriority - 1, 0, {
                ...prev[updatingIndex],
                priority: clampedPriority
            });

            // Renumber all priorities sequentially
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
            (e.currentTarget as HTMLInputElement).blur(); // Trigger blur to save
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
        const scrollThreshold = 100; // pixels from edge to trigger scroll
        const scrollSpeed = 10; // pixels per interval

        const windowHeight = window.innerHeight;
        const distanceFromTop = clientY;
        const distanceFromBottom = windowHeight - clientY;

        // Clear any existing scroll interval
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }

        // Scroll up if near top
        if (distanceFromTop < scrollThreshold) {
            scrollInterval.current = setInterval(() => {
                window.scrollBy(0, -scrollSpeed);
            }, 16); // ~60fps
        }
        // Scroll down if near bottom
        else if (distanceFromBottom < scrollThreshold) {
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

        // Trigger auto-scroll
        handleAutoScroll(e.clientY);
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
        // Stop auto-scroll when leaving an item
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    const handleDrop = (e: React.DragEvent, targetValueName: string) => {
        e.preventDefault();

        // Stop auto-scroll
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

            // Update priorities
            return newValues.map((v, index) => ({ ...v, priority: index + 1 }));
        });

        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);

        // Stop auto-scroll
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    // ── Touch drag handlers (mobile) ──────────────────────────────────────────
    const handleTouchStart = (valueName: string) => {
        touchDragName.current = valueName;
        setDraggedItem(valueName);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchDragName.current) return;
        // Prevent page scroll while dragging
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

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-24">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="space-y-6">
                        </div>
                    </div>
                </div>
            </>
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
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Values Saved! ✨</h2>
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
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12">
                    {/* Step 1: Introduction (Navy-Teal Gradient) */}
                    {currentStep === 1 && (
                        <div className="min-h-screen flex items-center justify-center animate-fade-in">
                            <div className="max-w-2xl w-full">
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6">
                                            <CompassIllustration />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                            Define Your Values
                                        </h1>
                                        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                                            Your Values are the principles and standards of behavior that guide your life decisions.
                                            They form the foundation of your LifeFrame and influence everything that follows.
                                        </p>
                                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-sm font-semibold text-indigo-700 mb-8">
                                            {WbIcons.compass('w-4 h-4')}
                                            <span>LifeFrame • Step 1 of 3 • 15-30 min</span>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all transform hover:scale-105"
                                            >
                                                Let's Begin →
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
                                            <p className="text-gray-300">Understanding Your Values</p>
                                        </div>
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                            5 min
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                            What Are Values?
                                        </h2>
                                        <p className="text-gray-800 mb-6">
                                            Learn how to identify the principles that will guide your decisions and bring you
                                            deep satisfaction. Tim explains the difference between values, interests, and goals.
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
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

                    {/* Step 3: Examples of Values in Action */}
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
                                        Values in Action
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-8">
                                        Here are real examples of how values guide people's lives:
                                    </p>

                                    <div className="space-y-5">
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                                                    {WbIcons.compass('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Tim - Authenticity & Continuous Improvement</h3>
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        Tim built a $2B company by staying true to his principles. His values of
                                                        <strong> authenticity</strong> (never compromising who he is) and <strong>continuous improvement</strong> (always
                                                        learning and growing) guided every business decision — from hiring to partnerships to how he treated his team.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-green-500/20">
                                                    {WbIcons.sparkle('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Jess - Creativity & Generosity</h3>
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        After a successful career in admissions in education, Jess opened an art school for adults to address loneliness in her community. Her values of
                                                        <strong> creativity</strong> and <strong>generosity</strong> shaped her business model — building community while providing a place for people to express their creativity.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/20">
                                                    {WbIcons.heart('w-5 h-5')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Laura - Compassion & Perseverance</h3>
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        Laura turned her passion for fitness into a career as a group class instructor and personal trainer. Her values of
                                                        <strong> compassion</strong> (genuinely caring about each person's journey) and <strong>perseverance</strong> (never giving up on her clients or herself) drive her to help others achieve their health goals every day.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                                            <span className="text-indigo-500 flex-shrink-0 mt-0.5">{WbIcons.lightbulb('w-5 h-5')}</span>
                                            <p className="text-gray-700 text-sm">
                                                <strong>Notice the pattern:</strong> Each person's values directly influenced their major life
                                                decisions. When your actions align with your values, you experience fulfillment—even when facing
                                                challenges.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(4)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl hover:shadow-indigo-600/20 transition"
                                        >
                                            Next: Why Values Matter →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Why Values Matter */}
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
                                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                            Why Values Matter
                                        </h2>
                                        <p className="text-lg text-gray-600">
                                            The foundation of everything that follows
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                                                {WbIcons.compass('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">Values Guide Your Decisions</h3>
                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                    When faced with tough choices, your values act as a compass. Should you take that job?
                                                    Move to that city? End that relationship? Your values provide clarity.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/20">
                                                {WbIcons.sparkle('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">Values Shape Your Purpose</h3>
                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                    Your purpose emerges from your values. If you value creativity and generosity, your purpose
                                                    might involve using your creative gifts to help others. Values → Purpose → Goals.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl border border-pink-100">
                                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-pink-500/20">
                                                {WbIcons.shield('w-5 h-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">Values Build Self-Esteem</h3>
                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                    When your actions align with your values, you respect yourself. You feel authentic.
                                                    This alignment is the foundation of lasting contentment.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
                                            <span className="absolute -top-3 left-6 text-amber-300">{WbIcons.quote('w-8 h-8')}</span>
                                            <p className="text-gray-800 text-base italic leading-relaxed mt-2">
                                                "The more you put into defining your values, the more you'll get out of this entire
                                                framework. Your values influence everything: your purpose, your goals, your relationships,
                                                and ultimately your level of contentment."
                                            </p>
                                            <p className="text-amber-700 font-semibold mt-3 text-sm">— Tim Collins</p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all transform hover:scale-105"
                                        >
                                            Ready to Select Your Values →
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

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    {WbIcons.pin('w-6 h-6')}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">Define Your Values</h1>
                                    <p className="text-lg text-gray-600">Select and prioritize what matters most to you</p>
                                </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className={`h-2 flex-1 rounded-full ${phase === 'select' ? 'bg-purple-600' : 'bg-green-500'}`}></div>
                                <div className={`h-2 flex-1 rounded-full ${phase === 'prioritize' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                            </div>

                            {/* Instructions Box */}
                            {phase === 'select' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-500 flex-shrink-0 mt-0.5">{WbIcons.lightbulb('w-6 h-6')}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">How to Select Your Values</h3>
                                            <ul className="space-y-2 text-gray-800">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-600 font-bold">•</span>
                                                    <span><strong>Click on values</strong> that resonate with you (they'll turn purple)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-600 font-bold">•</span>
                                                    <span><strong>Hover to read</strong> the full description of each value</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-600 font-bold">•</span>
                                                    <span><strong>Aim for 5 to 10 values</strong> — the ones most important to who you want to be</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-600 font-bold">•</span>
                                                    <span>Think about: <em>What type of person do I want to be?</em></span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {phase === 'prioritize' && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-500 flex-shrink-0 mt-0.5">{WbIcons.target('w-6 h-6')}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">How to Prioritize Your Values</h3>
                                            <ul className="space-y-2 text-gray-800">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-purple-600 font-bold">•</span>
                                                    <span><strong>Drag and drop</strong> values to reorder them (use the ⋮⋮ handle)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-purple-600 font-bold">•</span>
                                                    <span><strong>Type a number</strong> to set priority directly (1 = most important)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-purple-600 font-bold">•</span>
                                                    <span><strong>Remove values</strong> by clicking the X if you change your mind</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-purple-600 font-bold">•</span>
                                                    <span>Your #1 value should be the most important principle guiding your life</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-800 mb-6">
                                {phase === 'select'
                                    ? `Selected: ${selectedValues.size} values`
                                    : "Your values are now prioritized from most to least important."
                                }
                            </p>

                            {/* Phase 1: Select Values */}
                            {phase === 'select' && (
                                <>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                        {VALUES_LIST.map((value) => (
                                            <div
                                                key={value.name}
                                                onClick={() => toggleValue(value.name)}
                                                onMouseEnter={() => setHoveredValue(value.name)}
                                                onMouseLeave={() => setHoveredValue(null)}
                                                className={`
                          relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                          ${selectedValues.has(value.name)
                                                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl ring-4 ring-purple-300'
                                                        : 'bg-white hover:shadow-lg border-2 border-gray-200 hover:border-purple-300'
                                                    }
                        `}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className={`font-bold text-lg ${selectedValues.has(value.name) ? 'text-white' : 'text-gray-900'}`}>
                                                        {value.name}
                                                    </h3>
                                                    {selectedValues.has(value.name) && (
                                                        <svg className="w-6 h-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className={`
                          text-sm transition-all duration-300
                          ${hoveredValue === value.name || selectedValues.has(value.name)
                                                        ? 'opacity-100 max-h-20'
                                                        : 'opacity-0 max-h-0 overflow-hidden'
                                                    }
                          ${selectedValues.has(value.name) ? 'text-purple-100' : 'text-gray-700'}
                        `}>
                                                    {value.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={moveToPhase2}
                                            disabled={selectedValues.size === 0}
                                            className={`
                        px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105
                        ${selectedValues.size === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                                                }
                      `}
                                        >
                                            Continue to Prioritize →
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Phase 2: Prioritize Values */}
                            {phase === 'prioritize' && (
                                <div className="max-w-4xl mx-auto">
                                    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-gray-900">Your Values (Prioritized)</h2>
                                            <button
                                                onClick={() => setPhase('select')}
                                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm font-semibold"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Edit Selection
                                            </button>
                                        </div>

                                        <div className="space-y-3">
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
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-move touch-none ${draggedItem === value.name
                                                        ? 'opacity-50 scale-95'
                                                        : dragOverItem === value.name
                                                            ? 'bg-gradient-to-r from-purple-100 to-blue-100 ring-2 ring-purple-400 scale-105'
                                                            : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md'
                                                        }`}
                                                >
                                                    {/* Drag handle icon */}
                                                    <div className="cursor-grab active:cursor-grabbing text-gray-400">
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
                                                            className={`w-16 px-3 py-2 text-center font-bold text-lg text-gray-900 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${editingPriority?.name === value.name
                                                                ? 'border-blue-500 focus:ring-blue-600'
                                                                : 'border-purple-300 focus:ring-purple-600'
                                                                }`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {editingPriority?.name === value.name && (
                                                            <div className="absolute -bottom-5 left-0 text-xs text-blue-600 whitespace-nowrap">
                                                                Press Enter ↵
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900">{value.name}</h3>
                                                        <p className="text-sm text-gray-700">{value.description}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => removeValue(value.name)}
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
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
                                            <div className="text-center py-12 text-gray-500">
                                                <p>No values selected yet.</p>
                                                <button
                                                    onClick={() => setPhase('select')}
                                                    className="mt-4 text-purple-600 hover:text-purple-800 font-semibold"
                                                >
                                                    ← Go back to select values
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-center gap-4 flex-wrap">
                                        <button
                                            onClick={() => setPhase('select')}
                                            className="px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-300 text-gray-800 hover:border-purple-600 hover:text-purple-600 transition"
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
                                            className={`
                        px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-2
                        ${prioritizedValues.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl'
                                                }
                      `}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export
                                        </button>
                                        <button
                                            onClick={saveValues}
                                            disabled={saving || prioritizedValues.length === 0}
                                            className={`
                        px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105
                        ${saving || prioritizedValues.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl'
                                                }
                      `}
                                        >
                                            {saving ? 'Saving...' : 'Save & Continue →'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >
        
            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Few Values Confirmation Dialog */}
            {showFewValuesConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Only {selectedValues.size} {selectedValues.size === 1 ? 'Value' : 'Values'} Selected</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            We recommend selecting <strong>5 to 10 values</strong> to get the most out of your LifeFrame. This range gives you a focused yet rich picture of what drives you.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFewValuesConfirm(false)}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                            >
                                Select More
                            </button>
                            <button
                                onClick={proceedToPhase2}
                                className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition"
                            >
                                Continue Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Too Many Values Confirmation Dialog */}
            {showTooManyValuesConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Are You Sure?</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            You've selected <strong>{selectedValues.size} values</strong>. We suggest narrowing to <strong>5 to 10</strong> for the most impact. Fewer values help you stay focused on what matters most.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTooManyValuesConfirm(false)}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                            >
                                Go Back & Refine
                            </button>
                            <button
                                onClick={() => { setShowTooManyValuesConfirm(false); proceedToPhase2(); }}
                                className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition"
                            >
                                Continue with {selectedValues.size}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
