'use client';

/**
 * app/roadmap/page.tsx — v3: Many-to-many activities
 *
 * Orchestrates all Roadmap UI:
 *   - FTUE category picker (no goals yet)
 *   - BubbleCanvas (goals + ambient orbs)
 *   - GoalDetailView overlay (branching tree per goal)
 *   - AddGoalModal (goal-first entry with inline activities)
 *   - AddActivityModal (activity-first entry, connect to multiple goals)
 *   - EditGoalModal (edit existing goal)
 *
 * Data model:
 *   - Goals and Activities are separate top-level arrays
 *   - Activities reference goals via connectedGoalIds[]
 *   - SubActivities nest under Activities (one level)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import { showToast } from '@/lib/toast';
import { evaluateLifeFrameCompletion } from '@/lib/lifeframe-completion';
import { loadRoadmap, saveRoadmap } from '@/lib/roadmap-storage';
import { emptyRoadmapData } from '@/lib/roadmap-types';
import type { Goal, Activity, SubActivity, RoadmapData } from '@/lib/roadmap-types';

import FTUECategoryPicker from './components/FTUECategoryPicker';
import BubbleCanvas from './components/BubbleCanvas';
import AddGoalModal from './components/AddGoalModal';
import EditGoalModal from './components/EditGoalModal';
import GoalDetailView from './components/GoalDetailView';
import AddActivityModal from './components/AddActivityModal';
import ReviewActivitiesView from './components/ReviewActivitiesView';
import { CompletionModal } from './components/CompletionModal';

// ─── Main component ───────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [savedValues, setSavedValues] = useState<string[]>([]);
  const [savedInterests, setSavedInterests] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapData>(emptyRoadmapData());
  const [reducedMotion, setReducedMotion] = useState(false);

  // Modal / view state
  const [ftueCategory, setFtueCategory] = useState<string | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addActivityForGoalId, setAddActivityForGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [completingGoal, setCompletingGoal] = useState<Goal | null>(null);

  const saveSeq = useRef(0);

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const userWithProfile = await getUserWithProfile();
        if (!mounted) return;

        if (!userWithProfile) { router.push('/login'); return; }

        const { data: worksheets, error } = await supabase
          .from('workbook_entries')
          .select('category, content')
          .eq('user_id', userWithProfile.user.id);

        if (!mounted) return;
        if (error) { setLoadError(true); return; }

        const completion = evaluateLifeFrameCompletion(worksheets ?? []);
        if (!completion.life_categories.isComplete) {
          router.push('/workbook/life-categories');
          return;
        }

        const catRow = worksheets?.find(w => w.category === 'life_categories');
        const rawCats = (catRow?.content as any)?.categories ?? [];
        const categoryNames: string[] = rawCats
          .map((c: any) => (typeof c === 'string' ? c : c?.name))
          .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

        const valRow = worksheets?.find(w => w.category === 'values');
        const valueNames: string[] = ((valRow?.content as any)?.selected_values ?? [])
          .map((v: any) => v?.name)
          .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

        const intRow = worksheets?.find(w => w.category === 'interests');
        const existing: string[] = (intRow?.content as any)?.existing ?? [];
        const exploring: string[] = (intRow?.content as any)?.exploring ?? [];
        const interestNames = [...existing, ...exploring]
          .filter((n): n is string => typeof n === 'string' && n.length > 0);

        const result = await loadRoadmap(supabase, userWithProfile.user.id);
        if (!mounted) return;

        if (!result.ok) { setLoadError(true); return; }

        if (result.migrated) {
          setTimeout(() => showToast.info('We updated your Roadmap to the new format.'), 500);
        }

        setUserId(userWithProfile.user.id);
        setCategories(categoryNames);
        setSavedValues(valueNames);
        setSavedInterests(interestNames);
        setRoadmap(result.data);
      } catch (err) {
        console.error('[RoadmapPage] load error:', err);
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [router]);

  // Reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // ── Save helper ─────────────────────────────────────────────────────────────

  const persist = useCallback(async (next: RoadmapData) => {
    if (!userId) return;
    setRoadmap(next);
    const result = await saveRoadmap(supabase, userId, next, saveSeq);
    if (!result.ok) {
      showToast.error(result.error ?? 'Failed to save. Please try again.');
    }
  }, [userId]);

  // ── Goal-level handlers ─────────────────────────────────────────────────────

  const handleAddGoalWithActivities = useCallback(async (
    goal: Goal,
    newActivities: Activity[]
  ) => {
    setFtueCategory(null);
    setAddGoalOpen(false);
    await persist({
      ...roadmap,
      goals: [...roadmap.goals, goal],
      activities: [...roadmap.activities, ...newActivities],
    });
  }, [roadmap, persist]);

  const handleEditGoal = useCallback(async (updated: Goal) => {
    setEditingGoal(null);
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g => g.id === updated.id ? updated : g),
    });
  }, [roadmap, persist]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    setEditingGoal(null);
    setDetailGoalId(null);
    setCompletingGoal(null);
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, status: 'deleted' as const, deletedAt: new Date().toISOString() }
          : g
      ),
      // Also disconnect deleted goal from all activities
      activities: roadmap.activities.map(a => ({
        ...a,
        connectedGoalIds: a.connectedGoalIds.filter(id => id !== goalId),
      })),
    });
    showToast.success('Goal deleted.');
  }, [roadmap, persist]);

  /** Open the CompletionModal for a goal */
  const handleCompleteGoal = useCallback((goal: Goal) => {
    setCompletingGoal(goal);
  }, []);

  /** Persist the goal as completed with an optional finalReflection */
  const handleCompleteConfirm = useCallback(async (finalReflection: string) => {
    if (!completingGoal) return;
    const now = new Date().toISOString();
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === completingGoal.id
          ? { ...g, status: 'completed' as const, completedAt: now, finalReflection: finalReflection || undefined }
          : g
      ),
    });
    setCompletingGoal(null);
    setDetailGoalId(null);
    showToast.success('Chapter saved to your Reflections ✨');
  }, [completingGoal, roadmap, persist]);

  /** Add a journal entry (reflection) to a goal */
  const handleAddReflection = useCallback(async (
    goalId: string,
    text: string,
    mood?: 'great' | 'okay' | 'hard'
  ) => {
    const entry = {
      id: crypto.randomUUID(),
      text,
      date: new Date().toISOString(),
      mood,
    };
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, reflections: [...(g.reflections ?? []), entry] }
          : g
      ),
    });
    showToast.success('Reflection saved →');
  }, [roadmap, persist]);

  const handlePositionChange = useCallback(async (
    goalId: string,
    position: { x: number; y: number }
  ) => {
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g => g.id === goalId ? { ...g, position } : g),
    });
  }, [roadmap, persist]);

  // ── Activity-level handlers ─────────────────────────────────────────────────

  const handleAddActivity = useCallback(async (activity: Activity, newGoalTitles: string[] = []) => {
    setAddActivityOpen(false);
    setAddActivityForGoalId(null);

    const now = new Date().toISOString();
    const newGoals: Goal[] = newGoalTitles.map(title => ({
      id: crypto.randomUUID(),
      title,
      connectedCategories: [],
      connectedValues: [],
      connectedInterests: [],
      blobVariant: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }));

    const finalActivity = {
      ...activity,
      connectedGoalIds: [...activity.connectedGoalIds, ...newGoals.map(g => g.id)],
    };

    await persist({
      ...roadmap,
      goals: [...roadmap.goals, ...newGoals],
      activities: [...roadmap.activities, finalActivity],
    });
  }, [roadmap, persist]);

  const handleCreateActivityInline = useCallback(async (
    goalId: string,
    title: string,
    includeToday: boolean
  ) => {
    const now = new Date().toISOString();
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title,
      connectedGoalIds: [goalId],
      completed: false,
      includeToday,
      subActivities: [],
      createdAt: now,
      updatedAt: now,
    };
    await persist({
      ...roadmap,
      activities: [...roadmap.activities, newActivity],
    });
  }, [roadmap, persist]);

  const handleToggleActivityComplete = useCallback(async (
    activityId: string,
    completed: boolean
  ) => {
    const now = new Date().toISOString();
    await persist({
      ...roadmap,
      activities: roadmap.activities.map(a =>
        a.id === activityId
          ? { ...a, completed, completedAt: completed ? now : undefined, updatedAt: now }
          : a
      ),
    });
  }, [roadmap, persist]);

  const handleToggleActivityIncludeToday = useCallback(async (
    activityId: string,
    includeToday: boolean
  ) => {
    await persist({
      ...roadmap,
      activities: roadmap.activities.map(a =>
        a.id === activityId
          ? { ...a, includeToday, updatedAt: new Date().toISOString() }
          : a
      ),
    });
  }, [roadmap, persist]);

  const handleDeleteActivity = useCallback(async (activityId: string) => {
    await persist({
      ...roadmap,
      activities: roadmap.activities.filter(a => a.id !== activityId),
    });
  }, [roadmap, persist]);

  // ── SubActivity handlers ────────────────────────────────────────────────────

  const handleToggleSubActivityComplete = useCallback(async (
    activityId: string,
    subActivityId: string,
    completed: boolean
  ) => {
    const now = new Date().toISOString();
    await persist({
      ...roadmap,
      activities: roadmap.activities.map(a =>
        a.id === activityId
          ? {
              ...a,
              updatedAt: now,
              subActivities: a.subActivities.map(sa =>
                sa.id === subActivityId
                  ? { ...sa, completed, completedAt: completed ? now : undefined }
                  : sa
              ),
            }
          : a
      ),
    });
  }, [roadmap, persist]);

  // ── Ask Tim stub ────────────────────────────────────────────────────────────

  const handleAskTim = useCallback(() => {
    showToast.info('AI coaching is live! Click a goal to see Tim\'s coaching.');
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────

  const activeGoals = useMemo(
    () => roadmap.goals.filter(g => g.status === 'active'),
    [roadmap.goals]
  );

  const detailGoal = detailGoalId
    ? roadmap.goals.find(g => g.id === detailGoalId) ?? null
    : null;

  // Activities for the currently viewed goal
  const detailGoalActivities = useMemo(
    () => detailGoalId
      ? roadmap.activities.filter(a => a.connectedGoalIds.includes(detailGoalId))
      : [],
    [roadmap.activities, detailGoalId]
  );

  // ── Render states ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <AuthNavbar />
        <div className="min-h-screen pt-16" style={{ background: 'var(--color-bg)' }}>
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="h-64 rounded-3xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
          </div>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <AuthNavbar />
        <div className="min-h-screen pt-16" style={{ background: 'var(--color-bg)' }}>
          <div className="max-w-3xl mx-auto px-4 py-24">
            <div className="rounded-3xl p-8 md:p-12 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                We couldn't load your Roadmap
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Something went wrong fetching your data. Refreshing usually fixes it.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthNavbar />

      {/* FTUE: no active goals */}
      {activeGoals.length === 0 && (
        <FTUECategoryPicker
          categories={categories}
          onSelectCategory={setFtueCategory}
          onAskTim={handleAskTim}
        />
      )}

      {/* Bubble Canvas */}
      {activeGoals.length > 0 && (
        <BubbleCanvas
          roadmap={roadmap}
          savedValues={savedValues}
          savedInterests={savedInterests}
          onAddGoal={() => setAddGoalOpen(true)}
          onAddActivity={() => setAddActivityOpen(true)}
          onEditGoal={setEditingGoal}
          onDeleteGoal={handleDeleteGoal}
          onPositionChange={handlePositionChange}
          onOpenGoal={setDetailGoalId}
          onReviewAll={() => setReviewOpen(true)}
        />
      )}

      {/* Review All Activities overlay */}
      {reviewOpen && (
        <ReviewActivitiesView
          goals={roadmap.goals}
          activities={roadmap.activities}
          onClose={() => setReviewOpen(false)}
          onToggleActivityComplete={handleToggleActivityComplete}
          onToggleActivityIncludeToday={handleToggleActivityIncludeToday}
          onDeleteActivity={handleDeleteActivity}
          onAddGoal={() => { setReviewOpen(false); setAddGoalOpen(true); }}
          onAddActivity={() => { setReviewOpen(false); setAddActivityOpen(true); }}
        />
      )}

      {/* Goal Detail View overlay */}
      {detailGoal && (
        <GoalDetailView
          goal={detailGoal}
          activities={detailGoalActivities}
          allActivities={roadmap.activities}
          reducedMotion={reducedMotion}
          onClose={() => setDetailGoalId(null)}
          onToggleActivityComplete={handleToggleActivityComplete}
          onToggleActivityIncludeToday={handleToggleActivityIncludeToday}
          onToggleSubActivityComplete={handleToggleSubActivityComplete}
          onDeleteActivity={handleDeleteActivity}
          onAddActivity={(goalId) => { setAddActivityForGoalId(goalId); setAddActivityOpen(true); }}
          onCreateActivityInline={handleCreateActivityInline}
          onEditGoal={(g) => { setDetailGoalId(null); setEditingGoal(g); }}
          onCompleteGoal={handleCompleteGoal}
          onDeleteGoal={handleDeleteGoal}
          onAddReflection={handleAddReflection}
        />
      )}

      {/* Completion celebration modal */}
      {completingGoal && (
        <CompletionModal
          goal={completingGoal}
          onSave={handleCompleteConfirm}
          onDismiss={() => setCompletingGoal(null)}
        />
      )}

      {/* Add Goal modal — FTUE or canvas button */}
      {(ftueCategory !== null || addGoalOpen) && (
        <AddGoalModal
          preselectedCategory={ftueCategory ?? undefined}
          allCategories={categories}
          savedValues={savedValues}
          savedInterests={savedInterests}
          onClose={() => { setFtueCategory(null); setAddGoalOpen(false); }}
          onSave={handleAddGoalWithActivities}
        />
      )}

      {/* Edit Goal modal */}
      {editingGoal !== null && (
        <EditGoalModal
          goal={editingGoal}
          allCategories={categories}
          savedValues={savedValues}
          savedInterests={savedInterests}
          onClose={() => setEditingGoal(null)}
          onSave={handleEditGoal}
          onDelete={handleDeleteGoal}
        />
      )}

      {/* Add Activity modal — activity-first entry */}
      {addActivityOpen && (
        <AddActivityModal
          existingGoals={activeGoals}
          preselectedGoalId={addActivityForGoalId}
          savedValues={savedValues}
          savedInterests={savedInterests}
          savedCategories={categories}
          onClose={() => { setAddActivityOpen(false); setAddActivityForGoalId(null); }}
          onSave={handleAddActivity}
        />
      )}
    </>
  );
}
