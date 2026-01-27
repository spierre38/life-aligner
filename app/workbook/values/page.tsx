'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { AuthNavbar } from '@/app/components/AuthNavbar';
import { VideoPlaceholder } from '@/app/components/VideoPlaceholder';

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
    const [phase, setPhase] = useState<'select' | 'prioritize'>('select');
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
    const [prioritizedValues, setPrioritizedValues] = useState<SelectedValue[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
                    // Load existing values
                    const saved = data.content.selected_values || [];
                    setSelectedValues(new Set(saved.map((v: SelectedValue) => v.name)));
                    setPrioritizedValues(saved);
                    if (saved.length > 0) {
                        setPhase('prioritize');
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
        // Convert selected values to prioritized list
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
            // Re-sort by priority
            return updated.sort((a, b) => a.priority - b.priority);
        });
    };

    const removeValue = (valueName: string) => {
        setPrioritizedValues(prev => {
            const filtered = prev.filter(v => v.name !== valueName);
            // Re-assign priorities
            return filtered.map((v, index) => ({ ...v, priority: index + 1 }));
        });
        setSelectedValues(prev => {
            const newSet = new Set(prev);
            newSet.delete(valueName);
            return newSet;
        });
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newValues = [...prioritizedValues];
        const [draggedItem] = newValues.splice(draggedIndex, 1);
        newValues.splice(dropIndex, 0, draggedItem);

        // Re-assign priorities based on new order
        const reordered = newValues.map((v, index) => ({ ...v, priority: index + 1 }));
        setPrioritizedValues(reordered);

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
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

            // Show success animation
            setShowSuccess(true);

            // Wait 2 seconds then redirect
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 pt-24">
                {/* Header */}
                <div className="max-w-6xl mx-auto mb-8">
                    {/* Video Placeholder */}
                    <VideoPlaceholder
                        title="Understanding Your Values"
                        description="Learn what values are and how to identify the principles that will guide your life decisions."
                        duration="5 min"
                        worksheetPath="/workbook/values"
                        icon="📌"
                    />

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
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            📌
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Define Your Values</h1>
                            <p className="text-lg text-gray-800">LifeFrame • Step 1 of 5</p>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`h-2 flex-1 rounded-full ${phase === 'select' ? 'bg-purple-600' : 'bg-green-500'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${phase === 'prioritize' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                    </div>

                    <p className="text-gray-700 mb-2">
                        {phase === 'select'
                            ? "Select the values that resonate most with you. Think about what type of person you want to be."
                            : "Now prioritize your selected values. Assign numbers to reflect which are most important to you."
                        }
                    </p>
                    <p className="text-sm text-gray-500">
                        {phase === 'select'
                            ? `Selected: ${selectedValues.size} values (aim for 10-15)`
                            : `Prioritized: ${prioritizedValues.length} values`
                        }
                    </p>
                </div>

                {/* Phase 1: Select Values */}
                {phase === 'select' && (
                    <div className="max-w-6xl mx-auto">
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

                                    {/* Description - show on hover or when selected */}
                                    <div className={`
                  text-sm transition-all duration-300
                  ${hoveredValue === value.name || selectedValues.has(value.name)
                                            ? 'opacity-100 max-h-20'
                                            : 'opacity-0 max-h-0 overflow-hidden'
                                        }
                  ${selectedValues.has(value.name) ? 'text-purple-100' : 'text-gray-800'}
                `}>
                                        {value.description}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Continue Button */}
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
                    </div>
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

                            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                                Drag to reorder or type priority numbers
                            </p>

                            <div className="space-y-3">
                                {prioritizedValues.map((value, index) => (
                                    <div
                                        key={value.name}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                        flex items-center gap-4 p-4 rounded-xl transition-all cursor-move
                                        ${draggedIndex === index
                                                ? 'opacity-50 scale-95'
                                                : dragOverIndex === index
                                                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 shadow-lg scale-105 ring-2 ring-purple-400'
                                                    : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md'
                                            }
                                    `}
                                    >
                                        {/* Drag Handle */}
                                        <div className="text-gray-400 hover:text-purple-600 cursor-grab active:cursor-grabbing">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>

                                        {/* Priority Number Input */}
                                        <input
                                            type="number"
                                            min="1"
                                            max={prioritizedValues.length}
                                            value={value.priority}
                                            onChange={(e) => updatePriority(value.name, parseInt(e.target.value) || 1)}
                                            className="w-16 px-3 py-2 text-center font-bold text-lg text-gray-900 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        {/* Value Info */}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{value.name}</h3>
                                            <p className="text-sm text-gray-800">{value.description}</p>
                                        </div>

                                        {/* Remove Button */}
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

                        {/* Save Button */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setPhase('select')}
                                className="px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-300 text-gray-700 hover:border-purple-600 hover:text-purple-600 transition"
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
        </>
    );
}
