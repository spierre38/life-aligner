// app/roadmap/components/GoalDetailModal.tsx
'use client';

import { Goal, Activity, LaneData } from './RoadmapCanvas';

interface GoalDetailModalProps {
  lane: LaneData;
  goal: Goal;
  onClose: () => void;
  onUpdateGoal: (updates: Partial<Goal>) => void;
  onToggleActivity: (activityId: string) => void;
}

export function GoalDetailModal({ lane, goal, onClose, onUpdateGoal, onToggleActivity }: GoalDetailModalProps) {
  const calculateProgress = (): number => {
    if (goal.activities.length === 0) return 0;
    const completed = goal.activities.filter(a => a.completed).length;
    return Math.round((completed / goal.activities.length) * 100);
  };

  const progress = calculateProgress();
  const isComplete = progress === 100;

  // Collect all logs for timeline
  const allLogs: { activityText: string; date: string; feeling: string; note: string; logged_at: string }[] = [];
  goal.activities.forEach(a => {
    (a.logs || []).forEach(l => {
      allLogs.push({
        activityText: a.text,
        date: l.date || '',
        feeling: l.feeling || 'okay',
        note: l.note || '',
        logged_at: l.logged_at || l.date || ''
      });
    });
  });
  allLogs.sort((a, b) => b.logged_at.localeCompare(a.logged_at));

  // Feeling summary for this week
  const thisWeekFeelings = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const threshold = weekAgo.toISOString().split('T')[0];
    const recent = allLogs.filter(l => l.date >= threshold);
    const counts = { great: 0, okay: 0, hard: 0 };
    recent.forEach(l => {
      if (l.feeling in counts) counts[l.feeling as keyof typeof counts]++;
    });
    const total = recent.length;
    if (total === 0) return null;
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { dominant: dominant[0], total, counts };
  })();

  // 7-day activity dots
  const sevenDayDots = (() => {
    const dots: { date: string; hasLog: boolean; dayLabel: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasLog = allLogs.some(l => l.date === dateStr);
      dots.push({ date: dateStr, hasLog, dayLabel: dayNames[d.getDay()] });
    }
    return dots;
  })();

  const feelingEmoji: Record<string, string> = {
    great: '😊',
    okay: '😐',
    hard: '😤'
  };

  const formatDate = (dateStr: string): string => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="p-6 rounded-t-3xl"
          style={{
            background: `linear-gradient(135deg, ${lane.color}20 0%, ${lane.color}10 100%)`
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
                style={{ backgroundColor: `${lane.color}40` }}
              >
                {lane.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-500">{lane.category}</span>
                  {goal.type === 'behavior_change' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      🔄 Habit
                    </span>
                  )}
                  {goal.type === 'goal' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      🎯 Goal
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{goal.title}</h2>
                {goal.why && (
                  <p className="text-sm text-gray-600 italic">Why: {goal.why}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress + Completion */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: isComplete ? '#10B981' : lane.color }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900">{progress}%</span>
            {isComplete && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                ✓ Complete!
              </span>
            )}
          </div>

          {/* 7-Day Activity Dots */}
          <div className="mt-4 flex items-center justify-between bg-white/60 rounded-xl p-3">
            <span className="text-xs font-semibold text-gray-500">Last 7 days</span>
            <div className="flex gap-2">
              {sevenDayDots.map(dot => (
                <div key={dot.date} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-4 h-4 rounded-full transition-all ${
                      dot.hasLog
                        ? 'shadow-md scale-110'
                        : 'bg-gray-200'
                    }`}
                    style={dot.hasLog ? { backgroundColor: lane.color } : {}}
                  />
                  <span className="text-[10px] text-gray-400">{dot.dayLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feeling Summary */}
          {thisWeekFeelings && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">This week:</span>
              <span className="font-semibold">
                {thisWeekFeelings.counts.great > 0 && `${feelingEmoji.great} ×${thisWeekFeelings.counts.great} `}
                {thisWeekFeelings.counts.okay > 0 && `${feelingEmoji.okay} ×${thisWeekFeelings.counts.okay} `}
                {thisWeekFeelings.counts.hard > 0 && `${feelingEmoji.hard} ×${thisWeekFeelings.counts.hard}`}
              </span>
              <span className="text-gray-400">({thisWeekFeelings.total} logs)</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Connected LifeFrame */}
          {((goal.connectedValues && goal.connectedValues.length > 0) ||
           (goal.connectedPurpose && goal.connectedPurpose.length > 0)) && (
            <div className="mb-5 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <h3 className="text-xs font-bold text-purple-900 mb-2">🔗 Connected to Your LifeFrame</h3>
              <div className="flex flex-wrap gap-1">
                {(goal.connectedValues || []).map(value => (
                  <span key={value} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    💎 {value}
                  </span>
                ))}
                {(goal.connectedPurpose || []).map(purpose => (
                  <span key={purpose} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    🎯 {purpose}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Activities ({goal.activities.filter(a => a.completed).length}/{goal.activities.length})
            </h3>
            <div className="space-y-2">
              {goal.activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                    ${activity.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                    }
                  `}
                >
                  <button
                    onClick={() => onToggleActivity(activity.id)}
                    className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${activity.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 bg-white hover:border-indigo-400'
                      }
                    `}
                  >
                    {activity.completed && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${activity.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {activity.text}
                    </p>
                    {activity.completedCount && activity.completedCount > 0 && (
                      <p className="text-xs text-gray-500">Logged {activity.completedCount}×</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal Timeline */}
          {allLogs.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">📝 Journal Timeline</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {allLogs.slice(0, 10).map((log, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xl flex-shrink-0">{feelingEmoji[log.feeling] || '😐'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                        <span className="font-semibold">{formatDate(log.date)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="truncate">{log.activityText}</span>
                      </div>
                      {log.note && (
                        <p className="text-sm text-gray-700">{log.note}</p>
                      )}
                    </div>
                  </div>
                ))}
                {allLogs.length > 10 && (
                  <p className="text-xs text-gray-400 text-center">
                    + {allLogs.length - 10} older entries
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              Close
            </button>
            <button
              onClick={() => onClose()}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition text-sm"
            >
              Edit Goal Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
