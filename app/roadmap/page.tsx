'use client';

/**
 * app/roadmap/page.tsx — Phase 1: FTUE + routing
 *
 * Replaces the old tabbed (Update / Plan / Activities) roadmap UI.
 *
 * Routing logic:
 *   1. LifeFrame incomplete → redirect to next incomplete worksheet (same as before)
 *   2. No active goals yet  → render <FTUECategoryPicker />
 *   3. Goals exist          → "Coming soon" placeholder (Phase 2 ships BubbleCanvas)
 *
 * Data flow:
 *   - loadRoadmap() handles schema migration transparently on read
 *   - saveRoadmap() uses a seqRef for race protection (same pattern as old page)
 *   - If migration happened (old data wiped), shows an info toast
 *
 * What changed from the old page:
 *   - All of UpdateRoadmapView, YourPlanView, YourActivitiesView removed
 *   - Old local types (RoadmapItem, Activity, ManualActivity) removed
 *   - Storage now goes through lib/roadmap-storage.ts (schema_version 2)
 *   - Old components (RoadmapCanvas, RoadmapLane, etc.) still on disk but unused here
 *     → they will be deleted in Phase 2
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import { showToast } from '@/lib/toast';
import { evaluateLifeFrameCompletion } from '@/lib/lifeframe-completion';
import { loadRoadmap, saveRoadmap } from '@/lib/roadmap-storage';
import { emptyRoadmapData } from '@/lib/roadmap-types';
import type { RoadmapData, Goal } from '@/lib/roadmap-types';

import FTUECategoryPicker from './components/FTUECategoryPicker';
import AddGoalModal from './components/AddGoalModal';

// ─── Main component ──────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapData>(emptyRoadmapData());

  /**
   * Which category was tapped in FTUECategoryPicker.
   * Non-null means AddGoalModal is open with this category pre-selected.
   */
  const [ftueCategory, setFtueCategory] = useState<string | null>(null);

  /**
   * Race protection for saves. Each save call increments this before awaiting;
   * stale responses are discarded if the counter has moved past their seq.
   * Same pattern as the old page.tsx — see roadmap-storage.ts for details.
   */
  const saveSeq = useRef(0);

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const userWithProfile = await getUserWithProfile();
        if (!mounted) return;

        if (!userWithProfile) {
          router.push('/login');
          return;
        }

        // Fetch all workbook entries so we can check LifeFrame completion
        // AND extract category names in one round trip.
        const { data: worksheets, error } = await supabase
          .from('workbook_entries')
          .select('category, content')
          .eq('user_id', userWithProfile.user.id);

        if (!mounted) return;

        if (error) {
          console.error('[RoadmapPage] worksheets fetch failed:', error);
          setLoadError(true);
          return;
        }

        // Hard gate: Life Categories must be complete.
        // Middleware should already enforce this, but we defensively redirect
        // in case the user navigates here directly.
        const completion = evaluateLifeFrameCompletion(worksheets ?? []);
        if (!completion.life_categories.isComplete) {
          router.push('/workbook/life-categories');
          return;
        }

        // Extract category names from the user's LifeFrame.
        // Categories can be stored as plain strings OR as objects with a `name` field
        // depending on which version of the worksheet saved them.
        const categoriesRow = worksheets?.find(w => w.category === 'life_categories');
        const rawCategories = (categoriesRow?.content as any)?.categories ?? [];
        const categoryNames: string[] = rawCategories
          .map((c: any) => (typeof c === 'string' ? c : c?.name))
          .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

        // Load the roadmap with automatic schema migration.
        const result = await loadRoadmap(supabase, userWithProfile.user.id);
        if (!mounted) return;

        if (!result.ok) {
          setLoadError(true);
          return;
        }

        // If old data was wiped during migration, let the user know.
        // We do this after setLoading(false) so the toast appears over the loaded UI.
        if (result.migrated) {
          // Defer slightly so the toast renders after the page is visible.
          setTimeout(() => {
            showToast.info(
              'We updated your Roadmap. Your previous test data was cleared.'
            );
          }, 500);
        }

        setUserId(userWithProfile.user.id);
        setCategories(categoryNames);
        setRoadmap(result.data);
      } catch (err) {
        console.error('[RoadmapPage] load error:', err);
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  // ── Save handler ──────────────────────────────────────────────────────────

  /**
   * Adds a new goal, optimistically updates local state, then persists.
   * Called by AddGoalModal's onSave prop.
   */
  const handleAddGoal = async (goal: Goal) => {
    if (!userId) return;

    const next: RoadmapData = {
      ...roadmap,
      goals: [...roadmap.goals, goal],
    };

    // Optimistic update — UI feels instant.
    setRoadmap(next);
    setFtueCategory(null);

    const result = await saveRoadmap(supabase, userId, next, saveSeq);
    if (!result.ok) {
      showToast.error(result.error ?? 'Failed to save. Please try again.');
      // Roll back the optimistic update if the save failed.
      setRoadmap(roadmap);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <AuthNavbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <SkeletonCard />
          </div>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <AuthNavbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-3xl mx-auto px-4 py-24">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                We couldn't load your Roadmap
              </h2>
              <p className="text-gray-600 mb-6">
                Something went wrong fetching your data. Refreshing usually fixes it.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Only count active goals for the FTUE check.
  // Completed and deleted goals don't count — a user who completed everything
  // should see the canvas, not the picker.
  const activeGoals = roadmap.goals.filter(g => g.status === 'active');

  return (
    <>
      <AuthNavbar />

      {/* FTUE: no active goals yet — show the category picker */}
      {activeGoals.length === 0 && (
        <FTUECategoryPicker
          categories={categories}
          onSelectCategory={setFtueCategory}
        />
      )}

      {/* Canvas placeholder: goals exist but BubbleCanvas ships in Phase 2 */}
      {activeGoals.length > 0 && (
        <CanvasComingSoon goalCount={activeGoals.length} />
      )}

      {/* Add Goal modal — opened when user taps a category bubble */}
      {ftueCategory !== null && (
        <AddGoalModal
          preselectedCategory={ftueCategory}
          allCategories={categories}
          onClose={() => setFtueCategory(null)}
          onSave={handleAddGoal}
        />
      )}
    </>
  );
}

// ─── Canvas placeholder (removed in Phase 2) ─────────────────────────────────

/**
 * Temporary holding screen shown when a user has goals but BubbleCanvas
 * isn't built yet. Removed entirely in Phase 2 when BubbleCanvas lands.
 */
function CanvasComingSoon({ goalCount }: { goalCount: number }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-16 flex items-center justify-center">
      <div className="text-center px-6 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          Phase 2 in progress
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Your canvas is coming
        </h1>
        <p className="text-slate-300 text-lg mb-2">
          {goalCount === 1
            ? 'You have 1 goal ready to display.'
            : `You have ${goalCount} goals ready to display.`}
        </p>
        <p className="text-slate-500 text-sm">
          The bubble canvas ships in Phase 2.
        </p>
      </div>
    </div>
  );
}
