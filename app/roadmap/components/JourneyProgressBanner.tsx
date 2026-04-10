'use client';

import { useMemo, useState } from 'react';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number; // 0-100
}

interface JourneyProgressBannerProps {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalActivitiesLogged: number;
  streakDays: number;
  goals?: Goal[]; // ✅ NEW: Pass in actual goals for interactivity
  onGoalClick?: (goalId: string) => void; // ✅ NEW: Callback when flag clicked
}

export default function JourneyProgressBannerInteractive({
  totalGoals,
  completedGoals,
  activeGoals,
  totalActivitiesLogged,
  streakDays,
  goals = [],
  onGoalClick,
}: JourneyProgressBannerProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);

  // ✅ OPTIMIZED: Trail waypoints - more spaced out
  const trailWaypoints = useMemo(() => [
    { x: 30, y: 140 },    // Start
    { x: 90, y: 138 },
    { x: 150, y: 110 },
    { x: 210, y: 95 },    // First hill
    { x: 270, y: 105 },
    { x: 330, y: 118 },
    { x: 390, y: 112 },
    { x: 450, y: 85 },
    { x: 510, y: 72 },    // Peak
    { x: 570, y: 80 },
    { x: 630, y: 98 },
    { x: 690, y: 95 },
    { x: 750, y: 78 },
    { x: 810, y: 68 },    // Valley
    { x: 870, y: 75 },
    { x: 930, y: 62 },
    { x: 970, y: 55 },    // Summit
  ], []);

  // Generate smooth SVG path
  const trailPath = useMemo(() => {
    let path = `M ${trailWaypoints[0].x},${trailWaypoints[0].y}`;

    for (let i = 1; i < trailWaypoints.length; i++) {
      const prev = trailWaypoints[i - 1];
      const curr = trailWaypoints[i];
      const next = trailWaypoints[i + 1];

      if (next) {
        const cx = curr.x;
        const cy = curr.y;
        path += ` Q ${cx},${cy} ${(curr.x + next.x) / 2},${(curr.y + next.y) / 2}`;
      } else {
        path += ` L ${curr.x},${curr.y}`;
      }
    }

    return path;
  }, [trailWaypoints]);

  // Progress calculation
  const progress = useMemo(() => {
    if (totalGoals === 0) return 5;
    const goalProgress = totalGoals > 0 ? (completedGoals / Math.max(totalGoals, 1)) * 60 : 0;
    const activityProgress = Math.min(totalActivitiesLogged * 2, 40);
    return Math.min(Math.max(goalProgress + activityProgress, 5), 95);
  }, [totalGoals, completedGoals, totalActivitiesLogged]);

  // Get point on trail
  const getPointOnTrail = (percent: number) => {
    const t = percent / 100;
    const totalPoints = trailWaypoints.length - 1;
    const segment = Math.min(Math.floor(t * totalPoints), totalPoints - 1);
    const localT = (t * totalPoints) % 1;

    const p1 = trailWaypoints[segment];
    const p2 = trailWaypoints[segment + 1];

    return {
      x: p1.x + (p2.x - p1.x) * localT,
      y: p1.y + (p2.y - p1.y) * localT
    };
  };

  // Marker position
  const markerPos = useMemo(() => getPointOnTrail(progress), [progress]);

  // ✅ IMPROVED: Milestones with better spacing (15% to 85% range)
  const milestones = useMemo(() => {
    if (totalGoals === 0) return [];

    return Array.from({ length: Math.min(totalGoals, 10) }, (_, i) => {
      // ✅ Better spacing: 15% start, 85% end, evenly distributed
      const percent = 15 + (i / Math.max(totalGoals - 1, 1)) * 70;
      const pos = getPointOnTrail(percent);
      const isCompleted = i < completedGoals;
      const goal = goals[i];

      return {
        x: pos.x,
        y: pos.y,
        isCompleted,
        index: i,
        percent,
        goal: goal || { id: `goal-${i}`, title: `Goal ${i + 1}`, category: 'Unknown', progress: 0 }
      };
    });
  }, [totalGoals, completedGoals, goals]);

  const journeyMiles = totalActivitiesLogged * 3 + completedGoals * 25;

  const handleMilestoneClick = (milestone: typeof milestones[0]) => {
    if (onGoalClick && milestone.goal) {
      onGoalClick(milestone.goal.id);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 shadow-[0_8px_30px_rgba(120,80,40,0.12)]">
      {/* Sky gradient background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #B8DFF0 30%, #E8D5B7 60%, #C4A97D 80%, #8B7355 100%)'
      }} />

      {/* Clouds */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <g className="animate-float-cloud" style={{ animationDuration: '20s' }}>
          <ellipse cx="150" cy="35" rx="50" ry="18" fill="white" opacity="0.6" />
          <ellipse cx="170" cy="30" rx="35" ry="14" fill="white" opacity="0.5" />
          <ellipse cx="130" cy="32" rx="30" ry="12" fill="white" opacity="0.4" />
        </g>
        <g className="animate-float-cloud" style={{ animationDuration: '25s', animationDelay: '5s' }}>
          <ellipse cx="650" cy="25" rx="45" ry="16" fill="white" opacity="0.5" />
          <ellipse cx="675" cy="20" rx="30" ry="12" fill="white" opacity="0.4" />
        </g>
        <g className="animate-float-cloud" style={{ animationDuration: '30s', animationDelay: '10s' }}>
          <ellipse cx="450" cy="40" rx="40" ry="14" fill="white" opacity="0.35" />
          <ellipse cx="470" cy="36" rx="28" ry="10" fill="white" opacity="0.3" />
        </g>
      </svg>

      <svg viewBox="0 0 1000 200" className="relative z-10 w-full" style={{ minHeight: '180px' }}>
        <defs>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A0845C" />
            <stop offset="100%" stopColor="#7B6544" />
          </linearGradient>
          <linearGradient id="walkedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A85C" />
            <stop offset="100%" stopColor="#C49B52" />
          </linearGradient>
          <linearGradient id="flagCompletedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          {/* ✅ NEW: Hover glow effect */}
          <filter id="hoverGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sun */}
        <circle cx="900" cy="30" r="25" fill="url(#sunGlow)" className="animate-pulse-glow" />
        <circle cx="900" cy="30" r="14" fill="#FCD34D" />

        {/* Mountains */}
        <path d="M0,130 L80,80 L160,120 L240,70 L320,110 L400,60 L480,100 L560,55 L640,95 L720,50 L800,90 L880,45 L960,85 L1000,70 L1000,200 L0,200 Z"
          fill="#9CA3AF" opacity="0.25" />
        <path d="M0,150 L60,110 L120,140 L200,95 L280,130 L360,90 L440,125 L520,85 L600,120 L680,80 L760,115 L840,75 L920,110 L1000,90 L1000,200 L0,200 Z"
          fill="#78716C" opacity="0.2" />

        {/* Trees */}
        {[0.08, 0.18, 0.35, 0.50, 0.63, 0.78, 0.90].map((t, i) => {
          const pos = getPointOnTrail(t * 100);
          const size = 8 + Math.sin(i * 2.5) * 3;
          const offset = i % 2 === 0 ? 20 : -20;
          return (
            <g key={i} transform={`translate(${pos.x + offset}, ${pos.y + 10})`} opacity="0.6">
              <rect x={-1} y={-size * 0.3} width={2} height={size * 0.4} fill="#8B6914" />
              <path d={`M0,${-size * 0.3} L${-size * 0.4},${size * 0.1} L${size * 0.4},${size * 0.1} Z`} fill="#2D5016" />
              <path d={`M0,${-size * 0.6} L${-size * 0.3},${-size * 0.1} L${size * 0.3},${-size * 0.1} Z`} fill="#3A6B20" />
            </g>
          );
        })}

        {/* Ground */}
        <path d="M0,170 C100,165 200,175 300,168 C400,161 500,172 600,166 C700,160 800,170 900,164 L1000,168 L1000,200 L0,200 Z"
          fill="#6B8E23" opacity="0.15" />

        {/* THE TRAIL - unwalked */}
        <path d={trailPath} fill="none" stroke="#A0845C" strokeWidth="6" strokeLinecap="round" opacity="0.4" strokeDasharray="2 8" />
        <path d={trailPath} fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

        {/* THE TRAIL - walked portion */}
        <path d={trailPath} fill="none" stroke="url(#walkedGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${progress * 12} 9999`} className="transition-all duration-1000" />

        {/* Trail center line */}
        <path d={trailPath} fill="none" stroke="#D4A85C" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="4 12" opacity="0.5" />

        {/* ✅ INTERACTIVE MILESTONE FLAGS */}
        {milestones.map((m) => {
          const isHovered = hoveredMilestone === m.index;

          return (
            <g
              key={m.index}
              transform={`translate(${m.x}, ${m.y})`}
              className={`transition-all duration-300 ${onGoalClick ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => setHoveredMilestone(m.index)}
              onMouseLeave={() => setHoveredMilestone(null)}
              onClick={() => handleMilestoneClick(m)}
              filter={isHovered ? 'url(#hoverGlow)' : undefined}
            >
              {/* Flag pole */}
              <line
                x1="0"
                y1="2"
                x2="0"
                y2="-22"
                stroke={isHovered ? '#4B5563' : '#6B5B4F'}
                strokeWidth={isHovered ? 2.5 : 2}
                className="transition-all duration-200"
              />

              {/* Flag */}
              <path
                d="M0,-22 L16,-17 L16,-27 Z"
                fill={m.isCompleted ? 'url(#flagCompletedGrad)' : '#9CA3AF'}
                stroke={m.isCompleted ? '#16A34A' : '#6B7280'}
                strokeWidth="0.5"
                className={`transition-all duration-200 ${m.isCompleted ? 'animate-flag-wave' : 'opacity-60'} ${isHovered ? 'scale-110' : ''}`}
                style={{ transformOrigin: '0 -24px' }}
              />

              {/* Flag number */}
              <text
                x="8"
                y="-20"
                textAnchor="middle"
                fill="white"
                fontSize={isHovered ? "7" : "6"}
                fontWeight="bold"
                className="transition-all duration-200 select-none"
              >
                {m.index + 1}
              </text>

              {/* Base circle on trail */}
              {m.isCompleted && (
                <circle
                  cx="0"
                  cy="2"
                  r={isHovered ? 4 : 3}
                  fill="#22C55E"
                  stroke="white"
                  strokeWidth={isHovered ? 1.5 : 1}
                  className="transition-all duration-200"
                />
              )}

              {/* ✅ Hover ring effect */}
              {isHovered && (
                <circle
                  cx="0"
                  cy="-24"
                  r="12"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* YOU ARE HERE marker */}
        <g transform={`translate(${markerPos.x}, ${markerPos.y})`} filter="url(#markerGlow)">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>

          <circle cx="0" cy="0" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          <circle cx="0" cy="0" r="3" fill="white" />
          <circle cx="0" cy="0" r="1.5" fill="#B45309" />
        </g>

        {/* Start marker */}
        <g transform="translate(30, 145)">
          <rect x="-12" y="-4" width="24" height="14" rx="3" fill="#059669" opacity="0.9" />
          <text x="0" y="6" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">START</text>
        </g>

        {/* Summit marker */}
        <g transform="translate(970, 50)">
          <path d="M0,-12 L-8,0 L8,0 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <text x="0" y="10" textAnchor="middle" fill="#78716C" fontSize="6" fontWeight="bold">SUMMIT</text>
        </g>
      </svg>

      {/* ✅ FLOATING TOOLTIP - Shows on hover */}
      {hoveredMilestone !== null && milestones[hoveredMilestone] && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-200"
          style={{
            left: `${(milestones[hoveredMilestone].x / 1000) * 100}%`,
            top: `${((milestones[hoveredMilestone].y - 50) / 200) * 100}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 min-w-[200px] animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">
                  {milestones[hoveredMilestone].isCompleted ? '✓' : (hoveredMilestone + 1)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                  {milestones[hoveredMilestone].goal.title}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {milestones[hoveredMilestone].goal.category}
                </p>
                {milestones[hoveredMilestone].isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed!
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-bold text-gray-900">{milestones[hoveredMilestone].goal.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${milestones[hoveredMilestone].goal.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {onGoalClick && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                <span className="text-xs text-indigo-600 font-semibold">Click to view details →</span>
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-gray-200 absolute left-1/2 -translate-x-1/2 rotate-45" style={{ bottom: '-6px' }} />
        </div>
      )}

      {/* Stats overlay */}
      <div className="relative z-20 bg-gradient-to-t from-stone-800/90 to-stone-800/60 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-300">{journeyMiles}</div>
              <div className="text-[10px] text-stone-300 uppercase tracking-wider">Miles Traveled</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{totalActivitiesLogged}</div>
              <div className="text-[10px] text-stone-300 uppercase tracking-wider">Steps Taken</div>
            </div>
            {streakDays > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{streakDays}🔥</div>
                <div className="text-[10px] text-stone-300 uppercase tracking-wider">Day Streak</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {Array.from({ length: Math.min(completedGoals, 5) }).map((_, i) => (
                <div key={i} className="w-5 h-5 bg-green-500 rounded-full border-2 border-stone-800 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
              {completedGoals > 5 && (
                <div className="w-5 h-5 bg-stone-600 rounded-full border-2 border-stone-800 flex items-center justify-center text-[8px] text-white font-bold">
                  +{completedGoals - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-stone-300 font-medium">
              {completedGoals} / {totalGoals} milestones
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flag-wave {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.95); }
        }
        .animate-flag-wave {
          animation: flag-wave 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}