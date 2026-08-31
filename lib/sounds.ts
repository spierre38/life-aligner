/**
 * lib/sounds.ts
 *
 * Lightweight UI sound effects using Web Audio API.
 * No audio files needed — generates tones programmatically.
 *
 * Usage:
 *   import { playSound } from '@/lib/sounds';
 *   playSound('complete');
 *
 * Sounds are gated behind a user preference in localStorage.
 * Call `setSoundsEnabled(true)` to enable.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Check if sounds are enabled (defaults to true) */
export function isSoundsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const pref = localStorage.getItem('la_sounds_enabled');
  return pref !== 'false'; // default to enabled
}

/** Toggle sounds on/off */
export function setSoundsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('la_sounds_enabled', String(enabled));
}

// ─── Tone helpers ──────────────────────────────────────────────────────────────

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  delay = 0,
) {
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = 0;

  osc.connect(gain);
  gain.connect(c.destination);

  const start = c.currentTime + delay;
  const end = start + duration;

  // Smooth envelope: fade in → sustain → fade out
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.setValueAtTime(volume, end - 0.03);
  gain.gain.linearRampToValueAtTime(0, end);

  osc.start(start);
  osc.stop(end + 0.01);
}

// ─── Sound definitions ─────────────────────────────────────────────────────────

const SOUNDS = {
  /** Task checkbox toggled complete — quick ascending blip */
  complete: () => {
    tone(880, 0.08, 'sine', 0.1);
    tone(1174, 0.1, 'sine', 0.08, 0.06);
  },

  /** Goal completed — celebratory rising chord */
  goalComplete: () => {
    tone(523, 0.15, 'triangle', 0.1);       // C5
    tone(659, 0.15, 'triangle', 0.08, 0.1); // E5
    tone(784, 0.15, 'triangle', 0.08, 0.2); // G5
    tone(1047, 0.2, 'sine', 0.06, 0.3);     // C6
  },

  /** Navigation tap — subtle click */
  tap: () => {
    tone(600, 0.04, 'square', 0.04);
  },

  /** Success action — gentle ding */
  success: () => {
    tone(1047, 0.12, 'sine', 0.08);
  },

  /** Error / warning — low thud */
  error: () => {
    tone(220, 0.15, 'triangle', 0.1);
    tone(196, 0.12, 'triangle', 0.06, 0.08);
  },

  /** Toast notification — soft ping */
  notify: () => {
    tone(880, 0.06, 'sine', 0.06);
    tone(1320, 0.08, 'sine', 0.05, 0.05);
  },

  /** Save / persist action — warm confirmation */
  save: () => {
    tone(659, 0.1, 'sine', 0.07);
    tone(784, 0.12, 'sine', 0.06, 0.08);
  },

  /** Delete / destructive action — descending tone */
  delete: () => {
    tone(587, 0.08, 'triangle', 0.08);
    tone(440, 0.1, 'triangle', 0.06, 0.06);
  },

  /** Onboarding step advance — gentle whoosh */
  advance: () => {
    tone(440, 0.06, 'sine', 0.06);
    tone(587, 0.08, 'sine', 0.05, 0.04);
    tone(784, 0.1, 'sine', 0.04, 0.08);
  },
} as const;

export type SoundName = keyof typeof SOUNDS;

/**
 * Play a named UI sound.
 * No-ops silently if sounds are disabled or AudioContext isn't available.
 */
export function playSound(name: SoundName): void {
  if (!isSoundsEnabled()) return;
  try {
    SOUNDS[name]();
  } catch {
    // Swallow — audio is never worth crashing for
  }
}
