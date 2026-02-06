'use client';

import { useState } from 'react';

type QuickLogModalProps = {
    activityText: string;
    onSave: (feeling: 'great' | 'okay' | 'hard', note: string) => void;
    onCancel: () => void;
    existingCount: number; // How many times already logged
};

export default function QuickLogModal({
    activityText,
    onSave,
    onCancel,
    existingCount
}: QuickLogModalProps) {
    const [feeling, setFeeling] = useState<'great' | 'okay' | 'hard' | null>(null);
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);

    const handleSave = () => {
        if (!feeling) return;
        onSave(feeling, note);
    };

    const handleJustLog = () => {
        // Quick log without feeling/note - defaults to 'okay'
        onSave('okay', '');
    };

    const feelings = [
        {
            value: 'great' as const,
            emoji: '😊',
            label: 'Great',
            color: 'green',
            bgColor: 'bg-green-100',
            hoverColor: 'hover:bg-green-200',
            selectedColor: 'bg-green-500',
            textColor: 'text-green-700'
        },
        {
            value: 'okay' as const,
            emoji: '😐',
            label: 'Okay',
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            hoverColor: 'hover:bg-yellow-200',
            selectedColor: 'bg-yellow-500',
            textColor: 'text-yellow-700'
        },
        {
            value: 'hard' as const,
            emoji: '😔',
            label: 'Hard',
            color: 'orange',
            bgColor: 'bg-orange-100',
            hoverColor: 'hover:bg-orange-200',
            selectedColor: 'bg-orange-500',
            textColor: 'text-orange-700'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                            ✓
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Activity Logged!</h3>
                    </div>
                    <p className="text-sm text-gray-600">"{activityText}"</p>
                    {existingCount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                            Done {existingCount + 1} times this quarter 🎉
                        </p>
                    )}
                </div>

                {/* Feeling Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        How did it feel?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {feelings.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFeeling(f.value)}
                                className={`
                  p-4 rounded-xl border-2 transition-all transform
                  ${feeling === f.value
                                        ? `${f.selectedColor} border-${f.color}-600 text-white scale-105 shadow-lg`
                                        : `${f.bgColor} border-gray-200 ${f.textColor} ${f.hoverColor} hover:scale-105`
                                    }
                `}
                            >
                                <div className="text-3xl mb-1">{f.emoji}</div>
                                <div className="text-sm font-semibold">{f.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Note (Optional) */}
                <div className="mb-6">
                    {!showNote ? (
                        <button
                            onClick={() => setShowNote(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                            + Add quick note (optional)
                        </button>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Any insights? (optional)
                            </label>
                            <textarea
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g., Morning workouts work best!"
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900 text-sm"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    <button
                        onClick={handleSave}
                        disabled={!feeling}
                        className={`
              w-full py-3 rounded-xl font-bold transition
              ${feeling
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
            `}
                    >
                        {feeling ? 'Save & Close' : 'Select a feeling'}
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleJustLog}
                            className="flex-1 py-2 text-sm border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
                        >
                            Just Log (Skip Questions)
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2 text-sm border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Pattern Hint */}
                {existingCount >= 3 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
                            <strong>💡 Tip:</strong> You've done this {existingCount} times! Notice any patterns about when or how it works best?
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
