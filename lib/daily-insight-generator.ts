// lib/daily-insight-generator.ts
// Generates personalized daily insights from user's roadmap data

export interface DailyInsight {
  id: string;
  type: 'progress' | 'pattern' | 'milestone' | 'focus' | 'encouragement' | 'trend';
  message: string;
  emoji: string;
  actionable?: string; // Optional call-to-action
  highlightCategory?: string; // Which category this insight is about
}

interface RoadmapItem {
  id: string;
  title?: string;
  category: string;
  activities: Array<{
    id: string;
    text?: string;
    logs?: Array<{ date: string; feeling: 'great' | 'okay' | 'hard' }>;
  }>;
  reflections: any[];
  archived: boolean;
}

/**
 * Generate a daily insight based on user's roadmap data
 * Uses date as seed to ensure same insight all day, different tomorrow
 */
export function generateDailyInsight(
  roadmapItems: RoadmapItem[],
  date: Date = new Date()
): DailyInsight | null {
  
  if (roadmapItems.length === 0) {
    return {
      id: 'welcome',
      type: 'encouragement',
      message: 'Start logging your first activities to unlock personalized insights!',
      emoji: '🌟',
      actionable: 'Log an activity today'
    };
  }

  // Use date as seed to pick insight type consistently for the day
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const insightTypes = ['progress', 'pattern', 'milestone', 'focus', 'encouragement', 'trend'];
  const todaysType = insightTypes[dayOfYear % insightTypes.length];

  // Generate insight based on type
  switch (todaysType) {
    case 'progress':
      return generateProgressInsight(roadmapItems, date);
    case 'pattern':
      return generatePatternInsight(roadmapItems);
    case 'milestone':
      return generateMilestoneInsight(roadmapItems);
    case 'focus':
      return generateFocusInsight(roadmapItems);
    case 'encouragement':
      return generateEncouragementInsight(roadmapItems, dayOfYear);
    case 'trend':
      return generateTrendInsight(roadmapItems, date);
    default:
      return generateEncouragementInsight(roadmapItems, dayOfYear);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getTopItem(items: RoadmapItem[], since: Date = new Date(0)): { item: RoadmapItem, logs: number } | null {
  let topItem: RoadmapItem | null = null;
  let maxLogs = 0;
  
  items.forEach(item => {
    if (item.archived) return;
    let logCount = 0;
    item.activities.forEach(activity => {
      (activity.logs || []).forEach(log => {
        if (new Date(log.date) >= since) logCount++;
      });
    });
    if (logCount >= maxLogs) {
      maxLogs = logCount;
      topItem = item;
    }
  });

  return topItem && maxLogs > 0 ? { item: topItem, logs: maxLogs } : null;
}

function getRandomActiveItem(items: RoadmapItem[], seed: number): { item: RoadmapItem, activity: any } | null {
  const activeItems = items.filter(i => !i.archived && i.activities && i.activities.length > 0);
  if (activeItems.length === 0) return null;
  
  const item = activeItems[seed % activeItems.length];
  const activity = item.activities[seed % item.activities.length];
  return { item, activity };
}

// ============================================================================
// INSIGHT TYPE GENERATORS
// ============================================================================

function generateProgressInsight(items: RoadmapItem[], date: Date): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  // Calculate this week vs last week
  const now = date;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 7);

  let thisWeekLogs = 0;
  let lastWeekLogs = 0;

  activeItems.forEach(item => {
    item.activities.forEach(activity => {
      (activity.logs || []).forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= startOfThisWeek) {
          thisWeekLogs++;
        } else if (logDate >= startOfLastWeek && logDate < startOfThisWeek) {
          lastWeekLogs++;
        }
      });
    });
  });

  const diff = thisWeekLogs - lastWeekLogs;
  const topThisWeek = getTopItem(activeItems, startOfThisWeek);
  const driverText = topThisWeek && topThisWeek.item.title ? ` Driven mostly by your dedication to "${topThisWeek.item.title}".` : '';
  const topLastWeek = getTopItem(activeItems, startOfLastWeek); 
  const targetText = topThisWeek && topThisWeek.item.title ? ` A single log for "${topThisWeek.item.title}" today flips the momentum.` : 'A single log today flips the momentum.';

  if (diff > 0) {
    return {
      id: 'progress-up',
      type: 'progress',
      message: `You're accelerating! ${thisWeekLogs} activities this week—that's ${diff} more than last week.${driverText}`,
      emoji: '📈',
      actionable: 'Feed the momentum. Do one more today.'
    };
  } else if (diff < 0) {
    return {
      id: 'progress-down',
      type: 'progress',
      message: `You've got ${thisWeekLogs} logs this week, trailing last week's ${lastWeekLogs} logs.${driverText}`,
      emoji: '💪',
      actionable: targetText
    };
  } else {
    return {
      id: 'progress-same',
      type: 'progress',
      message: `Dead heat: ${thisWeekLogs} logs this week, exactly matching last week's pace.`,
      emoji: '⚖️',
      actionable: topThisWeek && topThisWeek.item.title ? `Log "${topThisWeek.item.title}" today to take the lead.` : 'Who wins tomorrow? You decide by logging today.'
    };
  }
}

