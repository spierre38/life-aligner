// lib/contentment-score.ts
// Calculates a daily "Contentment Score" (0–100) like Whoop's Recovery Score.
// Opens as a mystery each morning — the number users become obsessed with.

export interface ContentmentScoreResult {
  score: number;               // 0-100
  tier: 'legendary' | 'thriving' | 'growing' | 'warming_up' | 'dormant';
  tierLabel: string;
  tierColor: string;
  breakdown: ScoreBreakdown;
  headline: string;            // The punchy one-liner
  advice: string;              // What to do today
  targetGoal?: string;         // Specific goal to focus on
}

interface ScoreBreakdown {
  consistency: number;    // 0-30 pts: Did you log recently?
  balance: number;        // 0-20 pts: Are you covering multiple categories?
  feeling: number;        // 0-20 pts: How are your feelings trending?
  streak: number;         // 0-15 pts: Current streak bonus
  depth: number;          // 0-15 pts: Reflections + notes
}

interface RoadmapItem {
  id: string;
  title?: string;
  category: string;
  activities: Array<{
    id: string;
    text?: string;
    logs?: Array<{ date: string; feeling: 'great' | 'okay' | 'hard'; note?: string }>;
  }>;
  reflections: any[];
  archived: boolean;
}

export function calculateContentmentScore(
  roadmapItems: RoadmapItem[],
  date: Date = new Date()
): ContentmentScoreResult {
  const activeItems = roadmapItems.filter(i => !i.archived);

  if (activeItems.length === 0) {
    return {
      score: 0,
      tier: 'dormant',
      tierLabel: 'Getting Started',
      tierColor: '#9CA3AF',
      breakdown: { consistency: 0, balance: 0, feeling: 0, streak: 0, depth: 0 },
      headline: 'Your journey begins today.',
      advice: 'Add a goal and log your first activity to get your Contentment Score!',
    };
  }

  // ---- 1. CONSISTENCY (0-30) ----
  // How many of the last 7 days did you log at least one activity?
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const loggedDates = new Set<string>();
  activeItems.forEach(item => {
    item.activities.forEach(act => {
      (act.logs || []).forEach(log => loggedDates.add(log.date));
    });
  });

  const daysLoggedLast7 = last7Days.filter(d => loggedDates.has(d)).length;
  const consistency = Math.round((daysLoggedLast7 / 7) * 30);

  // ---- 2. BALANCE (0-20) ----
  // How many distinct categories had activity in the last 7 days?
  const uniqueCategories = new Set<string>();
  activeItems.forEach(item => {
    const hasRecentLog = item.activities.some(act =>
      (act.logs || []).some(log => last7Days.includes(log.date))
    );
    if (hasRecentLog) uniqueCategories.add(item.category);
  });

  const totalCategories = new Set(activeItems.map(i => i.category)).size;
  const balanceRatio = totalCategories > 0 ? uniqueCategories.size / totalCategories : 0;
  const balance = Math.round(balanceRatio * 20);

  // ---- 3. FEELING (0-20) ----
  // Weighted average of recent feelings: great=1, okay=0.5, hard=0.2
  const recentFeelings: number[] = [];
  activeItems.forEach(item => {
    item.activities.forEach(act => {
      (act.logs || []).forEach(log => {
        if (last7Days.includes(log.date)) {
          const val = log.feeling === 'great' ? 1.0 : log.feeling === 'okay' ? 0.5 : 0.2;
          recentFeelings.push(val);
        }
      });
    });
  });

  const avgFeeling = recentFeelings.length > 0
    ? recentFeelings.reduce((a, b) => a + b, 0) / recentFeelings.length
    : 0;
  const feeling = Math.round(avgFeeling * 20);

  // ---- 4. STREAK (0-15) ----
  let currentStreak = 0;
  const checkDate = new Date(date);
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (loggedDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  // 1 day = 2pts, 3 days = 6pts, 7 days = 14pts, cap at 15
  const streak = Math.min(15, currentStreak * 2);

  // ---- 5. DEPTH (0-15) ----
  // Reflections in last 14 days + logs with notes
  const last14Days: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    last14Days.push(d.toISOString().split('T')[0]);
  }

  let recentReflections = 0;
  activeItems.forEach(item => {
    // Count reflections (simple count since they don't always have dates)
    recentReflections += item.reflections.length;
  });

  let logsWithNotes = 0;
  activeItems.forEach(item => {
    item.activities.forEach(act => {
      (act.logs || []).forEach(log => {
        if (last14Days.includes(log.date) && log.note && log.note.trim().length > 0) {
          logsWithNotes++;
        }
      });
    });
  });

  const depthRaw = Math.min(recentReflections * 3 + logsWithNotes * 2, 15);
  const depth = depthRaw;

  // ---- TOTAL ----
  const score = Math.min(100, consistency + balance + feeling + streak + depth);

  // ---- TIER ----
  const tier = score >= 85 ? 'legendary' as const
    : score >= 65 ? 'thriving' as const
    : score >= 40 ? 'growing' as const
    : score >= 15 ? 'warming_up' as const
    : 'dormant' as const;

  const tierMap = {
    legendary: { label: 'Legendary', color: '#F59E0B' },
    thriving:  { label: 'Thriving',  color: '#10B981' },
    growing:   { label: 'Growing',   color: '#6366F1' },
    warming_up:{ label: 'Warming Up',color: '#F97316' },
    dormant:   { label: 'Dormant',   color: '#9CA3AF' },
  };

  // ---- TARGET GOAL ----
  // Find the most neglected goal to recommend
  let mostNeglected: any = null;
  activeItems.forEach(item => {
    let latestLog: string | null = null;
    item.activities.forEach(act => {
      (act.logs || []).forEach(log => {
        if (!latestLog || log.date > latestLog) latestLog = log.date;
      });
    });
    const daysSince = latestLog
      ? Math.floor((date.getTime() - new Date(latestLog).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Cap at 30 for never-logged goals
    if (!mostNeglected || daysSince > mostNeglected.daysSince) {
      mostNeglected = { item, daysSince };
    }
  });

  // ---- HEADLINE & ADVICE ----
  const { headline, advice } = generateScoreCopy(score, tier, currentStreak, mostNeglected, daysLoggedLast7);

  return {
    score,
    tier,
    tierLabel: tierMap[tier].label,
    tierColor: tierMap[tier].color,
    breakdown: { consistency, balance, feeling, streak, depth },
    headline,
    advice,
    targetGoal: mostNeglected?.item?.title,
  };
}

function generateScoreCopy(
  score: number,
  tier: string,
  streak: number,
  neglected: { item: RoadmapItem; daysSince: number } | null,
  daysLogged: number,
): { headline: string; advice: string } {

  const goalName = neglected?.item?.title ? `"${neglected.item.title}"` : 'your goals';

  if (score >= 85) {
    return {
      headline: `You're dialed in at ${score}. This is what alignment feels like.`,
      advice: streak >= 7
        ? `${streak}-day streak and counting. You're untouchable right now.`
        : `Keep this energy going—maybe revisit ${goalName} today.`,
    };
  }
  if (score >= 65) {
    return {
      headline: `${score} — strong momentum. A few tweaks and you'll be legendary.`,
      advice: neglected && neglected.daysSince > 3
        ? `${goalName} hasn't seen action in ${neglected.daysSince} days. A quick log could push you into the 80s.`
        : `You're ${85 - score} points from Legendary. One more balanced day does it.`,
    };
  }
  if (score >= 40) {
    return {
      headline: `${score} — you're building. The foundation is there.`,
      advice: neglected && neglected.daysSince > 5
        ? `${goalName} is fading (${neglected.daysSince} days). Spend 5 minutes there to boost your score.`
        : `You logged ${daysLogged} of the last 7 days. Adding one more day this week changes everything.`,
    };
  }
  if (score >= 15) {
    return {
      headline: `${score} — warming up. Every comeback starts exactly here.`,
      advice: `Just open ${goalName} and log one activity. That's all it takes to start climbing.`,
    };
  }
  return {
    headline: `Your score is waiting to be built. Today is day one.`,
    advice: `Start with ${goalName}. A single 2-minute log gets you on the board.`,
  };
}
