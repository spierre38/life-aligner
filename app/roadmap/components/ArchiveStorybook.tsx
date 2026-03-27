// app/roadmap/components/ArchiveStorybook.tsx
'use client';

import { useState, useMemo } from 'react';
import { ChapterCard } from './ChapterCard';

// SVG Icons
const BookSvg = () => (
  <svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const LightbulbSvg = () => (
  <svg className="w-4 h-4 text-purple-600 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
);
const CheckSvg = () => (
  <svg className="w-5 h-5 text-emerald-500 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PartySvg = () => (
  <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" /><path d="M15 2h.01" /><path d="M22 20h.01" /><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
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

interface ArchiveStorybookProps {
  archivedGoals: ArchivedGoal[];
  onShare: (goal: ArchivedGoal) => void;
  onUnarchive: (goalId: string) => void;
}

type ViewMode = 'timeline' | 'grid' | 'summary';
type FilterCategory = 'all' | string;

export function ArchiveStorybook({ archivedGoals, onShare, onUnarchive }: ArchiveStorybookProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

  // Sort by archived date (most recent first)
  const sortedGoals = useMemo(() => {
    return [...archivedGoals].sort((a, b) => 
      new Date(b.archived_date).getTime() - new Date(a.archived_date).getTime()
    );
  }, [archivedGoals]);

  // Filter by category
  const filteredGoals = useMemo(() => {
    if (filterCategory === 'all') return sortedGoals;
    return sortedGoals.filter(g => g.category === filterCategory);
  }, [sortedGoals, filterCategory]);

  // Group by quarter
  const goalsByQuarter = useMemo(() => {
    const quarters: Record<string, ArchivedGoal[]> = {};
    
    filteredGoals.forEach(goal => {
      const date = new Date(goal.archived_date);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `Q${quarter} ${year}`;
      
      if (!quarters[key]) quarters[key] = [];
      quarters[key].push(goal);
    });

    return quarters;
  }, [filteredGoals]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalLogs = filteredGoals.reduce((sum, goal) => 
      sum + (goal.activities?.reduce((actSum, act) => 
        actSum + (act.logs?.length || 0), 0
      ) || 0), 0
    );

    const totalReflections = filteredGoals.reduce((sum, goal) => 
      sum + (goal.reflections?.length || 0), 0
    );

    const categories = new Set(filteredGoals.map(g => g.category));

    return {
      totalGoals: filteredGoals.length,
      totalLogs,
      totalReflections,
      categoriesCompleted: categories.size
    };
  }, [filteredGoals]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(archivedGoals.map(g => g.category));
    return Array.from(cats).sort();
  }, [archivedGoals]);

  if (archivedGoals.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
            <BookSvg />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Your Story Awaits
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            As you complete goals, they'll appear here as beautiful chapter cards. 
            Each completed goal becomes part of your journey story.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold">
            <LightbulbSvg />
            Archive a goal from your roadmap to start
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-50 rounded-xl">
              <BookSvg />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Your Story
              </h1>
              <p className="text-gray-600 text-sm">
                {stats.totalGoals} chapters written across {stats.categoriesCompleted} life categories
              </p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Summary
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="text-3xl font-black text-purple-700 mb-1">
              {stats.totalGoals}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              Goals Completed
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="text-3xl font-black text-blue-700 mb-1">
              {stats.totalLogs}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              Total Logs
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-3xl font-black text-emerald-700 mb-1">
              {stats.totalReflections}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              Reflections
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="text-3xl font-black text-amber-700 mb-1">
              {stats.categoriesCompleted}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              Categories
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({archivedGoals.length})
          </button>
          {categories.map(cat => {
            const count = archivedGoals.filter(g => g.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {Object.entries(goalsByQuarter).map(([quarter, goals]) => (
            <div key={quarter}>
              {/* Quarter header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <button
                  onClick={() => setSelectedQuarter(selectedQuarter === quarter ? null : quarter)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {quarter}
                  <span className="ml-2 px-2.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {goals.length}
                  </span>
                </button>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Goals in this quarter */}
              {(selectedQuarter === null || selectedQuarter === quarter) && (
                <div className="space-y-8">
                  {goals.map((goal, i) => (
                    <div key={goal.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <ChapterCard
                        goal={goal}
                        onShare={() => onShare(goal)}
                        onUnarchive={() => onUnarchive(goal.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredGoals.map((goal, i) => (
            <div key={goal.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <ChapterCard
                goal={goal}
                onShare={() => onShare(goal)}
                onUnarchive={() => onUnarchive(goal.id)}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {/* SUMMARY VIEW */}
      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* Quarterly summaries */}
          {Object.entries(goalsByQuarter).map(([quarter, goals]) => {
            const quarterStats = {
              totalLogs: goals.reduce((sum, g) => 
                sum + (g.activities?.reduce((actSum, act) => 
                  actSum + (act.logs?.length || 0), 0
                ) || 0), 0
              ),
              totalReflections: goals.reduce((sum, g) => sum + (g.reflections?.length || 0), 0),
              categories: new Set(goals.map(g => g.category))
            };

            return (
              <div key={quarter} className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{quarter}</h3>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {goals.length} goals completed
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <PartySvg />
                  </div>
                </div>

                {/* Quarter stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="text-3xl font-black text-purple-700">{quarterStats.totalLogs}</div>
                    <div className="text-xs font-bold text-purple-900/60 uppercase tracking-wider mt-1">Logs</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="text-3xl font-black text-blue-700">{quarterStats.totalReflections}</div>
                    <div className="text-xs font-bold text-blue-900/60 uppercase tracking-wider mt-1">Reflections</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-3xl font-black text-emerald-700">{quarterStats.categories.size}</div>
                    <div className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider mt-1">Categories</div>
                  </div>
                </div>

                {/* Goals list */}
                <div className="space-y-3">
                  {goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-purple-200 hover:shadow-sm transition-all group">
                      <CheckSvg />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-purple-700 transition-colors">{goal.title}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{goal.category}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(goal.archived_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
