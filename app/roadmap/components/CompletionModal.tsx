'use client';

/**
 * CompletionModal.tsx — Goal Completion Celebration
 *
 * Fires when the user marks a goal as complete.
 * Sequence:
 *   1. Full-screen dark overlay with animated celebration pulse
 *   2. Confetti falls from the top
 *   3. Final reflection textarea — "What did you learn from this chapter?"
 *   4. "Save Chapter" CTA → persists the goal and archives it
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal } from '@/lib/roadmap-types';

interface Props {
  goal: Goal;
  onSave: (finalReflection: string) => void;
  onDismiss: () => void;
}

// Simple CSS confetti — no external lib needed
function ConfettiBurst() {
  const COLORS = ['#FF2D99', '#00D4FF', '#7B2FFF', '#00CC6A', '#FF8C00', '#FFFFFF'];
  const pieces = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {pieces.map(i => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const dur = 2 + Math.random() * 1.5;
        const size = 6 + Math.random() * 8;
        const color = COLORS[i % COLORS.length];
        const drift = (Math.random() - 0.5) * 200;
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
  const [showConfetti, setShowConfetti] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Stop confetti after 3s
    const t = setTimeout(() => setShowConfetti(false), 3000);
    // Focus textarea after animation settles
    const f = setTimeout(() => textareaRef.current?.focus(), 600);
    return () => { clearTimeout(t); clearTimeout(f); };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300)); // Micro-delay for feel
    onSave(reflection.trim());
  };

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      >
        <div
          className="w-full max-w-lg rounded-3xl p-8 md:p-10 animate-scale-in"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(255,45,153,0.15)',
          }}
        >
          {/* Celebration header */}
          <div className="text-center mb-8">
            {/* Animated glow ring */}
            <div
              className="relative w-20 h-20 mx-auto mb-5"
              style={{
                animation: 'orb-pulse 2.4s ease-in-out infinite',
                '--orb-glow': 'rgba(0,204,106,0.6)',
              } as React.CSSProperties}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at 40% 40%, rgba(0,204,106,0.5) 0%, transparent 70%), #0d1f14',
                  border: '2px solid rgba(0,204,106,0.4)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                ✦
              </div>
            </div>

            <h2
              className="font-normal mb-2 text-white"
              style={{ fontSize: 'var(--fs-h3)', letterSpacing: '-0.03em' }}
            >
              Chapter Complete
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'var(--fs-body-s)' }}>
              You've accomplished your goal:
            </p>
            <p
              className="mt-1 font-medium text-white"
              style={{ fontSize: 'var(--fs-body-l)', letterSpacing: '-0.02em' }}
            >
              "{goal.title}"
            </p>
          </div>

          {/* Reflection textarea */}
          <div className="mb-6">
            <label
              htmlFor="final-reflection-input"
              className="block text-sm font-medium mb-3"
              style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em' }}
            >
              What did you learn from this chapter?
            </label>
            <textarea
              id="final-reflection-input"
              ref={textareaRef}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="Write a reflection to close this chapter of your life..."
              rows={4}
              className="w-full rounded-2xl p-4 text-white placeholder-white/30 resize-none transition-all focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 'var(--fs-body-s)',
                letterSpacing: '-0.01em',
                lineHeight: '1.7',
              }}
              onFocus={e => {
                (e.target as HTMLTextAreaElement).style.border = '1px solid rgba(255,255,255,0.25)';
              }}
              onBlur={e => {
                (e.target as HTMLTextAreaElement).style.border = '1px solid rgba(255,255,255,0.1)';
              }}
            />
            <p className="text-right mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Optional — you can always write more in Chapters later
            </p>
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
              onClick={() => onSave('')}
              className="px-5 py-3.5 rounded-xl text-sm font-medium transition-all hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)' }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CompletionModal;
