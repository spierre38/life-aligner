'use client';

import { useState } from 'react';

type Step = 1 | 2 | 3 | 4;

interface Props {
    categories: string[];
    defaultCategory?: string;
    onSave: (goal: {
        category: string;
        type: 'goal' | 'behavior_change';
        title: string;
        why: string;
        activities: string[];
    }) => Promise<void>;
    onClose: () => void;
}

export function AddGoalModal({ categories, defaultCategory, onSave, onClose }: Props) {
    const [step, setStep] = useState<Step>(defaultCategory ? 2 : 1);
    const [category, setCategory] = useState(defaultCategory ?? (categories[0] ?? ''));
    const [type, setType] = useState<'goal' | 'behavior_change'>('goal');
    const [title, setTitle] = useState('');
    const [why, setWhy] = useState('');
    const [activities, setActivities] = useState(['', '', '']);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const filledActivities = activities.filter(a => a.trim());

    const canAdvance = () => {
        if (step === 1) return category.trim() !== '';
        if (step === 2) return true; // type always selected
        if (step === 3) return title.trim().length >= 3;
        if (step === 4) return filledActivities.length >= 1;
        return false;
    };

    const advance = () => {
        if (step < 4) setStep((step + 1) as Step);
    };

    const back = () => {
        if (step > 1) setStep((step - 1) as Step);
    };

    const handleSave = async () => {
        if (!canAdvance()) return;
        setSaving(true);
        setError('');
        try {
            await onSave({ category, type, title: title.trim(), why: why.trim(), activities: filledActivities });
            onClose();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateActivity = (i: number, val: string) => {
        const next = [...activities];
        next[i] = val;
        setActivities(next);
    };

    const addActivityField = () => {
        if (activities.length < 5) setActivities([...activities, '']);
    };

    const STEPS = ['Category', 'Type', 'Goal', 'Activities'];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

                {/* Step indicator */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Add a Goal</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-2 mb-6">
                        {STEPS.map((label, i) => (
                            <div key={label} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                                    i + 1 < step ? 'bg-green-500 text-white' :
                                    i + 1 === step ? 'bg-gray-900 text-white' :
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {i + 1 < step ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : i + 1}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full ${i + 1 < step ? 'bg-green-400' : 'bg-gray-100'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    <div className="min-h-[200px]">

                        {/* Step 1: Category */}
                        {step === 1 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Which area of your life is this goal for?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                                                category === cat
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Type */}
                        {step === 2 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Is this a one-time goal or an ongoing habit?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setType('goal')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            type === 'goal' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-bold text-gray-900 mb-1 text-sm">Goal</div>
                                        <div className="text-xs text-gray-500">Something you want to achieve — a finish line</div>
                                    </button>
                                    <button
                                        onClick={() => setType('behavior_change')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            type === 'behavior_change' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-bold text-gray-900 mb-1 text-sm">Habit</div>
                                        <div className="text-xs text-gray-500">Something you want to do consistently</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Title + Why */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        What's your {type === 'goal' ? 'goal' : 'habit'}?
                                    </label>
                                    <textarea
                                        autoFocus
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder={type === 'goal' ? 'e.g. Run a 5K by June' : 'e.g. Meditate for 10 minutes every morning'}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Why does this matter? <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={why}
                                        onChange={e => setWhy(e.target.value)}
                                        placeholder="e.g. I want more energy to be present with my family"
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 4: Activities */}
                        {step === 4 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">
                                    What actions will you take? Add at least one.
                                </p>
                                <div className="space-y-2">
                                    {activities.map((act, i) => (
                                        <input
                                            key={i}
                                            autoFocus={i === 0}
                                            value={act}
                                            onChange={e => updateActivity(i, e.target.value)}
                                            placeholder={`Activity ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        />
                                    ))}
                                    {activities.length < 5 && (
                                        <button
                                            onClick={addActivityField}
                                            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 mt-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add another activity
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 mt-3">{error}</p>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="px-6 pb-6 flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={back}
                            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            Back
                        </button>
                    )}
                    {step < 4 ? (
                        <button
                            onClick={advance}
                            disabled={!canAdvance()}
                            className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Continue →
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={!canAdvance() || saving}
                            className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-40"
                        >
                            {saving ? 'Saving…' : 'Save Goal'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