function generatePatternInsight(items: RoadmapItem[]): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  // Analyze day-of-week patterns
  const dayLogCounts: Record<number, number> = {};
  
  activeItems.forEach(item => {
    item.activities.forEach(activity => {
      (activity.logs || []).forEach(log => {
        const day = new Date(log.date).getDay();
        dayLogCounts[day] = (dayLogCounts[day] || 0) + 1;
      });
    });
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const entries = Object.entries(dayLogCounts);
  
  if (entries.length === 0) {
    return {
      id: 'pattern-none',
      type: 'pattern',
      message: 'Start logging to discover your productivity patterns!',
      emoji: '🔍',
      actionable: 'Log activities throughout the week'
    };
  }

  const mostActive = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
  const leastActive = entries.reduce((min, curr) => curr[1] < min[1] ? curr : min);

  const mostDay = days[parseInt(mostActive[0])];
  const leastDay = days[parseInt(leastActive[0])];
  
  const topAllTime = getTopItem(activeItems);

  if (mostActive[1] > leastActive[1] * 1.5) {
    return {
      id: 'pattern-peak',
      type: 'pattern',
      message: `It's official: ${mostDay}s are your absolute power days. You're ${Math.round((mostActive[1] / leastActive[1]) * 100 - 100)}% more productive than on ${leastDay}s!`,
      emoji: '⚡',
      actionable: topAllTime && topAllTime.item.title ? `Schedule hard tasks like "${topAllTime.item.title}" for peak days.` : 'Schedule your hardest goals for your peak days.'
    };
  }

  return {
    id: 'pattern-balanced',
    type: 'pattern',
    message: `You're an absolute machine—consistent effort across the board. No single day dominates your week.`,
    emoji: '🌟',
    actionable: topAllTime && topAllTime.item.title ? `Your steady progress on "${topAllTime.item.title}" proves it.` : 'Sustained balance creates unstoppable progress.'
  };
}

function generateMilestoneInsight(items: RoadmapItem[]): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  // Check for streaks
  const allDates = new Set<string>();
  activeItems.forEach(item => {
    item.activities.forEach(activity => {
      (activity.logs || []).forEach(log => {
        allDates.add(log.date);
      });
    });
  });

  const topAllTime = getTopItem(activeItems);

  // Calculate current streak
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  const checkDate = new Date();
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (allDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (streak >= 7) {
    return {
      id: 'milestone-streak',
      type: 'milestone',
      message: `${streak} days in a row! You're officially on fire. Every time you log ${topAllTime && topAllTime.item.title ? `"${topAllTime.item.title}"` : 'an activity'}, the habit gets stronger.`,
      emoji: '🔥',
      actionable: "Protect the streak at all costs."
    };
  }

  // Check total logs milestone
  const totalLogs = Array.from(allDates).length;
  const milestones = [100, 75, 50, 30, 21, 14, 7];
  const nextMilestone = milestones.find(m => totalLogs >= m);

  if (nextMilestone) {
    return {
      id: 'milestone-total',
      type: 'milestone',
      message: `Achievement unlocked: ${totalLogs} days of showing up. You're building a fortress of discipline, especially with ${topAllTime && topAllTime.item.title ? `"${topAllTime.item.title}"` : 'your top goals'}.`,
      emoji: '🏆',
      actionable: `Next target: ${milestones[milestones.indexOf(nextMilestone) - 1] || 150} days. You've got this.`
    };
  }

  return {
    id: 'milestone-start',
    type: 'milestone',
    message: `Every epic saga starts with a single step. You are ${totalLogs} days into your journey.`,
    emoji: '🌱',
    actionable: topAllTime && topAllTime.item.title ? `Keep pushing forward on "${topAllTime.item.title}".` : 'The hardest part is starting. Keep going.'
  };
}

function generateFocusInsight(items: RoadmapItem[]): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  // Count reflections per category
  const categoryReflections: Record<string, number> = {};
  const categoryLogs: Record<string, number> = {};

  activeItems.forEach(item => {
    categoryReflections[item.category] = (categoryReflections[item.category] || 0) + item.reflections.length;
    let totalLogs = 0;
    item.activities.forEach(activity => {
      totalLogs += (activity.logs?.length || 0);
    });
    categoryLogs[item.category] = (categoryLogs[item.category] || 0) + totalLogs;
  });

  // Find category with most reflections
  const topReflectionCategory = Object.entries(categoryReflections)
    .sort((a, b) => b[1] - a[1])[0];

  if (topReflectionCategory && topReflectionCategory[1] > 0) {
    const topItemInCategory = activeItems.filter(i => i.category === topReflectionCategory[0]).sort((a, b) => {
      return b.reflections.length - a.reflections.length;
    })[0];
    
    return {
      id: 'focus-reflection',
      type: 'focus',
      message: `${topReflectionCategory[0]} is dominating your thoughts with ${topReflectionCategory[1]} reflections. That's some deep soul-searching ${topItemInCategory && topItemInCategory.title ? `on "${topItemInCategory.title}"` : ''}!`,
      emoji: '📖',
      highlightCategory: topReflectionCategory[0],
      actionable: 'Self-awareness is a superpower. Keep reflecting.'
    };
  }

  // Find most active category
  const topLogCategory = Object.entries(categoryLogs)
    .sort((a, b) => b[1] - a[1])[0];

  if (topLogCategory && topLogCategory[1] > 0) {
    const topItemInCategory = activeItems.filter(i => i.category === topLogCategory[0]).sort((a, b) => {
      const aLogs = a.activities.reduce((sum, act) => sum + (act.logs?.length || 0), 0);
      const bLogs = b.activities.reduce((sum, act) => sum + (act.logs?.length || 0), 0);
      return bLogs - aLogs;
    })[0];
    
    return {
      id: 'focus-activity',
      type: 'focus',
      message: `Laser focus active: ${topLogCategory[0]} is your most active category (${topLogCategory[1]} logs) thanks to your work on "${topItemInCategory.title}".`,
      emoji: '🎯',
      highlightCategory: topLogCategory[0],
      actionable: 'Where focus goes, energy flows.'
    };
  }

  return {
    id: 'focus-balance',
    type: 'focus',
    message: `Jack of all trades: You're currently balancing your energy across ${Object.keys(categoryLogs).length} different categories!`,
    emoji: '⚖️',
    actionable: 'Keep spinning those plates.'
  };
}

