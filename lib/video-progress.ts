/**
 * lib/video-progress.ts — Video Unlock & Progress Logic
 *
 * Pure functions (no React, no DB calls) that determine:
 *   - Which videos are unlocked for a user
 *   - Which videos have been watched
 *   - Whether a new video was just unlocked (for celebration toast)
 *
 * Inputs come from the caller (dashboard, resources page, etc.)
 * who fetches workbook_entries + profile.video_progress.
 */

import { VIDEO_CATALOG, type FrameworkVideo, type UnlockCriteria } from './videos';
import type { LifeFrameCompletion } from './lifeframe-completion';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoProgress {
  watched: string[];
  lastUnlockSeen: string | null;
}

export interface RoadmapState {
  goalCount: number;
  activityCount: number;
  completedTodoCount: number;
}

export interface VideoStatus {
  video: FrameworkVideo;
  unlocked: boolean;
  watched: boolean;
  available: boolean;   // has a storageKey (file uploaded)
}

/** Parse raw JSONB from profiles.video_progress into typed shape */
export function parseVideoProgress(raw: unknown): VideoProgress {
  if (!raw || typeof raw !== 'object') return { watched: [], lastUnlockSeen: null };
  const obj = raw as Record<string, unknown>;
  return {
    watched: Array.isArray(obj.watched) ? obj.watched.filter((w): w is string => typeof w === 'string') : [],
    lastUnlockSeen: typeof obj.lastUnlockSeen === 'string' ? obj.lastUnlockSeen : null,
  };
}

// ─── Unlock Evaluation ──────────────────────────────────────────────────────

/** Check if a single unlock criteria is met */
function isCriteriaMet(
  criteria: UnlockCriteria,
  completion: LifeFrameCompletion | null,
  roadmap: RoadmapState,
  watchedIds: Set<string>,
): boolean {
  switch (criteria.type) {
    case 'signup':
      return true;

    case 'watched':
      return criteria.videoIds.every(id => watchedIds.has(id));

    case 'worksheet_complete':
      if (!completion) return false;
      return completion[criteria.worksheet]?.isComplete === true;

    case 'milestone': {
      switch (criteria.milestone) {
        case 'lifeframe_complete':
          return completion?.allComplete === true;
        case 'first_goal':
          return roadmap.goalCount > 0;
        case 'first_activity':
          return roadmap.activityCount > 0;
        case 'first_todo':
          return roadmap.completedTodoCount > 0;
        default:
          return false;
      }
    }

    default:
      return false;
  }
}

/** Get the full status of all videos for a user */
export function getVideoStatuses(
  completion: LifeFrameCompletion | null,
  roadmap: RoadmapState,
  progress: VideoProgress,
): VideoStatus[] {
  const watchedSet = new Set(progress.watched);

  return VIDEO_CATALOG.map(video => ({
    video,
    unlocked: isCriteriaMet(video.unlockCriteria, completion, roadmap, watchedSet),
    watched: watchedSet.has(video.id),
    available: video.storageKey !== null,
  }));
}

/** Get just the unlocked video IDs */
export function getUnlockedVideoIds(
  completion: LifeFrameCompletion | null,
  roadmap: RoadmapState,
  progress: VideoProgress,
): string[] {
  return getVideoStatuses(completion, roadmap, progress)
    .filter(s => s.unlocked)
    .map(s => s.video.id);
}

// ─── New Unlock Detection ───────────────────────────────────────────────────

/**
 * Detect videos that are newly unlocked since the user last saw a celebration.
 * Returns the first new-unlocked video (for toast), or null.
 */
export function getNewlyUnlockedVideo(
  statuses: VideoStatus[],
  lastUnlockSeen: string | null,
): FrameworkVideo | null {
  // Find the highest-order video we've already shown the celebration for
  const lastSeenOrder = lastUnlockSeen
    ? VIDEO_CATALOG.find(v => v.id === lastUnlockSeen)?.order ?? 0
    : 0;

  // Find the first unlocked + available video with order > lastSeenOrder
  // that the user hasn't watched yet (watching = they already know about it)
  for (const status of statuses) {
    if (
      status.unlocked &&
      status.available &&
      !status.watched &&
      status.video.order > lastSeenOrder
    ) {
      return status.video;
    }
  }

  return null;
}

// ─── Summary Stats ──────────────────────────────────────────────────────────

export function getVideoStats(statuses: VideoStatus[]) {
  const available = statuses.filter(s => s.available);
  const unlocked = statuses.filter(s => s.unlocked);
  const watched = statuses.filter(s => s.watched);
  const unlockedAndAvailable = available.filter(s => s.unlocked);

  return {
    totalVideos: VIDEO_CATALOG.length,
    availableCount: available.length,
    unlockedCount: unlocked.length,
    watchedCount: watched.length,
    unlockedAndAvailableCount: unlockedAndAvailable.length,
    /** Progress percentage based on available videos */
    watchProgress: available.length > 0
      ? Math.round((watched.length / available.length) * 100)
      : 0,
  };
}

// ─── GA Event Helpers ───────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackVideoEvent(
  event: 'video_started' | 'video_completed' | 'video_unlocked',
  videoId: string,
  videoTitle: string,
  extra?: Record<string, unknown>,
) {
  window.gtag?.('event', event, {
    video_id: videoId,
    video_title: videoTitle,
    ...extra,
  });
}

// ─── Watch Threshold ────────────────────────────────────────────────────────

/** Percentage of video that must be watched to count as "completed" */
export const WATCH_THRESHOLD = 0.95;
