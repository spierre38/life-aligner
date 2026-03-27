// app/roadmap/components/DailyInsightCard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { generateDailyInsight, DailyInsight, getInsightPreview } from '@/lib/daily-insight-generator';
import { calculateContentmentScore, ContentmentScoreResult } from '@/lib/contentment-score';

export default function DailyInsightCard({ roadmapItems }: { roadmapItems: any[] }) {
  const [revealed, setRevealed] = useState(false);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [scoreResult, setScoreResult] = useState<ContentmentScoreResult | null>(null);
  const [preview, setPreview] = useState('');
  const [animatingScore, setAnimatingScore] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    setInsight(generateDailyInsight(roadmapItems));
    setScoreResult(calculateContentmentScore(roadmapItems));
    setPreview(getInsightPreview());

    // Check if already revealed today
    const today = new Date().toISOString().split('T')[0];
    const lastReveal = localStorage.getItem('contentment-last-reveal');
    if (lastReveal === today) {
      setRevealed(true);
    }
  }, [roadmapItems]);

  // Animate the score count-up when revealed
  useEffect(() => {
    if (!revealed || !scoreResult) return;
    const target = scoreResult.score;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatingScore(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [revealed, scoreResult]);

  const handleReveal = () => {
    setRevealed(true);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('contentment-last-reveal', today);

    // Track reveal streak
    const streakRaw = localStorage.getItem('contentment-reveal-streak');
    const lastDate = localStorage.getItem('contentment-last-reveal-date');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let streak = 1;
    if (lastDate === yesterdayStr && streakRaw) {
      streak = parseInt(streakRaw) + 1;
    } else if (lastDate === today && streakRaw) {
      streak = parseInt(streakRaw);
    }
    localStorage.setItem('contentment-reveal-streak', String(streak));
    localStorage.setItem('contentment-last-reveal-date', today);
  };

  if (!insight || !scoreResult) return null;

  const circumference = 2 * Math.PI * 54;
  const scorePercent = animatingScore / 100;
  const strokeDash = scorePercent * circumference;

  const revealStreak = parseInt(localStorage.getItem('contentment-reveal-streak') || '0');

  // ==========================================
  // UNREVEALED STATE — Mystery Card
  // ==========================================
  if (!revealed) {
    return (
      <button
        onClick={handleReveal}
        className="w-full mb-8 group cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 transition-all duration-300 group-hover:border-indigo-400 group-hover:shadow-lg group-hover:scale-[1.005]">
          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
          </div>

          <div className="relative flex items-center justify-center gap-4">
            {/* Pulsing mystery icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <svg className="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                Your Contentment Score is ready
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tap to reveal today&apos;s score and insight
              </p>
              {revealStreak >= 2 && (
                <p className="text-xs text-indigo-500 font-semibold mt-1">
                  🔥 {revealStreak}-day reveal streak
                </p>
              )}
            </div>

            {/* Arrow */}
            <svg className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 transition-transform ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // ==========================================
  // REVEALED STATE — Score + Insight
  // ==========================================
  const breakdownItems = [
    { label: 'Consistency', value: scoreResult.breakdown.consistency, max: 30, color: '#6366F1' },
    { label: 'Balance', value: scoreResult.breakdown.balance, max: 20, color: '#10B981' },
    { label: 'Feeling', value: scoreResult.breakdown.feeling, max: 20, color: '#F59E0B' },
    { label: 'Streak', value: scoreResult.breakdown.streak, max: 15, color: '#EF4444' },
    { label: 'Depth', value: scoreResult.breakdown.depth, max: 15, color: '#8B5CF6' },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-scale-in">
      {/* Score Header */}
      <div className={`p-6 pb-4 bg-gradient-to-br ${
        scoreResult.tier === 'legendary' ? 'from-amber-50 to-yellow-50' :
        scoreResult.tier === 'thriving' ? 'from-emerald-50 to-green-50' :
        scoreResult.tier === 'growing' ? 'from-indigo-50 to-blue-50' :
        scoreResult.tier === 'warming_up' ? 'from-orange-50 to-amber-50' :
        'from-gray-50 to-slate-50'
      }`}>
        <div className="flex items-center gap-6">
          {/* Score Ring */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              {/* Score ring */}
              <circle
                ref={ringRef}
                cx="60" cy="60" r="54"
                fill="none"
                stroke={scoreResult.tierColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                className="transition-all duration-1000"
                style={{ filter: scoreResult.tier === 'legendary' ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' : undefined }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{ color: scoreResult.tierColor }}>
                {animatingScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Score
              </span>
            </div>
          </div>

          {/* Headline + tier */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: scoreResult.tierColor }}
              >
                {scoreResult.tierLabel}
              </span>
              {revealStreak >= 7 && (
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-[10px] font-bold text-amber-700">
                  ⭐ LEGENDARY STREAK
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 leading-snug">
              {scoreResult.headline}
            </p>
            <p className="text-sm text-gray-600 mt-1.5">
              {scoreResult.advice}
            </p>
          </div>
        </div>

        {/* Breakdown toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          {showBreakdown ? 'Hide' : 'Show'} score breakdown
        </button>

        {/* Score breakdown bars */}
        {showBreakdown && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {breakdownItems.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 w-20">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.value / item.max) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 w-10 text-right">
                  {item.value}/{item.max}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Insight section */}
      {insight && (
        <div className="p-5 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{insight.message}</p>
              {insight.actionable && (
                <p className="text-xs text-indigo-600 font-semibold mt-1.5">{insight.actionable}</p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-50 text-right">
            <span className="text-[11px] text-gray-400 italic">Tomorrow: {preview}</span>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%) skewX(-12deg); }
          to { transform: translateX(200%) skewX(-12deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
