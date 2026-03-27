// app/roadmap/components/RoadmapLane.tsx
'use client';

import { Goal } from './RoadmapCanvas';
import { calculateGoalRecency, getRecencyMessage, getDecayStyles, calculateLaneDecay, getEncouragementMessage } from '@/lib/roadmap-decay-helpers';

interface RoadmapLaneProps {
  lane: {
    id: string;
    category: string;
    emoji: string;
    color: string;
    goals: Goal[];
    overallProgress: number;
  };
  onGoalClick: (goal: Goal) => void;
  onAddGoal: () => void;
}

export function RoadmapLane({ lane, onGoalClick, onAddGoal }: RoadmapLaneProps) {
  const calculateGoalProgress = (goal: Goal): number => {
    if (goal.activities.length === 0) return 0;
    const completed = goal.activities.filter(a => a.completed).length;
    return Math.round((completed / goal.activities.length) * 100);
  };

  const getLastActiveLabel = (goal: Goal): string => {
    const allDates: string[] = [];
    goal.activities.forEach(a => {
      (a.logs || []).forEach(l => allDates.push(l.date || ''));
    });
    if (allDates.length === 0) return 'Not started';

    const sorted = allDates.sort((a, b) => b.localeCompare(a));
    const lastDate = sorted[0];
    const today = new Date().toISOString().split('T')[0];
    if (lastDate === today) return 'Today!';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    const diff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return `${diff}d ago`;
    return `${Math.floor(diff / 7)}w ago`;
  };

  const isRecentlyActive = (goal: Goal): boolean => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threshold = threeDaysAgo.toISOString().split('T')[0];

    return goal.activities.some(a =>
      (a.logs || []).some(l => (l.date || '') >= threshold)
    );
  };

  // Last 3 days activity dots for a goal
  const getMiniStreak = (goal: Goal): boolean[] => {
    const days: boolean[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasLog = goal.activities.some(a =>
        (a.logs || []).some(l => l.date === dateStr)
      );
      days.push(hasLog);
    }
    return days;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Lane Header */}
      <div className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md relative"
              style={{ backgroundColor: `${lane.color}20` }}
            >
              {lane.emoji}
              {/* Pulse ring for active categories */}
              {lane.overallProgress > 0 && lane.overallProgress < 100 && (
                <div
                  className="absolute inset-0 rounded-xl animate-ping opacity-20"
                  style={{ backgroundColor: lane.color }}
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{lane.category}</h3>
              <p className="text-sm text-gray-500">
                {lane.goals.length} goal{lane.goals.length !== 1 ? 's' : ''}
                {lane.overallProgress === 100 && <span className="ml-2 text-green-600 font-bold">✨ Complete!</span>}
              </p>
            </div>
          </div>
          
          {lane.goals.length > 0 && lane.overallProgress < 100 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm font-medium text-gray-600">
              {getEncouragementMessage(calculateLaneDecay(lane.goals).decayLevel).icon}
              {getEncouragementMessage(calculateLaneDecay(lane.goals).decayLevel).text}
            </div>
          )}

          <button
            onClick={onAddGoal}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition"
          >
            + Add Goal
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${lane.overallProgress}%`,
              background: `linear-gradient(90deg, ${lane.color}CC, ${lane.color})`
            }}
          />
          {/* Shimmer effect */}
          <div
            className="absolute inset-y-0 left-0 rounded-full animate-pulse opacity-40"
            style={{
              width: `${lane.overallProgress}%`,
              background: `linear-gradient(90deg, transparent, ${lane.color}50, transparent)`
            }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right font-semibold">
          {lane.overallProgress}%
        </div>
      </div>

      {/* Goal Cards — Journey Layout */}
      <div className="p-5">
        {lane.goals.length > 0 ? (
          <div className="relative">
            {/* Winding path connector */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${lane.color}30` }}>
              {/* Filled progress portion */}
              <div
                className="w-full rounded-full transition-all duration-1000"
                style={{
                  height: `${lane.overallProgress}%`,
                  background: `linear-gradient(180deg, ${lane.color}, ${lane.color}60)`
                }}
              />
            </div>

            <div className="space-y-4 relative">
              {lane.goals.map((goal, index) => {
                const progress = calculateGoalProgress(goal);
                const isComplete = progress === 100;
                const active = isRecentlyActive(goal);
                const miniStreak = getMiniStreak(goal);
                
                const recency = calculateGoalRecency(goal.activities);
                const decayStyles = getDecayStyles(recency.decayLevel);
                const recencyMessage = getRecencyMessage(recency);

                return (
                  <button
                    key={goal.id}
                    onClick={() => onGoalClick(goal)}
                    className={`
                      w-full text-left pl-14 pr-4 py-4 rounded-xl border-2 transition-all duration-300 group relative
                      ${isComplete
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                        : decayStyles.containerClass
                      }
                      ${decayStyles.grayscale && !isComplete ? 'grayscale' : ''}
                    `}
                  >
                    {/* Milestone node on the path */}
                    <div className={`
                      absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all duration-300
                      ${isComplete
                        ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200'
                        : recency.decayLevel === 'active'
                          ? `border-2 shadow-lg`
                          : 'bg-white border-2 border-gray-300'
                      }
                    `}
                      style={recency.decayLevel === 'active' && !isComplete ? {
                        borderColor: lane.color,
                        boxShadow: `0 0 12px ${lane.color}40`,
                        backgroundColor: `${lane.color}15`
                      } : {
                        opacity: decayStyles.milestoneOpacity
                      }}
                    >
                      {isComplete ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold" style={{ color: recency.decayLevel === 'active' ? lane.color : '#9CA3AF' }}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-bold ${isComplete ? 'text-green-800' : 'text-gray-900'} group-hover:text-indigo-700 transition-colors`}>
                            {goal.title}
                          </h4>
                          {goal.type === 'behavior_change' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                              🔄 Habit
                            </span>
                          )}
                        </div>

                        {/* Activity progress */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            {goal.activities.filter(a => a.completed).length}/{goal.activities.length} activities
                          </span>
                          <div className={`font-semibold flex items-center gap-1 ${recencyMessage.colorClass}`}>
                            {recencyMessage.icon}
                            <span>{recencyMessage.text}</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: isComplete ? '#10B981' : lane.color
                            }}
                          />
                        </div>
                      </div>

                      {/* Right side: Mini streak dots + progress */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-gray-700'}`}>
                          {progress}%
                        </span>
                        {/* Mini streak: last 3 days */}
                        <div className="flex gap-1">
                          {miniStreak.map((active, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${
                                active
                                  ? 'scale-110'
                                  : 'bg-gray-200'
                              }`}
                              style={active ? { backgroundColor: lane.color } : {}}
                              title={['2 days ago', 'Yesterday', 'Today'][i]}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Empty Lane State
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-300 transition-colors">
            <div className="text-4xl mb-3">{lane.emoji}</div>
            <p className="text-gray-500 mb-4 font-medium">Start your {lane.category} journey</p>
            <button
              onClick={onAddGoal}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Add Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
