/**
 * app/api/roadmap/ai-coach/route.ts
 *
 * STUB — Phase 0 only.
 *
 * This file establishes the route so Phase 4 only needs to edit rather
 * than create. Right now it:
 *   1. Verifies the caller is authenticated (returns 401 if not)
 *   2. Returns 501 Not Implemented with a JSON body (if authenticated)
 *
 * Phase 4 will replace the 501 block with the real Anthropic call,
 * rate-limiting logic, and profile-hash caching.
 *
 * ── Vercel env var checklist for Phase 4 ────────────────────────────────────
 * Before Phase 4 ships you will need to add ANTHROPIC_API_KEY to Vercel:
 *   1. Go to vercel.com → your project → Settings → Environment Variables
 *   2. Add ANTHROPIC_API_KEY for Production, Preview, and Development
 *   3. Confirm your Anthropic account has billing configured
 *   4. Set a monthly spend alert in the Anthropic dashboard
 * This key must NEVER be added to .env.local or committed to git.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  // Use the server-side Supabase client which reads the session from cookies.
  // This is the same pattern used throughout the rest of the app's API routes.
  const supabase = await createClient();

  // Verify the caller is authenticated.
  // getUser() hits the Supabase auth server to validate the JWT —
  // it's more secure than getSession() which only reads from the cookie.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in and try again.' },
      { status: 401 }
    );
  }

  // ── Phase 4 will replace everything below this line ──────────────────────
  //
  // Expected Phase 4 flow:
  //   1. Parse and validate { goalId, action } from req.json()
  //   2. Read profile → check ai_calls_today against cap (10/day)
  //   3. If reset_at is from yesterday → reset counter to 0
  //   4. If over cap → return 429 with friendly message
  //   5. Read roadmap → find goal by goalId → verify ownership
  //   6. Read user's values, interests, life_categories
  //   7. computeProfileHash() and compare against goal.aiContent.profileHash
  //   8. If cache is fresh and action === 'generate' → return cached content
  //   9. Otherwise → call Claude Haiku, parse, save, increment counter, return
  //
  // See roadmap-overhaul plan (Phase 4) for full prompt structure and
  // rate-limiting details.

  return NextResponse.json(
    { error: 'AI coaching is not yet implemented. Coming in Phase 4.' },
    { status: 501 }
  );
}
