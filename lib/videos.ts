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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v1-welcome-OtEUATHH2afAEdWYhs9o4VP4GTA0WX.mp4',
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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v2-contentment-jVWdBfyGKRQoZDPmuMaJedzcOVKlx9.mp4',
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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v3-improvement-miwZTKixYdfCh972g3pq5j7nNxukwv.mp4',
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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v4-goals-NGE9WUixMEDRvVyCPR6ZIyTkMQ12UP.mp4',
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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v5-lifeframe-roadmap-R7NIu9lyNmmEHk62TEme5aqOzKiOIX.mp4',
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
    blobUrl: 'https://qbk24sf1xk0oeoky.public.blob.vercel-storage.com/framework-videos/v6-your-story-Qr8WWjGfz1bnpVW1D3Hm0FzRuxUVUI.mp4',
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'lifeframe',
  },

  // -- FUTURE VIDEOS (no blobUrl yet) -----------------------------------------------
  {
    id: 'v7-tools',
    order: 7, number: 7,
    title: 'How to Use the Tools',
    description: 'A walkthrough of the digital tools available in the app.',
    duration: '~3 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'roadmap',
  },
  {
    id: 'v8-values-interests-categories',
    order: 8, number: 8,
    title: 'Values, Interests & Life Categories',
    description: 'A deeper dive into the three pillars of your LifeFrame.',
    duration: '~5 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v9-character',
    order: 9, number: 9,
    title: 'Be Open Minded, Positive & Your Word',
    description: 'Character traits that support your journey toward contentment.',
    duration: '~6 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'bonus',
  },
  {
    id: 'v10-values-worksheet',
    order: 10, number: 10,
    title: 'Values — Worksheet Deep Dive',
    description: 'Detailed guide to completing your Values worksheet effectively.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'values' },
    unlockHint: 'Complete your Values worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v11-interests',
    order: 11, number: 11,
    title: 'Understanding Your Interests',
    description: 'Finding the activities that bring you energy and fulfillment.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'interests' },
    unlockHint: 'Complete your Interests worksheet to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v12-life-categories-1',
    order: 12, number: 12,
    title: 'Life Categories (Part 1)',
    description: 'Defining the key areas of your life to focus on.',
    duration: '~5 min',
    blobUrl: null,
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'life_categories' },
    unlockHint: 'Complete your Life Categories to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v13-life-categories-2',
    order: 13, number: 13,
    title: 'Life Categories (Part 2)',
    description: 'Connecting categories to your values and purpose.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'worksheet_complete', worksheet: 'life_categories' },
    unlockHint: 'Complete your Life Categories to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v14-community',
    order: 14, number: 14,
    title: 'Community & Relationships',
    description: 'How your community shapes your path to contentment.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'bonus',
  },
  {
    id: 'v15-purpose',
    order: 15, number: 15,
    title: 'Finding Your Purpose',
    description: 'How to define and pursue a meaningful purpose.',
    duration: '~5 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'lifeframe',
  },
  {
    id: 'v16-worksheet3',
    order: 16, number: 16,
    title: 'Worksheet 3: Instructions',
    description: 'Step-by-step guide for the Goals & Activities worksheet.',
    duration: '~3 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'lifeframe_complete' },
    unlockHint: 'Complete your LifeFrame to unlock',
    category: 'roadmap',
  },
  {
    id: 'v17-goals-activities',
    order: 17, number: 17,
    title: 'Goals & Behavior Changes',
    description: 'Setting actionable goals and tracking behavior changes.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'roadmap',
  },
  {
    id: 'v18-minimize-regrets',
    order: 18, number: 18,
    title: 'Minimize Regrets',
    description: 'Using the framework to reduce future regret.',
    duration: '~4 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_goal' },
    unlockHint: 'Add your first goal to unlock',
    category: 'bonus',
  },
  {
    id: 'v19-chart-your-course',
    order: 19, number: 19,
    title: 'Chart Your Own Course',
    description: 'Taking ownership of your journey.',
    duration: '~3 min',
    blobUrl: null,
    unlockCriteria: { type: 'milestone', milestone: 'first_activity' },
    unlockHint: 'Add your first activity to unlock',
    category: 'roadmap',
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
