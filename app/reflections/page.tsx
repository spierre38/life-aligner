'use client';

/**
 * /reflections — Life Chapters
 *
 * A vertical timeline of every completed goal, rendered as "Chapters"
 * in the user's life story. Each card shows:
 *   - A mesh gradient cover (unique per index)
 *   - Goal title + duration
 *   - Stats: total reflections written, completion date
 *   - The user's final reflection (if written)
 *   - A link to write more reflections
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import type { Goal, RoadmapData } from '@/lib/roadmap-types';

// Mesh gradient rotation — each chapter gets a distinct aurora color
const CHAPTER_MESHES = [
  'var(--mesh-b1)',  // Purple + Orange
  'var(--mesh-e1)',  // Green + Teal
  'var(--mesh-d1)',  // Blue + Cyan
  'var(--mesh-a1)',  // Magenta + Cyan
  'var(--mesh-b1)',
  'var(--mesh-e1)',
];

function formatDuration(createdAt: string, completedAt?: string): string {
  const start = new Date(createdAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Chapter Card ────────────────────────────────────────────────────────────

function ChapterCard({ goal, index }: { goal: Goal; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const mesh = CHAPTER_MESHES[index % CHAPTER_MESHES.length];
  const reflectionCount = goal.reflections?.length ?? 0;
  const duration = formatDuration(goal.createdAt, goal.completedAt);
  const completedDate = goal.completedAt ? formatDate(goal.completedAt) : null;

  return (
    <article
      className="rounded-3xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}
    >
      {/* Chapter number + mesh gradient header */}
      <div className="relative h-48 md:h-56" style={{ background: mesh }}>
        {/* Chapter number badge */}
        <div
          className="absolute top-5 left-5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          Chapter {index + 1}
        </div>

        {/* Completed badge */}
        {completedDate && (
          <div
            className="absolute top-5 right-5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
          >
            Completed {completedDate}
          </div>
        )}

        {/* Goal title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
          <h2
            className="font-normal text-white leading-tight"
            style={{ fontSize: 'var(--fs-h4)', letterSpacing: '-0.02em' }}
          >
            {goal.title}
          </h2>
          <p className="text-white/55 text-sm mt-1">{duration} journey</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6">
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
        </div>

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
                {[...(goal.reflections ?? [])].reverse().map(r => (
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
                          background: r.mood === 'great' ? 'rgba(0,200,100,0.15)' : r.mood === 'hard' ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.08)',
                          color: r.mood === 'great' ? '#34d399' : r.mood === 'hard' ? '#f87171' : 'rgba(255,255,255,0.5)',
                        }}>
                          {r.mood === 'great' ? '✦ Great' : r.mood === 'hard' ? '⊘ Hard' : '~ Okay'}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{r.text}</p>
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

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const userWithProfile = await getUserWithProfile();
      if (!mounted) return;

      if (!userWithProfile) {
        router.push('/login');
        return;
      }

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
          // Most recently completed first
          const aDate = a.completedAt ?? a.updatedAt;
          const bDate = b.completedAt ?? b.updatedAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

      setChapters(completed);
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [router]);

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
              {/* Stats summary bar */}
              <div
                className="flex gap-8 mb-10 px-6 py-5 rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div>
                  <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>{chapters.length}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Goals completed</div>
                </div>
                <div>
                  <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>
                    {chapters.reduce((sum, g) => sum + (g.reflections?.length ?? 0), 0)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Journal entries</div>
                </div>
                <div>
                  <div className="text-3xl font-light" style={{ color: 'var(--color-text)' }}>
                    {chapters.filter(g => g.finalReflection).length}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Chapters reflected</div>
                </div>
              </div>

              <div className="space-y-8">
                {chapters.map((goal, i) => (
                  <ChapterCard key={goal.id} goal={goal} index={i} />
                ))}
              </div>

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
