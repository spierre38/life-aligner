'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AuthNavbar from '@/app/components/AuthNavbar';
import VideoPlayer from '@/app/components/VideoPlayer';
import { VIDEO_CATALOG, getCategoryLabel, type FrameworkVideo } from '@/lib/videos';
import {
  getVideoStatuses,
  getVideoStats,
  parseVideoProgress,
  trackVideoEvent,
  type VideoStatus,
  type RoadmapState,
} from '@/lib/video-progress';
import { evaluateLifeFrameCompletion, type LifeFrameCompletion } from '@/lib/lifeframe-completion';
import { supabase } from '@/lib/supabase';

// â”€â”€â”€ Category filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type CategoryFilter = 'all' | 'intro' | 'lifeframe' | 'roadmap' | 'bonus';

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All Videos' },
  { value: 'intro', label: 'Introduction' },
  { value: 'lifeframe', label: 'LifeFrame' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'bonus', label: 'Bonus' },
];

// â”€â”€â”€ Unlock criteria â†’ page link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getUnlockLink(video: FrameworkVideo): string {
  const c = video.unlockCriteria;
  switch (c.type) {
    case 'signup': return '/dashboard';
    case 'watched': return '/resources';
    case 'worksheet_complete':
      return c.worksheet === 'values' ? '/workbook/values'
        : c.worksheet === 'interests' ? '/workbook/interests'
        : '/workbook/life-categories';
    case 'milestone':
      return c.milestone === 'lifeframe_complete' ? '/workbook/lifeframe'
        : '/roadmap';
    default: return '/dashboard';
  }
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ResourcesPage() {
  const [statuses, setStatuses] = useState<VideoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<FrameworkVideo | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  // Load user state and compute video statuses
  const loadStatuses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Fetch workbook entries + profile in parallel
    const [entriesRes, profileRes, roadmapRes] = await Promise.all([
      supabase
        .from('workbook_entries')
        .select('category, content')
        .eq('user_id', user.id)
        .in('category', ['values', 'interests', 'life_categories']),
      supabase
        .from('profiles')
        .select('video_progress')
        .eq('id', user.id)
        .single(),
      supabase
        .from('workbook_entries')
        .select('content')
        .eq('user_id', user.id)
        .eq('category', 'roadmap')
        .single(),
    ]);

    // Evaluate LifeFrame completion
    let completion: LifeFrameCompletion | null = null;
    if (entriesRes.data) {
      const entries = entriesRes.data.map(e => ({
        category: e.category as string,
        content: e.content,
      }));
      completion = evaluateLifeFrameCompletion(entries);
    }

    // Extract roadmap state
    const roadmapContent = roadmapRes.data?.content as Record<string, unknown> | undefined;
    const goals = Array.isArray(roadmapContent?.goals) ? roadmapContent.goals : [];
    const activities = Array.isArray(roadmapContent?.activities) ? roadmapContent.activities : [];
    const roadmap: RoadmapState = {
      goalCount: goals.length,
      activityCount: activities.length,
      completedTodoCount: activities.filter((a: Record<string, unknown>) => a?.completed === true).length,
    };

    // Parse video progress
    const progress = parseVideoProgress(profileRes.data?.video_progress);

    // Compute statuses
    const computed = getVideoStatuses(completion, roadmap, progress);
    setStatuses(computed);
    setLoading(false);
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // Handle video watched callback â€” update local state immediately
  const handleVideoWatched = useCallback((videoId: string) => {
    setStatuses(prev => prev.map(s =>
      s.video.id === videoId ? { ...s, watched: true } : s
    ));
  }, []);

  // Filtered statuses
  const filtered = filter === 'all'
    ? statuses
    : statuses.filter(s => s.video.category === filter);

  const stats = getVideoStats(statuses);

  return (
    <>
      <AuthNavbar />
      <div
        className="min-h-screen pt-16"
        style={{
          background: 'var(--mesh-canvas, #050505)',
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 5%, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />

        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative">
          {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="text-center mb-8 sm:mb-12">
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ color: 'rgba(167,139,250,0.8)' }}
            >
              Video Library
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-light mb-3"
              style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}
            >
              Tim Collins Framework
            </h1>
            <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {stats.availableCount} videos available Â· {stats.watchedCount} watched
            </p>

            {/* Progress bar */}
            {stats.availableCount > 0 && (
              <div className="mt-6 max-w-xs mx-auto">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-dim)' }}>
                  <span>Progress</span>
                  <span>{stats.watchedCount}/{stats.availableCount}</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.watchProgress}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* â”€â”€ Category Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: filter === f.value ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  color: filter === f.value ? 'rgba(167,139,250,0.95)' : 'var(--color-text-muted)',
                  border: `1px solid ${filter === f.value ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* â”€â”€ Video Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-white/10 border-t-purple-400 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(status => (
                <VideoCard
                  key={status.video.id}
                  status={status}
                  onPlay={() => {
                    setActiveVideo(status.video);
                    trackVideoEvent('video_started', status.video.id, status.video.title);
                  }}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <p className="text-center py-16 text-sm" style={{ color: 'var(--color-text-dim)' }}>
              No videos in this category yet.
            </p>
          )}

          {/* â”€â”€ Downloads Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <section className="mt-16 mb-8">
            <h2
              className="text-xl font-semibold mb-6 flex items-center gap-3"
              style={{ color: 'var(--color-text)' }}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              >ðŸ“¥</span>
              Downloads
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'The Tim Collins Framework', desc: 'Complete book (PDF)', icon: 'ðŸ“–', href: '/downloads/lifealigner-book.pdf', available: true },
                { title: 'Printable Workbook', desc: 'Physical worksheets for offline use', icon: 'ðŸ“', href: '/downloads/lifealigner-workbook.pdf', available: true },
              ].map(dl => (
                <a
                  key={dl.title}
                  href={dl.available ? dl.href : undefined}
                  download={dl.available}
                  className="rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    opacity: dl.available ? 1 : 0.5,
                    cursor: dl.available ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span className="text-2xl">{dl.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{dl.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{dl.desc}</p>
                  </div>
                  {dl.available && (
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(167,139,250,0.7)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </section>

          {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div
            className="rounded-2xl p-8 sm:p-12 text-center mt-8"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.06) 100%)',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Ready to Continue?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Get back to building your path to contentment
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/workbook/lifeframe"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  color: 'rgba(167,139,250,0.95)',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                ðŸ“‹ View LifeFrame
              </Link>
              <Link
                href="/roadmap"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                ðŸ—ºï¸ Open Roadmap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Video Player Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onWatched={handleVideoWatched}
        />
      )}
    </>
  );
}

// â”€â”€â”€ Video Card Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function VideoCard({ status, onPlay }: { status: VideoStatus; onPlay: () => void }) {
  const { video, unlocked, watched, available } = status;

  // Three states: playable, locked, coming soon
  const isPlayable = unlocked && available;
  const isLocked = !unlocked && available;
  const isComingSoon = !available;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 group"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isPlayable ? 'var(--color-border)' : 'rgba(255,255,255,0.04)'}`,
        opacity: isComingSoon ? 0.45 : isLocked ? 0.7 : 1,
      }}
    >
      {/* Thumbnail area */}
      <div
        className="relative aspect-video flex items-center justify-center cursor-pointer"
        style={{
          background: isPlayable
            ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(30,10,60,0.85) 100%)'
            : 'linear-gradient(135deg, rgba(50,50,70,0.3) 0%, rgba(15,15,25,0.9) 100%)',
          borderBottom: '1px solid var(--color-border)',
        }}
        onClick={isPlayable ? onPlay : undefined}
      >
        {/* Play button or Lock */}
        {isPlayable ? (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
            style={{
              background: 'rgba(139,92,246,0.2)',
              border: '2px solid rgba(167,139,250,0.4)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <svg className="w-6 h-6 ml-0.5" fill="white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : isLocked ? (
          <div className="text-center px-6">
            <div className="text-3xl mb-2">ðŸ”’</div>
            <p className="text-xs font-medium" style={{ color: 'rgba(167,139,250,0.7)' }}>
              {video.unlockHint}
            </p>
            <Link
              href={getUnlockLink(video)}
              className="inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'rgba(139,92,246,0.12)',
                color: 'rgba(167,139,250,0.9)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              Go there â†’
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl mb-2">ðŸŽ¬</div>
            <div
              className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--color-text-dim)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Coming Soon
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--color-text-dim)' }}
        >
          {video.duration}
        </div>

        {/* Watched badge */}
        {watched && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold"
            style={{
              background: 'rgba(34,197,94,0.15)',
              color: 'rgba(34,197,94,0.9)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            âœ“ Watched
          </div>
        )}

        {/* Video number */}
        <div
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isPlayable ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
            color: isPlayable ? 'rgba(167,139,250,0.9)' : 'var(--color-text-dim)',
            border: `1px solid ${isPlayable ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {video.number}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="text-sm font-semibold leading-snug"
            style={{ color: isPlayable ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          >
            {video.title}
          </h3>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {video.description}
        </p>
        <div className="mt-2">
          <span
            className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--color-text-dim)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {getCategoryLabel(video.category)}
          </span>
        </div>
      </div>
    </div>
  );
}
