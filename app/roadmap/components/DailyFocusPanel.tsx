// app/roadmap/components/DailyFocusPanel.tsx
'use client';

import { useState } from 'react';

interface FocusActivity {
    itemId: string;
    activityId: string;
    activityText: string;
    goalTitle: string;
    category: string;
    existingCount: number;
}

interface DailyFocusPanelProps {
    streak: { current: number; longest: number; todayLogged: boolean };
    focusActivities: FocusActivity[];
    weeklyStats: { thisWeek: number; lastWeek: number; trend: 'up' | 'down' | 'same' };
    milestone: { message: string; emoji: string } | null;
    onLogActivity: (
        itemId: string,
        activityId: string,
        feeling: 'great' | 'okay' | 'hard',
        note: string
    ) => void;
}

export function DailyFocusPanel({
    streak,
    focusActivities,
    weeklyStats,
    milestone,
    onLogActivity
}: DailyFocusPanelProps) {
    const [loggingIndex, setLoggingIndex] = useState<number | null>(null);
    const [selectedFeeling, setSelectedFeeling] = useState<'great' | 'okay' | 'hard' | null>(null);
    const [journalNote, setJournalNote] = useState('');
    const [completedIndices, setCompletedIndices] = useState<number[]>([]);
    const [showMilestone, setShowMilestone] = useState(!!milestone);
    const [showConfetti, setShowConfetti] = useState(!!milestone);

    const allDone = focusActivities.length > 0 && completedIndices.length >= focusActivities.length;

    const handleLog = (index: number) => {
        if (completedIndices.includes(index)) return;
        setLoggingIndex(index);
        setSelectedFeeling(null);
        setJournalNote('');
    };

    const submitLog = () => {
        if (loggingIndex === null || !selectedFeeling) return;
        const activity = focusActivities[loggingIndex];

        onLogActivity(activity.itemId, activity.activityId, selectedFeeling, journalNote);
        setCompletedIndices([...completedIndices, loggingIndex]);
        setLoggingIndex(null);
        setSelectedFeeling(null);
        setJournalNote('');
    };

    const feelings = [
        { value: 'great' as const, emoji: '😊', label: 'Great', color: 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' },
        { value: 'okay' as const, emoji: '😐', label: 'Okay', color: 'bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200' },
        { value: 'hard' as const, emoji: '😤', label: 'Hard', color: 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200' },
    ];

    const journalPrompts = [
        "What did you notice about yourself today?",
        "What made this easier or harder than expected?",
        "What would you tell your future self about today?",
        "How does this connect to what matters most to you?",
        "What small win are you proud of?",
    ];
    const todayPrompt = journalPrompts[new Date().getDay() % journalPrompts.length];

    return (
        <div className="relative mb-8">
            {/* Confetti overlay for milestone */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                backgroundColor: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#F97316'][i % 6],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`,
                                opacity: 0.8,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Milestone celebration banner */}
            {showMilestone && milestone && (
                <div className="mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-white rounded-2xl p-4 shadow-lg animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{milestone.emoji}</span>
                            <div>
                                <div className="text-lg font-bold">{milestone.message}</div>
                                <div className="text-sm opacity-90">{streak.current}-day streak! Keep it up!</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowMilestone(false); setShowConfetti(false); }}
                            className="text-white/80 hover:text-white font-bold text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Main Panel */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                {/* Top bar: Streak + Weekly Stats */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        {/* Streak */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">{streak.current > 0 ? '🔥' : '💤'}</span>
                                <div>
                                    <div className="text-3xl font-black">{streak.current}</div>
                                    <div className="text-xs text-white/80 font-semibold">day streak</div>
                                </div>
                            </div>
                            {streak.longest > streak.current && (
                                <div className="text-xs bg-white/20 px-3 py-1 rounded-full">
                                    Best: {streak.longest} days
                                </div>
                            )}
                        </div>

                        {/* Weekly Stats */}
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-2xl font-bold">{weeklyStats.thisWeek}</span>
                                <span className="text-sm text-white/80">this week</span>
                                {weeklyStats.trend === 'up' && <span className="text-green-300 font-bold">↑</span>}
                                {weeklyStats.trend === 'down' && <span className="text-red-300 font-bold">↓</span>}
                            </div>
                            {weeklyStats.lastWeek > 0 && (
                                <div className="text-xs text-white/70">
                                    vs {weeklyStats.lastWeek} last week
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today status */}
                    <div className="mt-3 flex items-center gap-2">
                        {streak.todayLogged ? (
                            <span className="bg-green-500/30 text-green-100 px-3 py-1 rounded-full text-xs font-bold">
                                ✓ Logged today
                            </span>
                        ) : (
                            <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-bold">
                                ○ Not logged yet today
                            </span>
                        )}
                    </div>
                </div>

                {/* Focus Activities */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {allDone ? '🎉 All done for today!' : "Today's Focus"}
                    </h3>
                    {!allDone && (
                        <p className="text-sm text-gray-500 mb-4">
                            Your most important activities right now
                        </p>
                    )}

                    {allDone ? (
                        <div className="text-center py-6">
                            <div className="text-5xl mb-3 animate-bounce">🌟</div>
                            <p className="text-gray-700 font-semibold">
                                Amazing work! Come back tomorrow to keep your streak alive.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                You've logged {completedIndices.length} activities today
                            </p>
                        </div>
                    ) : focusActivities.length === 0 ? (
                        <div className="text-center py-6">
                            <div className="text-4xl mb-2">✨</div>
                            <p className="text-gray-600">Add goals to your roadmap to see today's focus</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {focusActivities.map((activity, index) => {
                                const isDone = completedIndices.includes(index);
                                const isLogging = loggingIndex === index;

                                return (
                                    <div key={`${activity.itemId}-${activity.activityId}`}>
                                        {/* Activity Row */}
                                        <div
                                            className={`
                                                flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
                                                ${isDone
                                                    ? 'bg-green-50 border-green-200'
                                                    : isLogging
                                                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                                        : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                }
                                            `}
                                            onClick={() => !isDone && handleLog(index)}
                                        >
                                            {/* Status indicator */}
                                            <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all
                                                ${isDone
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : 'bg-white border-2 border-gray-300 text-gray-400'
                                                }
                                            `}>
                                                {isDone ? '✓' : index + 1}
                                            </div>

                                            {/* Activity info */}
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                    {activity.activityText}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {activity.category} → {activity.goalTitle}
                                                </div>
                                            </div>

                                            {/* Action hint */}
                                            {!isDone && (
                                                <div className="text-indigo-500 font-semibold text-sm flex-shrink-0">
                                                    Log →
                                                </div>
                                            )}
                                        </div>

                                        {/* Inline Logging Form */}
                                        {isLogging && (
                                            <div className="mt-2 ml-4 bg-white rounded-xl border-2 border-indigo-200 p-4 shadow-lg animate-in slide-in-from-top-2">
                                                {/* Feeling selector */}
                                                <div className="mb-4">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                                        How did it feel?
                                                    </label>
                                                    <div className="flex gap-2">
                                                        {feelings.map(f => (
                                                            <button
                                                                key={f.value}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedFeeling(f.value); }}
                                                                className={`
                                                                    flex-1 p-3 rounded-xl border-2 font-semibold transition-all text-center
                                                                    ${selectedFeeling === f.value
                                                                        ? `${f.color} ring-2 ring-offset-1 ring-indigo-400 scale-105`
                                                                        : `${f.color} opacity-70`
                                                                    }
                                                                `}
                                                            >
                                                                <div className="text-2xl mb-1">{f.emoji}</div>
                                                                <div className="text-xs">{f.label}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Journal note */}
                                                {selectedFeeling && (
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                                            Quick thought <span className="text-gray-400 font-normal">(optional)</span>
                                                        </label>
                                                        <p className="text-xs text-gray-500 mb-2 italic">{todayPrompt}</p>
                                                        <textarea
                                                            value={journalNote}
                                                            onChange={(e) => setJournalNote(e.target.value)}
                                                            placeholder="1-2 sentences..."
                                                            rows={2}
                                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none text-gray-900 text-sm resize-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); submitLog(); }}
                                                        disabled={!selectedFeeling}
                                                        className={`
                                                            flex-1 py-2.5 rounded-lg font-bold transition-all text-sm
                                                            ${selectedFeeling
                                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            }
                                                        `}
                                                    >
                                                        {selectedFeeling ? '✓ Log Activity' : 'Select a feeling first'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setLoggingIndex(null); }}
                                                        className="px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
