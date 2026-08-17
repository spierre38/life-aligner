'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FrameworkVideo } from '@/lib/videos';
import { WATCH_THRESHOLD, trackVideoEvent } from '@/lib/video-progress';

interface VideoPlayerProps {
  video: FrameworkVideo;
  onClose: () => void;
  onWatched?: (videoId: string) => void;
}

/**
 * Full-screen modal video player.
 *
 * - Fetches a 1-hour signed URL from the server on mount
 * - Uses native HTML5 <video> with controls (same as marketing page)
 * - Tracks playback: fires GA event at start, marks "watched" at 95%
 * - Reports watched status to server via POST /api/videos/signed-url
 */
export default function VideoPlayer({ video, onClose, onWatched }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch signed URL on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchUrl() {
      try {
        const res = await fetch(`/api/videos/signed-url?videoId=${encodeURIComponent(video.id)}`);
        if (!cancelled) {
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: 'Failed to load video' }));
            setError(data.error || 'Failed to load video');
          } else {
            const data = await res.json();
            setSignedUrl(data.signedUrl);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Network error. Check your connection and try again.');
          setLoading(false);
        }
      }
    }

    fetchUrl();
    return () => { cancelled = true; };
  }, [video.id]);

  // Mark video as watched (server + callback)
  const markWatched = useCallback(async () => {
    if (hasCompleted) return;
    setHasCompleted(true);

    trackVideoEvent('video_completed', video.id, video.title);
    onWatched?.(video.id);

    try {
      await fetch('/api/videos/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
    } catch {
      // Silent fail — watch progress is best-effort
    }
  }, [video.id, video.title, hasCompleted, onWatched]);

  // Track playback progress
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || hasCompleted || !el.duration) return;

    if (el.currentTime / el.duration >= WATCH_THRESHOLD) {
      markWatched();
    }
  }, [hasCompleted, markWatched]);

  // Track video start
  const handlePlay = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      trackVideoEvent('video_started', video.id, video.title);
    }
  }, [hasStarted, video.id, video.title]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p
              className="text-xs font-bold tracking-wider uppercase mb-1"
              style={{ color: 'rgba(167,139,250,0.8)' }}
            >
              Video {video.number}
            </p>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              {video.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Close video"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Container */}
        <div
          className="aspect-video rounded-xl md:rounded-2xl overflow-hidden relative"
          style={{
            background: '#0a0a14',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-3 border-white/20 border-t-purple-400 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-4xl mb-4">📡</div>
                <p className="text-white/70 text-sm mb-2">{error}</p>
                <button
                  onClick={onClose}
                  className="text-sm font-medium px-4 py-2 rounded-lg mt-2"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {signedUrl && (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={signedUrl}
              controls
              playsInline
              preload="metadata"
              autoPlay
              onPlay={handlePlay}
              onTimeUpdate={handleTimeUpdate}
              onEnded={markWatched}
              aria-label={video.title}
            />
          )}

          {/* Watched badge */}
          {hasCompleted && (
            <div
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg pointer-events-none"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-xs font-semibold" style={{ color: 'rgba(34,197,94,0.9)' }}>
                ✓ Watched
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-white/50 max-w-2xl">
          {video.description}
        </p>
      </div>
    </div>
  );
}
