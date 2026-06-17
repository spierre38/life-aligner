'use client';

/**
 * /reflections — Life Chapters (Premium)
 *
 * A vertical timeline of every completed goal, rendered as "Chapters"
 * in the user's life story. Each card shows:
 *   - Custom cover photo or mesh gradient
 *   - Chapter quote (user-defined)
 *   - Mood timeline visualization
 *   - Image gallery in journal entries
 *   - Year group headers
 *   - Enhanced stats
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { uploadReflectionImage } from '@/lib/reflection-images';
import type { Goal, Reflection, RoadmapData } from '@/lib/roadmap-types';

// Mesh gradient rotation — each chapter gets a distinct aurora color
const CHAPTER_MESHES = [
  'var(--mesh-b1)',  // Purple + Orange
  'var(--mesh-e1)',  // Green + Teal
  'var(--mesh-d1)',  // Blue + Cyan
  'var(--mesh-a1)',  // Magenta + Cyan
];

function formatDuration(createdAt: string, completedAt?: string): string {
  const start = new Date(createdAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
  return `${(days / 365).toFixed(1)} years`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

// ─── Mood Timeline ───────────────────────────────────────────────────────────

const MOOD_COLORS: Record<string, string> = {
  great: '#34d399',
  okay:  '#fbbf24',
  hard:  '#f87171',
};

function MoodTimeline({ reflections }: { reflections: Reflection[] }) {
  const withMood = reflections.filter(r => r.mood);
  if (withMood.length < 2) return null;

  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>
        Mood Journey
      </p>
      <div className="flex items-end gap-1 h-8">
        {withMood.map((r, i) => {
          const height = r.mood === 'great' ? '100%' : r.mood === 'okay' ? '60%' : '30%';
          return (
            <div
              key={r.id}
              className="flex-1 rounded-full transition-all duration-300 hover:opacity-80"
              style={{
                height,
                background: MOOD_COLORS[r.mood!],
                opacity: 0.7,
                minWidth: 4,
                maxWidth: 12,
                animationDelay: `${i * 50}ms`,
              }}
              title={`${formatDate(r.date)} — ${r.mood}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px]" style={{ color: 'var(--color-text-dim)' }}>Start</span>
        <span className="text-[9px]" style={{ color: 'var(--color-text-dim)' }}>End</span>
      </div>
    </div>
  );
}

// ─── Image Gallery ───────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(url)}
            className="flex-shrink-0 rounded-xl overflow-hidden transition-transform hover:scale-105"
            style={{ width: 80, height: 80 }}
          >
            <img
              src={url}
              alt={`Reflection image ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Reflection image expanded"
            className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl w-10 h-10 rounded-full flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

// ─── Chapter Card ────────────────────────────────────────────────────────────

interface ChapterCardProps {
  goal: Goal;
  index: number;
  userId: string | null;
  onUpdateChapter: (goalId: string, updates: { chapterQuote?: string; coverImageUrl?: string }) => Promise<void>;
}

function ChapterCard({ goal, index, userId, onUpdateChapter }: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQuote, setEditQuote] = useState(goal.chapterQuote ?? '');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(goal.coverImageUrl ?? null);
  const [saving, setSaving] = useState(false);

  const mesh = CHAPTER_MESHES[index % CHAPTER_MESHES.length];
  const reflections = goal.reflections ?? [];
  const reflectionCount = reflections.length;
  const duration = formatDuration(goal.createdAt, goal.completedAt);
  const completedDate = goal.completedAt ? formatDate(goal.completedAt) : null;
  const hasCover = !!editCoverPreview;

  const handleSaveEdit = async () => {
    setSaving(true);
    let coverImageUrl: string | undefined = goal.coverImageUrl;
    if (editCoverFile && userId) {
      try {
        coverImageUrl = await uploadReflectionImage(editCoverFile, userId, 'covers', goal.id) ?? goal.coverImageUrl;
      } catch (e) {
        console.warn('[chapter-edit] Cover upload failed:', e);
      }
    }
    await onUpdateChapter(goal.id, {
      chapterQuote: editQuote.trim() || undefined,
      coverImageUrl,
    });
    setSaving(false);
    setEditing(false);
    setEditCoverFile(null);
  };

  return (
    <article
      className="rounded-3xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Chapter cover — custom image or mesh gradient */}
      <div
        className="relative h-48 md:h-56 group"
        style={{
          background: hasCover ? `url(${editCoverPreview}) center/cover no-repeat` : mesh,
        }}
      >
        {/* Dark overlay for text readability on both cover types */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)' }}
        />

        {/* Chapter number badge */}
        <div
          className="absolute top-5 left-5 text-xs font-semibold px-3 py-1.5 rounded-full z-10"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          Chapter {index + 1}
        </div>

        {/* Completed badge */}
        {completedDate && (
          <div
            className="absolute top-5 right-5 text-xs font-medium px-3 py-1.5 rounded-full z-10"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
          >
            Completed {completedDate}
          </div>
        )}

        {/* Edit button — appears on hover */}
        <button
          onClick={() => setEditing(e => !e)}
          className="absolute bottom-5 right-5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit chapter
        </button>

        {/* Goal title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h2
            className="font-normal text-white leading-tight"
            style={{ fontSize: 'var(--fs-h4)', letterSpacing: '-0.02em' }}
          >
            {goal.title}
          </h2>
          <p className="text-white/55 text-sm mt-1">{duration} journey</p>
        </div>
      </div>

      {/* Inline edit panel */}
      {editing && (
        <div
          className="px-6 py-5 border-b"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-dim)' }}>
            Edit Chapter
          </p>

          {/* Quote */}
          <div className="mb-4">
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Chapter quote</label>
            <input
              type="text"
              value={editQuote}
              onChange={e => setEditQuote(e.target.value.slice(0, 120))}
              placeholder="One sentence that captures this chapter..."
              className="w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Cover photo */}
          <div className="mb-4">
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Cover photo</label>
            {editCoverPreview ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={editCoverPreview} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <label
                    className="text-xs cursor-pointer px-3 py-1.5 rounded-lg transition hover:opacity-80"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { setEditCoverFile(f); setEditCoverPreview(URL.createObjectURL(f)); }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => { setEditCoverFile(null); setEditCoverPreview(null); }}
                    className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                className="flex items-center gap-2 p-3 rounded-xl cursor-pointer transition hover:opacity-80"
                style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-dim)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Upload a cover photo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setEditCoverFile(f); setEditCoverPreview(URL.createObjectURL(f)); }
                  }}
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditQuote(goal.chapterQuote ?? ''); setEditCoverPreview(goal.coverImageUrl ?? null); setEditCoverFile(null); }}
              className="px-4 py-2 rounded-xl text-xs font-medium transition hover:opacity-70"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className="p-6">
        {/* Chapter quote */}
        {(goal.chapterQuote || editQuote) && !editing && (
          <div className="mb-5 pl-4" style={{ borderLeft: '3px solid var(--color-text-dim)' }}>
            <p
              className="text-lg italic leading-relaxed"
              style={{ color: 'var(--color-text-muted)', letterSpacing: '-0.01em' }}
            >
              "{goal.chapterQuote}"
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-6 mb-5">
          <div>
            <div className="text-2xl font-light" style={{ color: 'var(--color-text)' }}>{reflectionCount}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Reflections</div>
          </div>
          {goal.connectedCategories?.length > 0 && (
            <div>
              <div className="text-2xl font-light" style={{ color: 'var(--color-text)' }}>{goal.connectedCategories.length}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Life Areas</div>
            </div>
          )}
          {reflections.filter(r => r.images?.length).length > 0 && (
            <div>
              <div className="text-2xl font-light" style={{ color: 'var(--color-text)' }}>
                {reflections.reduce((sum, r) => sum + (r.images?.length ?? 0), 0)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Photos</div>
            </div>
          )}
        </div>

        {/* Mood timeline */}
        <MoodTimeline reflections={reflections} />

        {/* Final reflection */}
        {goal.finalReflection && (
          <blockquote
            className="mb-5 p-4 rounded-2xl"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-text-dim)' }}
          >
            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-text-muted)' }}>
              "{goal.finalReflection}"
            </p>
          </blockquote>
        )}

        {/* Recent journal entries (expandable) */}
        {reflectionCount > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium transition-all"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {expanded ? 'Hide' : 'Read'} {reflectionCount} journal {reflectionCount === 1 ? 'entry' : 'entries'}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {[...reflections].reverse().map(r => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl text-sm"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                        {formatDate(r.date)}
                      </span>
                      {r.mood && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: r.mood === 'great' ? 'rgba(0,200,100,0.15)' : r.mood === 'hard' ? 'rgba(255,80,80,0.15)' : 'rgba(255,200,0,0.15)',
                          color: MOOD_COLORS[r.mood],
                        }}>
                          {r.mood === 'great' ? '✦ Great' : r.mood === 'hard' ? '⊘ Hard' : '~ Okay'}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{r.text}</p>
                    {r.images && <ImageGallery images={r.images} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connected categories */}
        {goal.connectedCategories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goal.connectedCategories.map(cat => (
              <span
                key={cat}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReflectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<Goal[]>([]);
  const [activeSince, setActiveSince] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const userWithProfile = await getUserWithProfile();
      if (!mounted) return;

      if (!userWithProfile) {
        router.push('/login');
        return;
      }

      setUserId(userWithProfile.user.id);

      const { data } = await supabase
        .from('workbook_entries')
        .select('content')
        .eq('user_id', userWithProfile.user.id)
        .eq('category', 'roadmap')
        .maybeSingle();

      if (!mounted) return;

      const roadmap = data?.content as RoadmapData | undefined;
      const completed = (roadmap?.goals ?? [])
        .filter(g => g.status === 'completed')
        .sort((a, b) => {
          const aDate = a.completedAt ?? a.updatedAt;
          const bDate = b.completedAt ?? b.updatedAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

      // Find earliest goal creation date
      const allGoals = roadmap?.goals ?? [];
      if (allGoals.length > 0) {
        const earliest = allGoals.reduce((min, g) =>
          new Date(g.createdAt) < new Date(min) ? g.createdAt : min,
          allGoals[0].createdAt
        );
        setActiveSince(earliest);
      }

      if (roadmap) setRoadmapData(roadmap);
      setChapters(completed);
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [router]);

  // Group chapters by year
  const groupedByYear = useMemo(() => {
    const groups: Record<string, Goal[]> = {};
    for (const ch of chapters) {
      const year = ch.completedAt ? formatYear(ch.completedAt) : formatYear(ch.updatedAt);
      if (!groups[year]) groups[year] = [];
      groups[year].push(ch);
    }
    // Sort years descending
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [chapters]);

  /** Persist quote/cover edits made directly on the Chapters page */
  const handleUpdateChapter = useCallback(async (
    goalId: string,
    updates: { chapterQuote?: string; coverImageUrl?: string }
  ) => {
    if (!userId || !roadmapData) return;
    const updatedRoadmap: RoadmapData = {
      ...roadmapData,
      goals: roadmapData.goals.map(g =>
        g.id === goalId ? { ...g, ...updates } : g
      ),
    };
    await supabase
      .from('workbook_entries')
      .upsert(
        { user_id: userId, category: 'roadmap', content: updatedRoadmap },
        { onConflict: 'user_id,category' }
      );
    setRoadmapData(updatedRoadmap);
    setChapters(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  }, [userId, roadmapData]);

  // Enhanced stats
  const totalReflections = chapters.reduce((sum, g) => sum + (g.reflections?.length ?? 0), 0);
  const totalPhotos = chapters.reduce((sum, g) =>
    sum + (g.reflections ?? []).reduce((s, r) => s + (r.images?.length ?? 0), 0), 0);
  const longestChapter = chapters.length > 0
    ? chapters.reduce((longest, g) => {
        const days = Math.round(
          (new Date(g.completedAt ?? g.updatedAt).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return days > longest.days ? { title: g.title, days } : longest;
      }, { title: '', days: 0 })
    : null;

  return (
    <>
      <AuthNavbar />
      <div className="min-h-screen pt-16" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">

          {/* Page header */}
          <div className="mb-12 md:mb-16">
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-dim)' }}>
              Your story, chapter by chapter
            </p>
            <h1
              className="font-normal mb-4"
              style={{ fontSize: 'var(--fs-h2)', letterSpacing: '-0.04em', color: 'var(--color-text)' }}
            >
              Life Chapters
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-m)', maxWidth: '480px', lineHeight: '1.7' }}>
              Every completed goal becomes a chapter in your story. Revisit your journey,
              read what you've learned, and see how far you've come.
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="h-80 rounded-3xl animate-pulse"
                  style={{ background: 'var(--color-surface)' }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && chapters.length === 0 && (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--mesh-a1)' }}
              >
                ✦
              </div>
              <h2
                className="font-normal mb-3"
                style={{ fontSize: 'var(--fs-h4)', letterSpacing: '-0.02em', color: 'var(--color-text)' }}
              >
                Your first chapter awaits
              </h2>
              <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-s)', lineHeight: '1.7' }}>
                When you complete a goal on your Roadmap, it becomes a chapter here —
                a permanent record of what you've accomplished.
              </p>
              <Link
                href="/roadmap"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
              >
                Go to Roadmap →
              </Link>
            </div>
          )}

          {/* Chapter timeline */}
          {!loading && chapters.length > 0 && (
            <>
              {/* Enhanced stats summary bar */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 px-6 py-5 rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div>
                  <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>{chapters.length}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Chapters</div>
                </div>
                <div>
                  <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>{totalReflections}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Journal entries</div>
                </div>
                {totalPhotos > 0 && (
                  <div>
                    <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>{totalPhotos}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Photos</div>
                  </div>
                )}
                {activeSince && (
                  <div>
                    <div className="text-sm font-medium mt-1" style={{ color: 'var(--color-text)' }}>
                      {formatDate(activeSince)}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Active since</div>
                  </div>
                )}
              </div>

              {/* Longest chapter callout */}
              {longestChapter && longestChapter.days > 0 && (
                <div
                  className="mb-8 px-5 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <span className="text-lg">🏆</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Longest chapter: <strong style={{ color: 'var(--color-text)' }}>{longestChapter.title}</strong> — {longestChapter.days < 7 ? `${longestChapter.days} days` : longestChapter.days < 30 ? `${Math.round(longestChapter.days / 7)} weeks` : longestChapter.days < 365 ? `${Math.round(longestChapter.days / 30)} months` : `${(longestChapter.days / 365).toFixed(1)} years`}
                  </span>
                </div>
              )}

              {/* Year-grouped chapters */}
              {groupedByYear.map(([year, goals]) => (
                <div key={year} className="mb-10">
                  {/* Year header */}
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className="text-sm font-semibold px-3 py-1 rounded-full"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                    >
                      {year}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {goals.length} {goals.length === 1 ? 'chapter' : 'chapters'}
                    </span>
                  </div>

                  <div className="space-y-8">
                    {goals.map((goal, i) => {
                      // Calculate global index for mesh gradient rotation
                      const globalIdx = chapters.indexOf(goal);
                      return (
                        <ChapterCard
                          key={goal.id}
                          goal={goal}
                          index={globalIdx >= 0 ? globalIdx : i}
                          userId={userId}
                          onUpdateChapter={handleUpdateChapter}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="text-center mt-12">
                <Link
                  href="/roadmap"
                  className="text-sm font-medium transition-all hover:opacity-80"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  ← Back to Roadmap
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
