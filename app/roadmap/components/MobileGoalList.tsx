'use client';

/**
 * MobileGoalList.tsx
 *
 * Card-based goal list for mobile viewports, shown instead of BubbleCanvas.
 * Each card shows: goal title, life categories, progress ring, activity count,
 * and a "View Goal →" tap target that opens the GoalDetailView.
 *
 * Long-press a card → context sheet with View Details, Complete Goal, Delete.
 */

import { useState, useRef, useCallback } from 'react';
import type { Goal, Activity, RoadmapData } from '@/lib/roadmap-types';

// ─── Category color mapping ────────────────────────────────────────────────────

function CategoryDot({ cat }: { cat: string }) {
    const hue = stringToHue(cat);
    return (
        <span
            className="inline-flex items-center justify-center w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: `hsl(${hue}, 65%, 55%)` }}
            aria-hidden
        />
    );
}

function stringToHue(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return Math.abs(h) % 360;
}

// ─── Circular progress ring ────────────────────────────────────────────────────

function ProgressRing({ done, total, hue }: { done: number; total: number; hue: number }) {
    const r = 20;
    const circ = 2 * Math.PI * r;
    const pct = total > 0 ? done / total : 0;
    const dash = pct * circ;

    return (
        <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
            {/* Track */}
            <circle
                cx="26" cy="26" r={r}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
            />
            {/* Progress */}
            <circle
                cx="26" cy="26" r={r}
                fill="none"
                stroke={`hsl(${hue}, 65%, 55%)`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ / 4} // start from top
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
            {/* Count */}
            <text
                x="26" y="26"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight="600"
                fill="white"
            >
                {total > 0 ? `${Math.round(pct * 100)}%` : '–'}
            </text>
        </svg>
    );
}

// ─── Single Goal Card ──────────────────────────────────────────────────────────

