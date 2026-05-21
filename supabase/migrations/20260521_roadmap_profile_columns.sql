-- Migration: Add roadmap-related columns to the profiles table
--
-- Phase 0 of the Roadmap Overhaul adds three new columns:
--
--   roadmap_tour_seen  (Phase 6) — tracks whether the user has dismissed
--                                  the coachmark tour on the bubble canvas.
--                                  Defaults to false so first-time visitors
--                                  see the tour automatically.
--
--   ai_calls_today     (Phase 4) — rolling counter of AI coaching calls made
--                                  today. Capped at 10 per user per day.
--                                  Reset to 0 when ai_calls_reset_at is
--                                  from a previous calendar day.
--
--   ai_calls_reset_at  (Phase 4) — timestamp of the last counter reset.
--                                  The API route compares this to "today"
--                                  to decide whether to zero the counter.
--
-- RLS: the existing "Users can update own profile" policy already covers
-- these columns — no new policies are needed.
--
-- Safety: ADD COLUMN IF NOT EXISTS makes this safe to re-run (e.g. if the
-- migration is applied to multiple environments out of order).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS roadmap_tour_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_calls_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_calls_reset_at timestamptz NOT NULL DEFAULT now();