function generateEncouragementInsight(items: RoadmapItem[], seed: number): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  // Find a specific random active item
  const randomAct = getRandomActiveItem(activeItems, seed);
  const targetText = randomAct && randomAct.item.title ? `"${randomAct.item.title}"` : 'your goals';
  const targetActivity = randomAct && randomAct.activity.text ? `"${randomAct.activity.text}"` : 'your habits';
  
  const totalLogs = activeItems.reduce((sum, item) => sum + item.activities.reduce((actSum, act) => actSum + (act.logs?.length || 0), 0), 0);

  const encouragements = [
    {
      id: 'enc-consistency',
      message: `${totalLogs} total logs and counting. You aren't just trying to conquer ${targetText} anymore, you're actually doing it.`,
      emoji: '💪',
      actionable: `Consistency on ${targetActivity} beats raw intensity.`
    },
    {
      id: 'enc-journey',
      message: `Progress on ${targetText} is a messy, zigzagging line. Showing up on the hard days counts double for your character.`,
      emoji: '🌟',
      actionable: "Don't negotiate with yourself today."
    },
    {
      id: 'enc-growth',
      message: `You realize you're literally rewiring your brain right now by practicing ${targetActivity}, right? Keep tracking.`,
      emoji: '🧠',
      actionable: 'Neuroplasticity is your best friend.'
    },
    {
      id: 'enc-future',
      message: `Imagine the 6-months-from-now version of you looking back on your progress with ${targetText}. Make them proud today.`,
      emoji: '🚀',
      actionable: 'Your future self is watching.'
    }
  ];

  const index = seed % encouragements.length;
  return { ...encouragements[index], type: 'encouragement' };
}

