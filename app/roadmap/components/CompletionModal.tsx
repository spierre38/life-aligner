'use client';

/**
 * CompletionModal.tsx — Goal Completion Celebration v2
 *
 * Fires when the user marks a goal as complete.
 * Sequence:
 *   1. Full-screen dark overlay with animated celebration pulse + confetti
 *   2. Final reflection textarea — "What did you learn from this chapter?"
 *   3. Chapter quote — one memorable sentence for the card cover
 *   4. Cover photo — optional image for the chapter card
 *   5. "Save Chapter" CTA → persists the goal and archives it
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal } from '@/lib/roadmap-types';

export interface CompletionData {
  finalReflection: string;
  chapterQuote?: string;
  coverFile?: File;
}

interface Props {
  goal: Goal;
  onSave: (data: CompletionData) => void;
  onDismiss: () => void;
}

// Simple CSS confetti — no external lib needed
function ConfettiBurst() {
  const COLORS = ['#FF2D99', '#00D4FF', '#7B2FFF', '#00CC6A', '#FF8C00', '#FFFFFF'];
  const pieces = Array.from({ length: 48 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {pieces.map(i => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.8;
        const dur = 2 + Math.random() * 2;
        const size = 5 + Math.random() * 9;
        const color = COLORS[i % COLORS.length];
        const drift = (Math.random() - 0.5) * 240;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confetti-fall ${dur}s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s forwards`,
              '--drift': `${drift}px`,
              opacity: 0.9,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

export function CompletionModal({ goal, onSave, onDismiss }: Props) {
  const [reflection, setReflection] = useState('');
  const [chapterQuote, setChapterQuote] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState<'reflection' | 'quote' | 'cover'>('reflection');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500);
    const f = setTimeout(() => textareaRef.current?.focus(), 700);
    return () => { clearTimeout(t); clearTimeout(f); };
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave({
      finalReflection: reflection.trim(),
      chapterQuote: chapterQuote.trim() || undefined,
      coverFile: coverFile ?? undefined,
    });
  };

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <div
          className="w-full max-w-lg rounded-3xl overflow-hidden modal-spring-in"
          style={{
            background: '#0e0e0e',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 48px 140px rgba(0,0,0,0.9), 0 0 100px rgba(0,204,106,0.12)',
          }}
        >
          {/* Cover photo strip — shows when image selected */}
          {coverPreview && (
            <div
              className="relative h-32 overflow-hidden"
              style={{ background: `url(${coverPreview}) center/cover no-repeat` }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(14,14,14,0.95))' }}
              />
              <button
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition hover:bg-white/30"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="p-8 md:p-10">
            {/* Celebration header */}
            <div className="text-center mb-8">
              <div
                className="relative w-20 h-20 mx-auto mb-5"
                style={{ animation: 'orb-pulse 2.4s ease-in-out infinite', '--orb-glow': 'rgba(0,204,106,0.6)' } as React.CSSProperties}
              >
                {/* Supernova rings */}
                <div className="nova-ring" style={{ inset: '-30px', borderColor: 'rgba(0,204,106,0.7)' }} />
                <div className="nova-ring-2" style={{ inset: '-30px', borderColor: 'rgba(167,139,250,0.5)' }} />
                {/* Gold particles radiating out */}
                {Array.from({ length: 8 }, (_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const dist = 50 + Math.random() * 20;
                  return (
                    <div
                      key={i}
                      className="nova-particle"
                      style={{
                        '--tx': `${Math.cos(angle) * dist}px`,
                        '--ty': `${Math.sin(angle) * dist}px`,
                        animationDelay: `${i * 0.06}s`,
                        background: i % 2 === 0 ? '#fbbf24' : '#a78bfa',
                      } as React.CSSProperties}
                    />
                  );
                })}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(ellipse at 40% 40%, rgba(0,204,106,0.5) 0%, transparent 70%), #0d1f14',
                    border: '2px solid rgba(0,204,106,0.4)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">✦</div>
              </div>

              <h2
                className="font-normal mb-2 text-white"
                style={{ fontSize: 'var(--fs-h3)', letterSpacing: '-0.03em' }}
              >
                Chapter Complete
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'var(--fs-body-s)' }}>
                You've accomplished your goal:
              </p>
              <p
                className="mt-1.5 font-medium text-white"
                style={{ fontSize: 'var(--fs-body-l)', letterSpacing: '-0.02em' }}
              >
                "{goal.title}"
              </p>
            </div>

            {/* ── Field 1: Final reflection ───────────────────────────────── */}
            <div className="mb-5">
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                What did you learn from this chapter?
              </label>
              <textarea
                id="final-reflection-input"
                ref={textareaRef}
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="Write a reflection to close this chapter of your life..."
                rows={3}
                className="w-full rounded-2xl p-4 text-white placeholder-white/25 resize-none transition-all focus:outline-none"
                style={{
                  background: activeField === 'reflection' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: activeField === 'reflection' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  fontSize: 'var(--fs-body-s)',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.7',
                }}
                onFocus={() => setActiveField('reflection')}
                onBlur={() => setActiveField('quote')}
              />
            </div>

            {/* ── Field 2: Chapter quote ──────────────────────────────────── */}
            <div className="mb-5">
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Chapter quote
                <span className="ml-2 normal-case font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  — one sentence that captures this chapter
                </span>
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-3.5 select-none"
                  style={{ color: 'rgba(255,255,255,0.2)', fontSize: 'var(--fs-body-s)' }}
                >
                  "
                </span>
                <input
                  id="chapter-quote-input"
                  type="text"
                  value={chapterQuote}
                  onChange={e => setChapterQuote(e.target.value.slice(0, 120))}
                  placeholder="e.g. I learned that consistency beats motivation."
                  className="w-full rounded-xl pl-7 pr-4 py-3 text-white placeholder-white/20 transition-all focus:outline-none"
                  style={{
                    background: activeField === 'quote' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: activeField === 'quote' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                    fontSize: 'var(--fs-body-s)',
                    letterSpacing: '-0.01em',
                  }}
                  onFocus={() => setActiveField('quote')}
                  onBlur={() => setActiveField('cover')}
                />
              </div>
              {chapterQuote.length > 100 && (
                <p className="text-right mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {120 - chapterQuote.length} chars left
                </p>
              )}
            </div>

            {/* ── Field 3: Cover photo ────────────────────────────────────── */}
            <div className="mb-7">
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Cover photo
                <span className="ml-2 normal-case font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  — optional, appears on your chapter card
                </span>
              </label>
              {coverPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg overflow-hidden">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{coverFile?.name}</span>
                  <label
                    className="ml-auto text-xs font-medium cursor-pointer transition hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Change
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
                  </label>
                </div>
              ) : (
                <label
                  className="flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                  style={{ border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Upload a photo for this chapter's cover</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                id="save-chapter-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#FFFFFF', color: '#000', letterSpacing: '-0.01em' }}
              >
                {saving ? 'Saving Chapter…' : 'Save Chapter ✦'}
              </button>
              <button
                id="skip-reflection-btn"
                onClick={() => onSave({ finalReflection: '' })}
                className="px-5 py-3.5 rounded-xl text-sm font-medium transition-all hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}
              >
                Skip
              </button>
            </div>

            <p className="text-center mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              All fields are optional — you can edit them from your Chapters page
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CompletionModal;
