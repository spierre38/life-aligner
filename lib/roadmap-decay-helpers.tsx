import React from 'react';

export interface ActivityRecency {
  daysSinceLastLog: number;
  lastLogDate: string | null;
  decayLevel: 'active' | 'fading' | 'neglected';
  baseOpacity: number;
  needsAttention: boolean;
}

// SVG Icons to replace emojis
const SparklesIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AlertTriangleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FireIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const TargetIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ActivityIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

/**
 * Calculate how many days since last activity log for a goal
 */
export function calculateGoalRecency(activities: any[]): ActivityRecency {
  if (!activities || activities.length === 0) {
    return {
      daysSinceLastLog: 999,
      lastLogDate: null,
      decayLevel: 'neglected',
      baseOpacity: 0.4,
      needsAttention: true
    };
  }

  // Find most recent log across all activities
  let mostRecentDate: any = null;

  activities.forEach(activity => {
    if (activity.logs && activity.logs.length > 0) {
      activity.logs.forEach((log: any) => {
        const logDate = new Date(log.date);
        if (!mostRecentDate || logDate > mostRecentDate) {
          mostRecentDate = logDate;
        }
      });
    }
  });

  if (!mostRecentDate) {
    return {
      daysSinceLastLog: 999,
      lastLogDate: null,
      decayLevel: 'neglected',
      baseOpacity: 0.4,
      needsAttention: true
    };
  }

  // Use midnight today for accurate day counting
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logDay = new Date(mostRecentDate!.getFullYear(), mostRecentDate!.getMonth(), mostRecentDate!.getDate());
  
  const daysSince = Math.floor((today.getTime() - logDay.getTime()) / (1000 * 60 * 60 * 24));

  // Determine decay level
  let decayLevel: 'active' | 'fading' | 'neglected';
  let baseOpacity: number;
  let needsAttention: boolean;

  if (daysSince <= 7) {
    decayLevel = 'active';
    baseOpacity = 1.0;
    needsAttention = false;
  } else if (daysSince <= 14) {
    decayLevel = 'fading';
    baseOpacity = 0.7;
    needsAttention = true;
  } else {
    decayLevel = 'neglected';
    baseOpacity = 0.4;
    needsAttention = true;
  }

  return {
    daysSinceLastLog: daysSince,
    lastLogDate: mostRecentDate!.toISOString().split('T')[0],
    decayLevel,
    baseOpacity,
    needsAttention
  };
}

/**
 * Get a human-readable message about activity recency with SVGs
 */
export function getRecencyMessage(recency: ActivityRecency) {
  const { daysSinceLastLog } = recency;

  if (daysSinceLastLog === 0) {
    return { text: 'Logged today!', icon: <SparklesIcon className="w-4 h-4 text-emerald-500" />, colorClass: 'text-emerald-600' };
  } else if (daysSinceLastLog === 1) {
    return { text: 'Last logged yesterday', icon: <CalendarIcon className="w-4 h-4 text-blue-500" />, colorClass: 'text-blue-600' };
  } else if (daysSinceLastLog <= 7) {
    return { text: `Last logged ${daysSinceLastLog} days ago`, icon: <CalendarIcon className="w-4 h-4 text-gray-500" />, colorClass: 'text-gray-600' };
  } else if (daysSinceLastLog <= 14) {
    return { text: `Last logged ${daysSinceLastLog} days ago`, icon: <AlertTriangleIcon className="w-4 h-4 text-amber-500" />, colorClass: 'text-amber-600' };
  } else if (daysSinceLastLog <= 30) {
    return { text: `${daysSinceLastLog} days since last log`, icon: <ClockIcon className="w-4 h-4 text-red-500" />, colorClass: 'text-red-500' };
  } else {
    return { text: 'Over 30 days inactive', icon: <ClockIcon className="w-4 h-4 text-red-600" />, colorClass: 'text-red-600' };
  }
}

/**
 * Get style classes for decay level
 */
export function getDecayStyles(decayLevel: 'active' | 'fading' | 'neglected') {
  switch (decayLevel) {
    case 'active':
      return {
        containerClass: 'border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md',
        pathOpacity: 1.0,
        milestoneOpacity: 1.0,
        textOpacity: 1.0,
        glowEffect: true,
        grayscale: false
      };
    case 'fading':
      return {
        containerClass: 'border-amber-100 bg-amber-50/20 hover:bg-amber-50/40 opacity-80',
        pathOpacity: 0.7,
        milestoneOpacity: 0.8,
        textOpacity: 0.9,
        glowEffect: false,
        grayscale: true // We can use grayscale classes in tailwind
      };
    case 'neglected':
      return {
        containerClass: 'border-gray-200 bg-gray-50 opacity-50 hover:opacity-75',
        pathOpacity: 0.4,
        milestoneOpacity: 0.5,
        textOpacity: 0.6,
        glowEffect: false,
        grayscale: true
      };
  }
}

/**
 * Calculate decay for entire lane (all goals combined)
 */
export function calculateLaneDecay(goals: any[]): ActivityRecency {
  if (!goals || goals.length === 0) {
    return {
      daysSinceLastLog: 999,
      lastLogDate: null,
      decayLevel: 'neglected',
      baseOpacity: 0.4,
      needsAttention: true
    };
  }

  // Find most recent activity across all goals in the lane
  const recencies = goals.map(goal => calculateGoalRecency(goal.activities));
  const mostRecent = recencies.reduce((min, curr) => 
    curr.daysSinceLastLog < min.daysSinceLastLog ? curr : min
  );

  return mostRecent;
}

/**
 * Get encouragement message based on decay level with SVGs
 */
export function getEncouragementMessage(decayLevel: 'active' | 'fading' | 'neglected') {
  switch (decayLevel) {
    case 'active':
      return { text: 'Keep the momentum going!', icon: <FireIcon className="w-4 h-4 text-orange-500" /> };
    case 'fading':
      return { text: 'Time to log some progress!', icon: <ActivityIcon className="w-4 h-4 text-blue-500" /> };
    case 'neglected':
      return { text: 'Your goals miss you - quick log to revive!', icon: <TargetIcon className="w-4 h-4 text-purple-500" /> };
  }
}