function generateTrendInsight(items: RoadmapItem[], date: Date): DailyInsight {
  const activeItems = items.filter(i => !i.archived);
  
  const now = date;
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const categoryActivity: Record<string, number> = {};

  activeItems.forEach(item => {
    let recentLogs = 0;
    item.activities.forEach(activity => {
      (activity.logs || []).forEach(log => {
        if (new Date(log.date) >= sevenDaysAgo) recentLogs++;
      });
    });
    categoryActivity[item.category] = recentLogs;
  });

  const strongCategories = Object.entries(categoryActivity).filter(([_, count]) => count > 0);
  const topAllTime = getTopItem(activeItems);

  if (strongCategories.length === activeItems.map(i => i.category).filter((v, i, a) => a.indexOf(v) === i).length && strongCategories.length > 0) {
    return {
      id: 'trend-all-active',
      type: 'trend',
      message: `Perfect harmony: All ${strongCategories.length} of your categories stayed active this week. That's ridiculously hard to pull off!`,
      emoji: '🌈',
      actionable: 'Enjoy the balance while it lasts.'
    };
  }

  const strongestCategory = strongCategories.sort((a, b) => b[1] - a[1])[0];

  if (strongestCategory && strongestCategory[1] > 0) {
    const topItemInCategory = activeItems.filter(i => i.category === strongestCategory[0]).sort((a, b) => {
      const aLogs = a.activities.reduce((sum, act) => sum + (act.logs?.length || 0), 0);
      const bLogs = b.activities.reduce((sum, act) => sum + (act.logs?.length || 0), 0);
      return bLogs - aLogs;
    })[0];

    return {
      id: 'trend-strong',
      type: 'trend',
      message: `Ironclad discipline: ${strongestCategory[0]} hasn't faded in 7+ days. Your dedication to "${topItemInCategory.title}" is becoming bulletproof.`,
      emoji: '💎',
      highlightCategory: strongestCategory[0],
      actionable: 'Discipline today = freedom tomorrow.'
    };
  }

  return {
    id: 'trend-restart',
    type: 'trend',
    message: `We can see the rust forming... time to reignite your momentum. A single 2-minute log restarts the engine!`,
    emoji: '🔥',
    actionable: topAllTime && topAllTime.item.title ? `Spend 2 minutes on "${topAllTime.item.title}" today.` : 'Do it poorly, just do it.'
  };
}

export function getInsightPreview(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfYear = Math.floor((tomorrow.getTime() - new Date(tomorrow.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const types = ['progress', 'pattern', 'milestone', 'focus', 'encouragement', 'trend'];
  const tomorrowType = types[dayOfYear % types.length];

  const previews: Record<string, string> = {
    progress: 'your weekly progress comparison',
    pattern: 'your productivity patterns',
    milestone: 'your achievement milestones',
    focus: 'where your effort is concentrated',
    encouragement: 'motivation for your journey',
    trend: 'your consistency trends'
  };

  return previews[tomorrowType] || 'a personalized insight';
}