function GoalCard({
    goal,
    activities,
    onOpen,
    onLongPress,
}: {
    goal: Goal;
    activities: Activity[];
    onOpen: (goalId: string) => void;
    onLongPress: (goal: Goal) => void;
}) {
    const goalActivities = activities.filter(a => a.connectedGoalIds.includes(goal.id));
    const done = goalActivities.filter(a => a.completed).length;
    const total = goalActivities.length;
    const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 250;

    // Long-press detection
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    const handlePointerDown = () => {
        didLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            // Haptic feedback
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(15);
            }
            onLongPress(goal);
        }, 500);
    };

    const handlePointerUpOrCancel = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleClick = () => {
        if (didLongPress.current) return; // swallow click after long-press
        onOpen(goal.id);
    };

    return (
        <div
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            onPointerLeave={handlePointerUpOrCancel}
            className="w-full text-left transition-all duration-150 active:scale-[0.98] select-none"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                padding: '16px',
            }}
        >
            <div className="flex items-start gap-3">
                {/* Progress ring */}
                <ProgressRing done={done} total={total} hue={hue} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-medium text-base mb-1.5 leading-snug"
                        style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}
                    >
                        {goal.title}
                    </h3>

                    {/* Category chips */}
                    {goal.connectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {goal.connectedCategories.map(cat => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                                    style={{
                                        background: `hsl(${stringToHue(cat)}, 50%, 20%)`,
                                        color: `hsl(${stringToHue(cat)}, 65%, 65%)`,
                                        border: `1px solid hsl(${stringToHue(cat)}, 50%, 30%)`,
                                    }}
                                >
                                    <CategoryDot cat={cat} />
                                    <span>{cat}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Activity count + hints */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                            {done}/{total} activities done
                        </span>
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'rgba(99,102,241,0.9)' }}>
                            View Goal
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            {total > 0 && (
                <div
                    className="mt-3 rounded-full overflow-hidden"
                    style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(done / total) * 100}%`,
                            background: `linear-gradient(90deg, hsl(${hue}, 65%, 45%), hsl(${(hue + 30) % 360}, 75%, 55%))`,
                        }}
                    />
                </div>
            )}

            {/* Hint text */}
            <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--color-text-dim)', opacity: 0.5 }}>
                Long-press for options
            </p>
        </div>
    );
}

// ─── Goal Context Sheet (bottom sheet overlay) ─────────────────────────────────

function GoalContextSheet({
    goal,
    onClose,
    onViewDetails,
    onComplete,
    onDelete,
}: {
    goal: Goal;
    onClose: () => void;
    onViewDetails: () => void;
    onComplete: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[70] flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="w-full rounded-t-3xl"
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderBottom: 'none',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
                </div>

                {/* Goal title */}
                <div className="px-5 pt-2 pb-4">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        {goal.title}
                    </h3>
                    {goal.connectedCategories.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                            {goal.connectedCategories.join(' · ')}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-3 space-y-1.5">
                    {/* View Details */}
                    <button
                        onClick={onViewDetails}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        <span className="text-base">📋</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>View Details</span>
                        <svg className="w-4 h-4 ml-auto" style={{ color: 'var(--color-text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Complete Goal */}
                    <button
                        onClick={onComplete}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}
                    >
                        <span className="text-base">✅</span>
                        <span className="text-sm font-medium" style={{ color: '#34d399' }}>Complete Goal</span>
                    </button>

                    {/* Delete Goal */}
                    <button
                        onClick={onDelete}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                    >
                        <span className="text-base">🗑️</span>
                        <span className="text-sm font-medium text-red-400">Delete Goal</span>
                    </button>
                </div>

                {/* Cancel */}
                <div className="px-4 pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]"
                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface MobileGoalListProps {
    roadmap: RoadmapData;
    onOpenGoal: (goalId: string) => void;
    onAddGoal: () => void;
    onReviewAll: () => void;
    onCompleteGoal?: (goal: Goal) => void;
    onDeleteGoal?: (goalId: string) => void;
}

export default function MobileGoalList({
    roadmap,
    onOpenGoal,
    onAddGoal,
    onReviewAll,
    onCompleteGoal,
    onDeleteGoal,
}: MobileGoalListProps) {
    const activeGoals = roadmap.goals.filter(g => g.status === 'active');
    const totalActivities = roadmap.activities.length;
    const doneActivities = roadmap.activities.filter(a => a.completed).length;
    const [contextGoal, setContextGoal] = useState<Goal | null>(null);

    const handleLongPress = useCallback((goal: Goal) => {
        setContextGoal(goal);
    }, []);

    return (
        <div
            className="min-h-screen pt-navbar pb-24"
            style={{ background: 'var(--color-bg)' }}
        >
            <div className="px-4 py-6">

                {/* Header */}
                <div className="mb-6">
                    <h1
                        className="text-2xl font-light mb-1"
                        style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}
                    >
                        My Roadmap
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                        {activeGoals.length} goals · {doneActivities}/{totalActivities} activities done
                    </p>
                </div>

                {/* Goal cards */}
                <div className="space-y-3 mb-6">
                    {activeGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            activities={roadmap.activities}
                            onOpen={onOpenGoal}
                            onLongPress={handleLongPress}
                        />
                    ))}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    <button
                        onClick={onAddGoal}
                        id="mobile-add-goal-btn"
                        className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                        style={{
                            background: 'rgba(99,102,241,1)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        }}
                    >
                        + Add Goal
                    </button>
                    {totalActivities > 0 && (
                        <button
                            onClick={onReviewAll}
                            className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]"
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            Review All Activities
                        </button>
                    )}
                </div>
            </div>

            {/* Context sheet */}
            {contextGoal && (
                <GoalContextSheet
                    goal={contextGoal}
                    onClose={() => setContextGoal(null)}
                    onViewDetails={() => { setContextGoal(null); onOpenGoal(contextGoal.id); }}
                    onComplete={() => { setContextGoal(null); onCompleteGoal?.(contextGoal); }}
                    onDelete={() => { setContextGoal(null); onDeleteGoal?.(contextGoal.id); }}
                />
            )}
        </div>
    );
}
