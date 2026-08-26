/**
 * lib/videos.ts — Framework Video Catalog
 *
 * Static registry of all Tim Collins Framework videos.
 * Only videos with a non-null `blobUrl` are playable.
 * The rest show as "Coming Soon" in the library.
 *
 * Unlock criteria types:
 *   - signup:              Unlocked at account creation
 *   - watched:             Unlocked after watching specific prerequisite videos
 *   - worksheet_started:   Unlocked when a worksheet page is first visited
 *   - worksheet_complete:  Unlocked when a specific worksheet is completed
 *   - milestone:           Unlocked by a roadmap milestone (first goal, etc.)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type UnlockCriteria =
  | { type: 'signup' }
  | { type: 'watched'; videoIds: string[] }
  | { type: 'worksheet_complete'; worksheet: 'values' | 'interests' | 'life_categories' }
  | { type: 'milestone'; milestone: 'first_goal' | 'first_activity' | 'first_todo' | 'lifeframe_complete' };

export interface FrameworkVideo {
  /** Unique identifier — used in video_progress tracking */
  id: string;
  /** Display order in the library */
  order: number;
  /** Video number from Erin's delivery */
  number: number;
  /** Display title */
  title: string;
  /** Short description */
  description: string;
  /** Approximate duration string */
  duration: string;
  /** Vercel Blob CDN URL. null = not yet delivered */
  blobUrl: string | null;
  /** What the user must do to unlock this video */
  unlockCriteria: UnlockCriteria;
  /** Human-readable unlock instruction shown on locked cards */
  unlockHint: string;
  /** Which category this video belongs to */
  category: 'intro' | 'lifeframe' | 'roadmap' | 'bonus';
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export const VIDEO_CATALOG: FrameworkVideo[] = [
  // ── INTRO VIDEOS (unlocked at signup + sequential watching) ────────────
  {
    id: 'v1-welcome',
    order: 1,
    number: 1,
    title: 'Welcome to the Tim Collins Framework',
    description: 'Tim introduces the framework and explains how defining your values, interests, and purpose creates a foundation for lasting contentment.',
    duration: '5:17',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v1-welcome.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available now',
    category: 'intro',
  },
  {
    id: 'v2-contentment',
    order: 2,
    number: 2,
    title: 'What is Contentment?',
    description: 'Understanding the difference between happiness and sustained contentment — and why values-aligned action is the key.',
    duration: '4:33',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v2-contentment.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available now',
    category: 'intro',
  },
  {
    id: 'v3-improvement',
    order: 3,
    number: 3,
    title: 'The Process of Continuous Improvement',
    description: 'How the cycle of vision, goals, activities, action, and learning creates lasting change.',
    duration: '7:25',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v3-improvement.mp4',
    unlockCriteria: { type: 'watched', videoIds: ['v1-welcome', 'v2-contentment'] },
    unlockHint: 'Watch videos 1 & 2 to unlock',
    category: 'intro',
  },

  // ── LIFEFRAME VIDEOS (unlock as worksheets become relevant) ────────────
  {
    id: 'v4-goals',
    order: 4,
    number: 4,
    title: 'Goals — Begin with the End in Mind',
    description: 'How to set meaningful goals that connect your daily activities to your larger purpose.',
    duration: '3:82',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v4-goals.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'values' },
    unlockHint: 'Complete your Values worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v5-lifeframe-roadmap',
    order: 5,
    number: 5,
    title: 'The LifeFrame & Roadmap',
    description: 'How to use the LifeFrame to organize your life into categories and build a personal roadmap.',
    duration: '2:50',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v5-lifeframe-roadmap.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'life_categories' },
    unlockHint: 'Complete your Life Categories to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v6-your-story',
    order: 6,
    number: 6,
    title: 'Your Story — Tim\'s Life Story',
    description: 'Tim shares his personal story and how the framework shaped his path.',
    duration: '4:33',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v6-your-story.mp4',
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'lifeframe',
  },

  // ── LIFEFRAME & VALUES VIDEOS ─────────────────────────────────────────
  {
    id: 'v7-tools',
    order: 7, number: 7,
    title: 'How to Use the Tools',
    description: 'A walkthrough of the digital tools and how Values, Interests, and Life Categories build your LifeFrame.',
    duration: '1:15',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v7-tools.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available now',
    category: 'intro',
  },
  {
    id: 'v8-values-interests-categories',
    order: 8, number: 8,
    title: 'What Type of Person Do You Want to Be?',
    description: 'Exploring core character traits: doing good, seeking truth, and staying open-minded.',
    duration: '3:00',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v8-values-interests-categories.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available now',
    category: 'lifeframe',
  },
  {
    id: 'v9-character',
    order: 9, number: 9,
    title: 'Core Character & Personal Standards',
    description: 'Living with positivity, honoring your word, and practicing generosity on the path to contentment.',
    duration: '3:17',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v9-character.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available now',
    category: 'lifeframe',
  },
  {
    id: 'v10-values-worksheet',
    order: 10, number: 10,
    title: 'Values — Worksheet 1 Guide',
    description: 'Step-by-step guidance from Tim on identifying, prioritizing, and completing your core values list.',
    duration: '1:00',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v10-values-worksheet.mp4',
    unlockCriteria: { type: 'signup' },
    unlockHint: 'Available on the Values worksheet',
    category: 'lifeframe',
  },
  {
    id: 'v11-interests',
    order: 11, number: 11,
    title: 'Understanding Your Interests',
    description: 'Discovering activities that bring genuine joy, rejuvenation, and energy into your routine.',
    duration: '3:50',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v11-interests.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'values' },
    unlockHint: 'Complete your Values worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v12-life-categories-1',
    order: 12, number: 12,
    title: 'Interests — Worksheet 2 Guide',
    description: 'How to fill out your Interests worksheet: balancing existing hobbies with new things to explore.',
    duration: '1:00',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v12-life-categories-1.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'values' },
    unlockHint: 'Complete your Values worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v13-life-categories-2',
    order: 13, number: 13,
    title: 'Structuring Your Life Categories',
    description: 'How to divide your life into balanced focus areas, with real-life case studies and examples.',
    duration: '3:50',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v13-life-categories-2.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'interests' },
    unlockHint: 'Complete your Interests worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v14-community',
    order: 14, number: 14,
    title: 'Relationships & Community',
    description: 'The vital role of relationships, family, and community in building sustained fulfillment.',
    duration: '2:15',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v14-community.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'interests' },
    unlockHint: 'Complete your Interests worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v15-purpose',
    order: 15, number: 15,
    title: 'Finding & Defining Your Purpose',
    description: 'Key reflective questions to uncover a personal purpose that is meaningful to you and beneficial to others.',
    duration: '3:08',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v15-purpose.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'interests' },
    unlockHint: 'Complete your Interests worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v16-worksheet3',
    order: 16, number: 16,
    title: 'Life Categories & Purpose — Worksheet 3 Guide',
    description: "Tim's instructions for completing your Life Categories and crafting your Purpose statement.",
    duration: '0:50',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v16-worksheet3.mp4',
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'interests' },
    unlockHint: 'Complete your Interests worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v17-goals-activities',
    order: 17, number: 17,
    title: 'Goals, Driven Habits & Minimizing Regrets',
    description: 'Connecting daily behaviors to your goals to live proactively and minimize future regrets.',
    duration: '3:40',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v17-goals-activities.mp4',
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'roadmap',
  },
  {
    id: 'v18-minimize-regrets',
    order: 18, number: 18,
    title: 'Chart Your Own Course',
    description: 'Taking full ownership of your trajectory, priorities, and daily choices.',
    duration: '2:15',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v18-minimize-regrets.mp4',
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'roadmap',
  },
  {
    id: 'v19-chart-your-course',
    order: 19, number: 19,
    title: 'Behavior Change & Lessons on Regret',
    description: 'Tim shares personal lessons on workplace change, ancient wisdom, and avoiding top life regrets.',
    duration: '4:17',
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v19-chart-your-course.mp4',
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'bonus',
  },
  {
    id: 'v20-tough-farmer',
    order: 20, number: 20,
    title: 'The Tough Farmer',
    description: 'Lessons on resilience and perseverance.',
    duration: '~6 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_todo' },
    unlockHint: 'Complete your first to-do to unlock',
    category: 'bonus',
  },
  {
    id: 'v21-worksheet5',
    order: 21, number: 21,
    title: 'Worksheet 5: Goals & Activities',
    description: 'Filling out the Goals & Activities worksheet.',
    duration: '~5 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'roadmap',
  },
  {
    id: 'v22-summary',
    order: 22, number: 22,
    title: 'Summary & Next Steps',
    description: 'Wrapping up the framework and planning your next steps.',
    duration: '~3 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_todo' },
    unlockHint: 'Complete your first to-do to unlock',
    category: 'roadmap',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Videos that have actual blob URLs uploaded (playable) */
export const AVAILABLE_VIDEOS = VIDEO_CATALOG.filter(v => v.blobUrl !== null);

/** Get a video by ID */
export function getVideo(id: string): FrameworkVideo | undefined {
  return VIDEO_CATALOG.find(v => v.id === id);
}

/** Get category display name */
export function getCategoryLabel(cat: FrameworkVideo['category']): string {
  switch (cat) {
    case 'intro': return 'Introduction';
    case 'lifeframe': return 'LifeFrame';
    case 'roadmap': return 'Roadmap';
    case 'bonus': return 'Bonus';
  }
}
