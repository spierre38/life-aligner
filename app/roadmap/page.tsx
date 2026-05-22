'use client';

/**
 * app/roadmap/page.tsx — Phase 2.1 (refined)
 *
 * Changes from Phase 2:
 *   - ActivitiesDrawer removed (per "turn off DASH maybe" note)
 *   - savedValues and savedInterests passed to BubbleCanvas for ambient display
 *   - FTUECategoryPicker gets onAskTim prop (stub alert for now, Phase 4)
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
import type { Goal, GoalNode, RoadmapData } from '@/lib/roadmap-types';

import FTUECategoryPicker from './components/FTUECategoryPicker';
import BubbleCanvas from './components/BubbleCanvas';
import AddGoalModal from './components/AddGoalModal';
import EditGoalModal from './components/EditGoalModal';

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function updateNodeInTree(
  nodes: GoalNode[],
  nodeId: string,
  update: Partial<GoalNode>
): GoalNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) return { ...node, ...update };
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, nodeId, update) };
    }
    return node;
  });
}

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

  // Modal state
  const [ftueCategory, setFtueCategory] = useState<string | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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

        // LifeFrame gate
        const completion = evaluateLifeFrameCompletion(worksheets ?? []);
        if (!completion.life_categories.isComplete) {
          router.push('/workbook/life-categories');
          return;
        }

        // Category names
        const catRow = worksheets?.find(w => w.category === 'life_categories');
        const rawCats = (catRow?.content as any)?.categories ?? [];
        const categoryNames: string[] = rawCats
          .map((c: any) => (typeof c === 'string' ? c : c?.name))
          .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

        // Value names
        const valRow = worksheets?.find(w => w.category === 'values');
        const valueNames: string[] = ((valRow?.content as any)?.selected_values ?? [])
          .map((v: any) => v?.name)
          .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

        // Interest names
        const intRow = worksheets?.find(w => w.category === 'interests');
        const existing: string[] = (intRow?.content as any)?.existing ?? [];
        const exploring: string[] = (intRow?.content as any)?.exploring ?? [];
        const interestNames = [...existing, ...exploring]
          .filter((n): n is string => typeof n === 'string' && n.length > 0);

        // Load roadmap
        const result = await loadRoadmap(supabase, userWithProfile.user.id);
        if (!mounted) return;

        if (!result.ok) { setLoadError(true); return; }

        if (result.migrated) {
          setTimeout(() => showToast.info('We updated your Roadmap. Previous test data was cleared.'), 500);
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

  // ── Save helper ─────────────────────────────────────────────────────────────

  const persist = async (next: RoadmapData) => {
    if (!userId) return;
    setRoadmap(next);
    const result = await saveRoadmap(supabase, userId, next, saveSeq);
    if (!result.ok) {
      showToast.error(result.error ?? 'Failed to save. Please try again.');
    }
  };

  // ── Goal handlers ───────────────────────────────────────────────────────────

  const handleAddGoal = async (goal: Goal) => {
    setFtueCategory(null);
    setAddGoalOpen(false);
    await persist({ ...roadmap, goals: [...roadmap.goals, goal] });
  };

  const handleEditGoal = async (updated: Goal) => {
    setEditingGoal(null);
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g => g.id === updated.id ? updated : g),
    });
  };

  const handleDeleteGoal = async (goalId: string) => {
    setEditingGoal(null);
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, status: 'deleted', deletedAt: new Date().toISOString() }
          : g
      ),
    });
  };

  const handlePositionChange = async (
    goalId: string,
    position: { x: number; y: number }
  ) => {
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g => g.id === goalId ? { ...g, position } : g),
    });
  };

  // ── Ask Tim stub ────────────────────────────────────────────────────────────

  const handleAskTim = () => {
    showToast.info('AI coaching is coming in Phase 4! For now, pick a category to start.');
  };

  // ── Render states ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <AuthNavbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-6xl mx-auto px-4 py-12"><SkeletonCard /></div>
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

  const activeGoals = roadmap.goals.filter(g => g.status === 'active');

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
          onEditGoal={setEditingGoal}
          onDeleteGoal={handleDeleteGoal}
          onPositionChange={handlePositionChange}
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
          onSave={handleAddGoal}
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
    </>
  );
}
