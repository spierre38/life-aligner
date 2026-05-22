'use client';

/**
 * app/roadmap/page.tsx — Phase 3: Goal Detail View
 *
 * Additions:
 *   - GoalDetailView overlay when a goal bubble is clicked
 *   - AddNodeModal for adding sub-goals/activities to a goal
 *   - Handlers for node operations (add, complete, delete, includeToday)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import GoalDetailView from './components/GoalDetailView';
import AddNodeModal from './components/AddNodeModal';

// ─── Tree helpers ─────────────────────────────────────────────────────────────

/** Recursively update a node by id in a tree. Returns new tree. */
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

/** Recursively remove a node by id from a tree. Returns new tree. */
function removeNodeFromTree(nodes: GoalNode[], nodeId: string): GoalNode[] {
  return nodes
    .filter(node => node.id !== nodeId)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeNodeFromTree(node.children, nodeId) };
      }
      return node;
    });
}

/** Add a child node to a specific parent (or at root level if parentId is null). */
function addNodeToTree(
  nodes: GoalNode[],
  parentId: string | null,
  newNode: GoalNode
): GoalNode[] {
  if (parentId === null) {
    return [...nodes, newNode];
  }
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
    }
    return node;
  });
}

/** Find a node's title by id for display purposes. */
function findNodeTitle(nodes: GoalNode[], nodeId: string): string | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node.title;
    if (node.children) {
      const found = findNodeTitle(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
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
  const [reducedMotion, setReducedMotion] = useState(false);

  // Modal / view state
  const [ftueCategory, setFtueCategory] = useState<string | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [addNodeTarget, setAddNodeTarget] = useState<{ goalId: string; parentNodeId: string | null } | null>(null);

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

  const handleAddGoal = useCallback(async (goal: Goal) => {
    setFtueCategory(null);
    setAddGoalOpen(false);
    await persist({ ...roadmap, goals: [...roadmap.goals, goal] });
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
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, status: 'deleted', deletedAt: new Date().toISOString() }
          : g
      ),
    });
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

  // ── Node-level handlers (for detail view) ───────────────────────────────────

  const handleToggleComplete = useCallback(async (
    goalId: string,
    nodeId: string,
    completed: boolean
  ) => {
    const now = new Date().toISOString();
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, children: updateNodeInTree(g.children, nodeId, { completed, completedAt: completed ? now : undefined }) }
          : g
      ),
    });
  }, [roadmap, persist]);

  const handleToggleIncludeToday = useCallback(async (
    goalId: string,
    nodeId: string,
    includeToday: boolean
  ) => {
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, children: updateNodeInTree(g.children, nodeId, { includeToday }) }
          : g
      ),
    });
  }, [roadmap, persist]);

  const handleDeleteNode = useCallback(async (goalId: string, nodeId: string) => {
    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, children: removeNodeFromTree(g.children, nodeId) }
          : g
      ),
    });
  }, [roadmap, persist]);

  const handleAddNode = useCallback(async (node: GoalNode) => {
    if (!addNodeTarget) return;
    const { goalId, parentNodeId } = addNodeTarget;
    setAddNodeTarget(null);

    await persist({
      ...roadmap,
      goals: roadmap.goals.map(g =>
        g.id === goalId
          ? { ...g, children: addNodeToTree(g.children, parentNodeId, node) }
          : g
      ),
    });
  }, [roadmap, persist, addNodeTarget]);

  // ── Ask Tim stub ────────────────────────────────────────────────────────────

  const handleAskTim = useCallback(() => {
    showToast.info('AI coaching is coming in Phase 4! For now, pick a category to start.');
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────

  const detailGoal = detailGoalId
    ? roadmap.goals.find(g => g.id === detailGoalId) ?? null
    : null;

  const addNodeGoal = addNodeTarget
    ? roadmap.goals.find(g => g.id === addNodeTarget.goalId) ?? null
    : null;

  const addNodeParentTitle = addNodeTarget?.parentNodeId && addNodeGoal
    ? findNodeTitle(addNodeGoal.children, addNodeTarget.parentNodeId) ?? undefined
    : undefined;

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
          onOpenGoal={setDetailGoalId}
        />
      )}

      {/* Goal Detail View overlay */}
      {detailGoal && (
        <GoalDetailView
          goal={detailGoal}
          reducedMotion={reducedMotion}
          onClose={() => setDetailGoalId(null)}
          onToggleComplete={handleToggleComplete}
          onToggleIncludeToday={handleToggleIncludeToday}
          onDeleteNode={handleDeleteNode}
          onAddNode={(goalId, parentNodeId) => setAddNodeTarget({ goalId, parentNodeId })}
          onEditGoal={(g) => { setDetailGoalId(null); setEditingGoal(g); }}
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

      {/* Add Node modal */}
      {addNodeTarget !== null && addNodeGoal && (
        <AddNodeModal
          goalTitle={addNodeGoal.title}
          parentTitle={addNodeParentTitle}
          onClose={() => setAddNodeTarget(null)}
          onSave={handleAddNode}
        />
      )}
    </>
  );
}
