'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { AuthNavbar } from '@/app/components/AuthNavbar';

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
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [phase, setPhase] = useState<'select' | 'prioritize'>('select');
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
    const [prioritizedValues, setPrioritizedValues] = useState<SelectedValue[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

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
            const updated = prev.map(v =>
                v.name === valueName ? { ...v, priority: newPriority } : v
            );
            return updated.sort((a, b) => a.priority - b.priority);
        });
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

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, valueName: string) => {
        setDraggedItem(valueName);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, valueName: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverItem(valueName);
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = (e: React.DragEvent, targetValueName: string) => {
        e.preventDefault();

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

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving values:', error);
            alert('Failed to save values. Please try again.');
        } finally {
            setSaving(false);
        }
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
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f44] via-[#1e4d7b] to-[#3b8b9f] rounded-3xl transform rotate-1"></div>
                                <div className="relative bg-white rounded-3xl p-12 shadow-2xl max-w-3xl">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6">
                                            📌
                                        </div>
                                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                                            Define Your Values
                                        </h1>
                                        <p className="text-xl text-gray-800 leading-relaxed mb-8">
                                            Your Values are the principles and standards of behavior that guide your life decisions.
                                            They form the foundation of your LifeFrame and influence everything that follows.
                                        </p>
                                        <p className="text-lg text-gray-700 mb-8">
                                            LifeFrame • Step 1 of 5 • 15-30 minutes
                                        </p>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
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

                                <div className="bg-white rounded-3xl shadow-2xl p-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                        Values in Action
                                    </h2>
                                    <p className="text-lg text-gray-800 mb-8">
                                        Here are real examples of how values guide people's lives:
                                    </p>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    A
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sarah - Authenticity & Compassion</h3>
                                                    <p className="text-gray-800">
                                                        Sarah left a high-paying corporate job to become a social worker. Her values of
                                                        <strong> authenticity</strong> (being true to herself) and <strong>compassion</strong> (helping
                                                        others) guided this decision. She makes less money but feels fulfilled every day.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    M
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Marcus - Perseverance & Growth</h3>
                                                    <p className="text-gray-800">
                                                        Marcus failed his first startup but launched a second one. His values of
                                                        <strong> perseverance</strong> and <strong>continuous improvement</strong> meant he learned
                                                        from mistakes instead of giving up. The second company is now thriving.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    J
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Jess - Creativity & Generosity</h3>
                                                    <p className="text-gray-800">
                                                        Jess opened an art school for adults to address loneliness in her community. Her values of
                                                        <strong> creativity</strong> and <strong>generosity</strong> shaped her business model—making
                                                        art accessible to everyone, not just those who can afford expensive classes.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                            <p className="text-gray-800">
                                                💡 <strong>Notice the pattern:</strong> Each person's values directly influenced their major life
                                                decisions. When your actions align with your values, you experience fulfillment—even when facing
                                                challenges.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(4)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition"
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

                                <div className="bg-white rounded-3xl shadow-2xl p-12">
                                    <div className="text-center mb-10">
                                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                            Why Values Matter
                                        </h2>
                                        <p className="text-xl text-gray-800">
                                            The foundation of everything that follows
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 Values Guide Your Decisions</h3>
                                            <p className="text-gray-800">
                                                When faced with tough choices, your values act as a compass. Should you take that job?
                                                Move to that city? End that relationship? Your values provide clarity.
                                            </p>
                                        </div>

                                        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">✨ Values Shape Your Purpose</h3>
                                            <p className="text-gray-800">
                                                Your purpose emerges from your values. If you value creativity and generosity, your purpose
                                                might involve using your creative gifts to help others. Values → Purpose → Goals.
                                            </p>
                                        </div>

                                        <div className="p-6 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">💪 Values Build Self-Esteem</h3>
                                            <p className="text-gray-800">
                                                When your actions align with your values, you respect yourself. You feel authentic.
                                                This alignment is the foundation of lasting contentment.
                                            </p>
                                        </div>

                                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                            <p className="text-gray-800 text-lg">
                                                <strong>"The more you put into defining your values, the more you'll get out of this entire
                                                    framework. Your values influence everything: your purpose, your goals, your relationships,
                                                    and ultimately your level of contentment."</strong>
                                            </p>
                                            <p className="text-gray-700 mt-2">— Tim Collins</p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
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
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    📌
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">Define Your Values</h1>
                                    <p className="text-lg text-gray-800">Select and prioritize what matters most to you</p>
                                </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className={`h-2 flex-1 rounded-full ${phase === 'select' ? 'bg-purple-600' : 'bg-green-500'}`}></div>
                                <div className={`h-2 flex-1 rounded-full ${phase === 'prioritize' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                            </div>

                            <p className="text-gray-800 mb-6">
                                {phase === 'select'
                                    ? "Select the values that resonate most with you. Think about what type of person you want to be."
                                    : "Now prioritize your selected values. Assign numbers to reflect which are most important to you."
                                }
                            </p>

                            {/* Phase 1: Select Values */}
                            {phase === 'select' && (
                                <>
                                    <p className="text-sm text-gray-700 mb-6">
                                        Selected: {selectedValues.size} values (aim for 10-15)
                                    </p>

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
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, value.name)}
                                                    onDragOver={(e) => handleDragOver(e, value.name)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, value.name)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-move ${draggedItem === value.name
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

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={prioritizedValues.length}
                                                        value={value.priority}
                                                        onChange={(e) => updatePriority(value.name, parseInt(e.target.value) || 1)}
                                                        className="w-16 px-3 py-2 text-center font-bold text-lg text-gray-900 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />

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

                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => setPhase('select')}
                                            className="px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-300 text-gray-800 hover:border-purple-600 hover:text-purple-600 transition"
                                        >
                                            ← Back
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
            </div>
        </>
    );
}
