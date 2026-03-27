// app/components/accountability/WeeklyComparison.tsx
'use client';

import { useState, useEffect } from 'react';
import { getPartnerRoadmap } from '@/lib/accountability';
import { supabase } from '@/lib/supabase';

// SVG Icons
const CheckSvg = () => (
  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TargetSvg = () => (
  <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const ThoughtSvg = () => (
  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const FireSvg = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
  </svg>
);
const PartySvg = () => (
  <svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Extract weekly stats from roadmap data
function extractWeeklyStats(roadmapData: any): { logs: number; categories: number; reflections: number } {
  if (!roadmapData?.responses?.items) {
    return { logs: 0, categories: 0, reflections: 0 };
  }

  const items = roadmapData.responses.items;
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

  let logs = 0;
  const activeCategories = new Set<string>();
  let reflections = 0;

  items.forEach((item: any) => {
    if (item.archived) return;

    let hasRecentLog = false;

    // Count recent activity logs
    (item.activities || []).forEach((activity: any) => {
      (activity.logs || []).forEach((log: any) => {
        const logDate = new Date(log.date);
        if (logDate >= startOfWeek) {
          logs++;
          hasRecentLog = true;
        }
      });
    });

    if (hasRecentLog) {
      activeCategories.add(item.category);
    }

    // Count reflections (we count all since they don't always have dates)
    reflections += (item.reflections || []).length;
  });

  return {
    logs,
    categories: activeCategories.size,
    reflections,
  };
}

interface WeeklyComparisonProps {
  partnerId: string;
  partnerName: string;
}

export function WeeklyComparison({ partnerId, partnerName }: WeeklyComparisonProps) {
  const [userStats, setUserStats] = useState<{ logs: number; categories: number; reflections: number } | null>(null);
  const [partnerStats, setPartnerStats] = useState<{ logs: number; categories: number; reflections: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [partnerId]);

  const loadStats = async () => {
    setLoading(true);

    // Fetch both roadmaps in parallel
    const { data: { user } } = await supabase.auth.getUser();

    const [partnerRes, userRes] = await Promise.all([
      getPartnerRoadmap(partnerId),
      user ? supabase
        .from('workbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'roadmap')
        .single() : Promise.resolve({ data: null, error: null }),
    ]);

    setPartnerStats(extractWeeklyStats(partnerRes.data));
    setUserStats(extractWeeklyStats(userRes.data));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats || !partnerStats) return null;

  const comparisons = [
    {
      label: 'Activities Logged',
      user: userStats.logs,
      partner: partnerStats.logs,
      icon: <CheckSvg />,
      userBarColor: 'bg-purple-500',
      partnerBarColor: 'bg-pink-500',
    },
    {
      label: 'Categories Active',
      user: userStats.categories,
      partner: partnerStats.categories,
      icon: <TargetSvg />,
      userBarColor: 'bg-blue-500',
      partnerBarColor: 'bg-pink-500',
    },
    {
      label: 'Reflections',
      user: userStats.reflections,
      partner: partnerStats.reflections,
      icon: <ThoughtSvg />,
      userBarColor: 'bg-emerald-500',
      partnerBarColor: 'bg-pink-500',
    }
  ];

  const total = { user: 0, partner: 0 };
  comparisons.forEach(c => {
    total.user += c.user;
    total.partner += c.partner;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">This Week&apos;s Progress</h3>
          <p className="text-xs text-gray-500">You vs {partnerName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900">
            {total.user} <span className="text-gray-300 mx-1">:</span> {total.partner}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Total Score</p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-4">
        {comparisons.map((comp, i) => {
          const maxVal = Math.max(comp.user, comp.partner, 1);
          const userPercent = (comp.user / maxVal) * 100;
          const partnerPercent = (comp.partner / maxVal) * 100;
          const userWinning = comp.user >= comp.partner;

          return (
            <div key={i} className="space-y-2">
              {/* Label */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  {comp.icon}
                  {comp.label}
                </span>
                <span className="text-gray-400">
                  {comp.user} vs {comp.partner}
                </span>
              </div>

              {/* Dual bar */}
              <div className="space-y-1">
                {/* Your bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 w-14 text-right">You</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${comp.userBarColor} transition-all duration-700`}
                      style={{ width: `${userPercent}%` }}
                    />
                  </div>
                </div>
                {/* Partner bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 w-14 text-right truncate">{partnerName.split(' ')[0]}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${comp.partnerBarColor} transition-all duration-700`}
                      style={{ width: `${partnerPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Winner badge */}
              {comp.user !== comp.partner && (
                <div className="text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    userWinning 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-pink-100 text-pink-700'
                  }`}>
                    <FireSvg />
                    {userWinning ? 'You lead' : `${partnerName.split(' ')[0]} leads`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mutual milestone */}
      {total.user > 0 && total.partner > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
            <div className="mb-2 flex justify-center"><PartySvg /></div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              Both Active This Week!
            </p>
            <p className="text-xs text-gray-600">
              You both logged activities — keep pushing each other
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
