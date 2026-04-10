'use client';

import { useMemo } from 'react';

interface JourneyProgressBannerProps {
  totalGoals: number;
  completedGoals: number; // archived
  activeGoals: number;
  totalActivitiesLogged: number;
  streakDays: number;
}

export default function JourneyProgressBanner({
  totalGoals,
  completedGoals,
  activeGoals,
  totalActivitiesLogged,
  streakDays,
}: JourneyProgressBannerProps) {
  // Progress 0-100 based on activities logged (more logs = further along the trail)
  const progress = useMemo(() => {
    if (totalGoals === 0) return 5; // Start of trail
    // Base progress on a blend of goals completed + activities logged
    const goalProgress = totalGoals > 0 ? (completedGoals / Math.max(totalGoals, 1)) * 60 : 0;
    const activityProgress = Math.min(totalActivitiesLogged * 2, 40); // Cap at 40%
    return Math.min(Math.max(goalProgress + activityProgress, 5), 95);
  }, [totalGoals, completedGoals, totalActivitiesLogged]);

  // Path coordinates for the winding trail (SVG path)
  // This creates a path from left to right with gentle curves
  const trailPath = "M 30,140 C 80,140 100,90 160,95 C 220,100 240,130 300,120 C 360,110 380,70 440,75 C 500,80 520,110 580,100 C 640,90 660,60 720,65 C 780,70 800,95 860,85 C 920,75 940,50 970,55";

  // Calculate position on the path based on progress
  const markerX = 30 + (progress / 100) * 940;
  const markerY = useMemo(() => {
    // Approximate Y from the path curves
    const t = progress / 100;
    const baseY = 140;
    const wave1 = Math.sin(t * Math.PI * 4) * 30;
    const wave2 = Math.sin(t * Math.PI * 2) * 15;
    const trend = -t * 60; // Generally goes upward
    return baseY + wave1 + wave2 + trend;
  }, [progress]);

  // Milestone positions (evenly spaced along the trail)
  const milestones = useMemo(() => {
    if (totalGoals === 0) return [];
    const allGoals = totalGoals;
    return Array.from({ length: Math.min(allGoals, 8) }, (_, i) => {
      const t = ((i + 1) / (allGoals + 1));
      const x = 30 + t * 940;
      const baseY = 140;
      const wave1 = Math.sin(t * Math.PI * 4) * 30;
      const wave2 = Math.sin(t * Math.PI * 2) * 15;
      const trend = -t * 60;
      const y = baseY + wave1 + wave2 + trend;
      const isCompleted = i < completedGoals;
      return { x, y, isCompleted, index: i };
    });
  }, [totalGoals, completedGoals]);

  const journeyMiles = totalActivitiesLogged * 3 + completedGoals * 25;

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
          {/* Trail gradient */}
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A0845C" />
            <stop offset="100%" stopColor="#7B6544" />
          </linearGradient>
          {/* Walked trail gradient */}
          <linearGradient id="walkedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A85C" />
            <stop offset="100%" stopColor="#C49B52" />
          </linearGradient>
          {/* Flag gradient */}
          <linearGradient id="flagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          {/* Completed flag gradient */}
          <linearGradient id="flagCompletedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          {/* Glow filter for marker */}
          <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Sun glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sun */}
        <circle cx="900" cy="30" r="25" fill="url(#sunGlow)" className="animate-pulse-glow" />
        <circle cx="900" cy="30" r="14" fill="#FCD34D" />

        {/* Far mountains */}
        <path d="M0,130 L80,80 L160,120 L240,70 L320,110 L400,60 L480,100 L560,55 L640,95 L720,50 L800,90 L880,45 L960,85 L1000,70 L1000,200 L0,200 Z"
          fill="#9CA3AF" opacity="0.25" />
        {/* Near mountains */}
        <path d="M0,150 L60,110 L120,140 L200,95 L280,130 L360,90 L440,125 L520,85 L600,120 L680,80 L760,115 L840,75 L920,110 L1000,90 L1000,200 L0,200 Z"
          fill="#78716C" opacity="0.2" />

        {/* Trees scattered along the trail */}
        {[80, 180, 350, 500, 630, 780, 900].map((tx, i) => {
          const t = tx / 1000;
          const baseY = 140;
          const wave1 = Math.sin(t * Math.PI * 4) * 30;
          const wave2 = Math.sin(t * Math.PI * 2) * 15;
          const trend = -t * 60;
          const ty = baseY + wave1 + wave2 + trend + 10;
          const size = 8 + Math.sin(i * 2.5) * 3;
          return (
            <g key={i} transform={`translate(${tx + (i % 2 === 0 ? 20 : -20)}, ${ty})`} opacity="0.6">
              <rect x={-1} y={-size * 0.3} width={2} height={size * 0.4} fill="#8B6914" />
              <path d={`M0,${-size * 0.3} L${-size * 0.4},${size * 0.1} L${size * 0.4},${size * 0.1} Z`} fill="#2D5016" />
              <path d={`M0,${-size * 0.6} L${-size * 0.3},${-size * 0.1} L${size * 0.3},${-size * 0.1} Z`} fill="#3A6B20" />
            </g>
          );
        })}

        {/* Ground / grass areas */}
        <path d="M0,170 C100,165 200,175 300,168 C400,161 500,172 600,166 C700,160 800,170 900,164 L1000,168 L1000,200 L0,200 Z"
          fill="#6B8E23" opacity="0.15" />

        {/* THE TRAIL - unwalked portion (darker, dusty) */}
        <path d={trailPath} fill="none" stroke="#A0845C" strokeWidth="6" strokeLinecap="round" opacity="0.4"
          strokeDasharray="2 8" />
        <path d={trailPath} fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

        {/* THE TRAIL - walked portion (golden, solid) */}
        <path d={trailPath} fill="none" stroke="url(#walkedGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${progress * 12} 9999`} className="transition-all duration-1000" />

        {/* Trail markers / dotted line */}
        <path d={trailPath} fill="none" stroke="#D4A85C" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="4 12" opacity="0.5" />

        {/* Milestone flags */}
        {milestones.map((m) => (
          <g key={m.index} transform={`translate(${m.x}, ${m.y})`}
            className="transition-all duration-500"
            style={{ animationDelay: `${m.index * 0.15}s` }}
          >
            {/* Flag pole */}
            <line x1="0" y1="0" x2="0" y2="-20" stroke="#6B5B4F" strokeWidth="1.5" />
            {/* Flag */}
            <path d={`M0,-20 L12,-16 L0,-12 Z`}
              fill={m.isCompleted ? 'url(#flagCompletedGrad)' : '#D1D5DB'}
              className={m.isCompleted ? '' : 'opacity-50'}
            />
            {/* Completed checkmark */}
            {m.isCompleted && (
              <circle cx="0" cy="3" r="4" fill="#22C55E" stroke="white" strokeWidth="1">
                <animate attributeName="r" values="3;5;4" dur="0.5s" begin={`${m.index * 0.2}s`} fill="freeze" />
              </circle>
            )}
          </g>
        ))}

        {/* YOU ARE HERE marker */}
        <g transform={`translate(${markerX}, ${markerY})`}
          filter="url(#markerGlow)"
          className="transition-all duration-1000"
        >
          {/* Pulsing ring */}
          <circle cx="0" cy="-2" r="10" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Pin body */}
          <path d="M0,5 L-6,-5 C-6,-10 -4,-14 0,-14 C4,-14 6,-10 6,-5 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          {/* Pin center dot */}
          <circle cx="0" cy="-7" r="3" fill="white" />
          {/* Little walker icon */}
          <circle cx="0" cy="-7" r="1.5" fill="#B45309" />
        </g>

        {/* Start marker */}
        <g transform="translate(30, 145)">
          <rect x="-12" y="-4" width="24" height="14" rx="3" fill="#059669" opacity="0.9" />
          <text x="0" y="6" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">START</text>
        </g>

        {/* End marker (destination) */}
        <g transform="translate(970, 55)">
          <path d="M0,-12 L-8,0 L8,0 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <text x="0" y="10" textAnchor="middle" fill="#78716C" fontSize="6" fontWeight="bold">SUMMIT</text>
        </g>
      </svg>

      {/* Stats overlay at bottom */}
      <div className="relative z-20 bg-gradient-to-t from-stone-800/90 to-stone-800/60 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Distance */}
            <div className="text-center">
              <div className="text-lg font-bold text-amber-300">{journeyMiles}</div>
              <div className="text-[10px] text-stone-300 uppercase tracking-wider">Miles Traveled</div>
            </div>
            {/* Activities */}
            <div className="text-center">
              <div className="text-lg font-bold text-white">{totalActivitiesLogged}</div>
              <div className="text-[10px] text-stone-300 uppercase tracking-wider">Steps Taken</div>
            </div>
            {/* Streak */}
            {streakDays > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{streakDays}🔥</div>
                <div className="text-[10px] text-stone-300 uppercase tracking-wider">Day Streak</div>
              </div>
            )}
          </div>
          {/* Milestones */}
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
    </div>
  );
}
