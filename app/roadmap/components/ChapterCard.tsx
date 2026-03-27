// app/roadmap/components/ChapterCard.tsx
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

// SVG Icons
const CheckSvg = () => (
  <svg className="w-4 h-4 text-emerald-500 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ThoughtSvg = () => (
  <svg className="w-4 h-4 text-blue-500 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CalendarSvg = () => (
  <svg className="w-4 h-4 text-amber-500 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const BookSvg = () => (
  <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const HabitSvg = () => (
  <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.44l5.36-1.53" />
  </svg>
);
const SmileSvg = () => (
  <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);
const NeutralSvg = () => (
  <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);
const SadSvg = () => (
  <svg className="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

interface ArchivedGoal {
  id: string;
  title: string;
  category: string;
  type: 'goal' | 'behavior_change';
  why?: string;
  activities: Array<{
    id: string;
    text: string;
    completed_dates: string[];
    logs?: Array<{
      date: string;
      feeling: 'great' | 'okay' | 'hard';
      note?: string;
    }>;
  }>;
  reflections: Array<{
    id: string;
    text: string;
    date: string;
  }>;
  archived_date: string;
  created_date?: string;
  connected_values?: string[];
  connected_purpose?: string[];
}

interface ChapterCardProps {
  goal: ArchivedGoal;
  onShare?: () => void;
  onUnarchive?: () => void;
  compact?: boolean;
}

export function ChapterCard({ goal, onShare, onUnarchive, compact = false }: ChapterCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Calculate stats
  const totalLogs = goal.activities?.reduce((sum, activity) => 
    sum + (activity.logs?.length || 0), 0
  ) || 0;
  
  const totalReflections = goal.reflections?.length || 0;
  
  const durationDays = goal.created_date 
    ? Math.floor((new Date(goal.archived_date).getTime() - new Date(goal.created_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Find the most meaningful reflection (longest one)
  const keyLearning = goal.reflections && goal.reflections.length > 0
    ? [...goal.reflections].sort((a, b) => b.text.length - a.text.length)[0]
    : null;

  // Count feelings distribution
  const feelings = { great: 0, okay: 0, hard: 0 };
  if (goal.activities) {
    goal.activities.forEach(activity => {
      activity.logs?.forEach(log => {
        if (feelings[log.feeling] !== undefined) {
          feelings[log.feeling]++;
        }
      });
    });
  }

  const categoryColors: Record<string, string> = {
    Health: 'from-emerald-500 to-teal-600',
    Career: 'from-blue-500 to-indigo-600',
    Relationships: 'from-pink-500 to-rose-600',
    Purpose: 'from-purple-500 to-violet-600',
    Financial: 'from-amber-500 to-orange-600',
    Learning: 'from-cyan-500 to-blue-600',
    Creative: 'from-fuchsia-500 to-pink-600',
    Spiritual: 'from-indigo-500 to-purple-600',
  };

  const gradient = categoryColors[goal.category] || 'from-gray-500 to-gray-600';

  if (compact) {
    return (
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full text-left bg-white rounded-xl border-2 border-gray-200 p-4 hover:shadow-lg hover:border-purple-300 transition-all group"
      >
        <div className="flex items-start gap-3">
          {/* Chapter number badge */}
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md`}>
            Ch
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
              {goal.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center"><CheckSvg /> {totalLogs} logs</span>
              <span className="flex items-center"><ThoughtSvg /> {totalReflections} reflections</span>
              {durationDays !== null && <span className="flex items-center"><CalendarSvg /> {durationDays} days</span>}
            </div>
          </div>

          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <div 
        className={`relative w-full transition-all duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT OF CARD */}
        <div 
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Gradient header */}
          <div className={`relative bg-gradient-to-br ${gradient} p-8 pb-12 text-white overflow-hidden`}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative">
              {/* Chapter badge */}
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-4 border border-white/30">
                <BookSvg />
                <span>Chapter Complete</span>
              </div>

              {/* Goal title */}
              <h2 className="text-3xl font-black mb-3 leading-tight">
                {goal.title}
              </h2>

              {/* Category & type */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/30">
                  {goal.category}
                </span>
                {goal.type === 'behavior_change' && (
                  <span className="flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/30">
                    <HabitSvg /> Habit
                  </span>
                )}
              </div>

              {/* Completion date */}
              <p className="text-white/80 text-sm">
                Completed {formatDistanceToNow(new Date(goal.archived_date), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="p-8 -mt-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Total logs */}
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">
                    {totalLogs}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">
                    Activity Logs
                  </div>
                </div>

                {/* Reflections */}
                <div className="text-center border-x border-gray-200">
                  <div className="text-3xl font-black text-gray-900 mb-1">
                    {totalReflections}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">
                    Reflections
                  </div>
                </div>

                {/* Duration */}
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">
                    {durationDays !== null ? durationDays : '—'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">
                    Days
                  </div>
                </div>
              </div>
            </div>

            {/* Why */}
            {goal.why && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Why This Mattered
                </h3>
                <p className="text-gray-700 leading-relaxed italic">
                  &ldquo;{goal.why}&rdquo;
                </p>
              </div>
            )}

            {/* Feelings distribution */}
            {totalLogs > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Your Journey
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <SmileSvg />
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(feelings.great / totalLogs) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                      {feelings.great}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <NeutralSvg />
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${(feelings.okay / totalLogs) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                      {feelings.okay}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SadSvg />
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${(feelings.hard / totalLogs) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                      {feelings.hard}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Connected values */}
            {goal.connected_values && goal.connected_values.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Values Honored
                </h3>
                <div className="flex flex-wrap gap-2">
                  {goal.connected_values.map((value, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold border border-purple-200"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={() => setIsFlipped(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
              >
                Read Key Learning →
              </button>
              {onShare && (
                <button
                  onClick={onShare}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Share
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 p-8"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFlipped(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shadow-md z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Key learning */}
          <div className="h-full flex flex-col pt-4">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <BookSvg /> Key Learning
              </h3>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {goal.title}
              </h2>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {keyLearning ? (
                <blockquote className="text-2xl font-medium leading-relaxed text-gray-700 italic border-l-4 border-purple-400 pl-6">
                  &ldquo;{keyLearning.text}&rdquo;
                </blockquote>
              ) : (
                <div className="text-center text-gray-400 italic">
                  <ThoughtSvg />
                  <p className="mt-2">No reflections were added to this goal.</p>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-purple-200/50 flex gap-3 mt-auto">
              {onUnarchive && (
                <button
                  onClick={onUnarchive}
                  className="flex-1 px-6 py-3 bg-white text-purple-700 rounded-xl font-bold border-2 border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  Reopen Goal
                </button>
              )}
              <button
                onClick={() => setIsFlipped(false)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
