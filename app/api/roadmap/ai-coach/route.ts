/**
 * app/api/roadmap/ai-coach/route.ts — Phase 4
 *
 * AI coaching endpoint. Reads the user's full LifeFrame profile
 * (values, interests, categories) plus the specific goal, then
 * generates personalized coaching via Google Gemini.
 *
 * Features:
 *   - Profile-hash caching: if the user's profile hasn't changed since
 *     the last generation, return the cached content (skip API call)
 *   - Rate limiting: 10 AI calls per user per day (uses profile columns)
 *   - Graceful degradation: if GEMINI_API_KEY is missing, returns 503
 *     with a helpful message instead of crashing
 *
 * Request body: { goalId: string, forceRefresh?: boolean }
 * Response: { coaching: Goal['aiContent'] } or { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeProfileHash, type ProfileSnapshot } from '@/lib/profile-hash';

const DAILY_CAP = 10;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // ── API key check ───────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI coaching is not configured yet. Add GEMINI_API_KEY to your environment.' },
      { status: 503 }
    );
  }

  // ── Parse request ───────────────────────────────────────────────────────────
  let goalId: string;
  let forceRefresh = false;
  try {
    const body = await req.json();
    goalId = body.goalId;
    forceRefresh = body.forceRefresh === true;
    if (!goalId || typeof goalId !== 'string') throw new Error('Missing goalId');
  } catch {
    return NextResponse.json({ error: 'Invalid request. Send { goalId: string }.' }, { status: 400 });
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('ai_calls_today, ai_calls_reset_at')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const resetDay = profile.ai_calls_reset_at
    ? new Date(profile.ai_calls_reset_at).toISOString().slice(0, 10)
    : '';

  let callsToday = profile.ai_calls_today ?? 0;
  if (resetDay !== today) {
    callsToday = 0;
    await supabase
      .from('profiles')
      .update({ ai_calls_today: 0, ai_calls_reset_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  if (callsToday >= DAILY_CAP) {
    return NextResponse.json(
      { error: `You've reached your daily limit of ${DAILY_CAP} AI coaching calls. Try again tomorrow!` },
      { status: 429 }
    );
  }

  // ── Load workbook data ──────────────────────────────────────────────────────
  const { data: worksheets, error: wsError } = await supabase
    .from('workbook_entries')
    .select('category, content')
    .eq('user_id', user.id);

  if (wsError || !worksheets) {
    return NextResponse.json({ error: 'Could not load your LifeFrame data.' }, { status: 500 });
  }

  const valRow = worksheets.find(w => w.category === 'values');
  const intRow = worksheets.find(w => w.category === 'interests');
  const catRow = worksheets.find(w => w.category === 'life_categories');

  const snapshot: ProfileSnapshot = {
    values: (valRow?.content as any)?.selected_values ?? [],
    interests: {
      existing: (intRow?.content as any)?.existing ?? [],
      exploring: (intRow?.content as any)?.exploring ?? [],
    },
    life_categories: (catRow?.content as any)?.categories ?? [],
  };

  const profileHash = await computeProfileHash(snapshot);

  // ── Load roadmap & find goal ────────────────────────────────────────────────
  const { data: roadmapRow, error: rmError } = await supabase
    .from('workbook_entries')
    .select('content')
    .eq('user_id', user.id)
    .eq('category', 'roadmap')
    .single();

  if (rmError || !roadmapRow) {
    return NextResponse.json({ error: 'Could not load your roadmap.' }, { status: 500 });
  }

  const roadmapContent = roadmapRow.content as any;
  const goals = roadmapContent?.goals ?? [];
  const goal = goals.find((g: any) => g.id === goalId);

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
  }

  // ── Cache check ─────────────────────────────────────────────────────────────
  if (!forceRefresh && goal.aiContent?.profileHash === profileHash && goal.aiContent?.whyItHelps) {
    return NextResponse.json({ coaching: goal.aiContent, cached: true });
  }

  // ── Build prompt ────────────────────────────────────────────────────────────
  const valueNames = ((valRow?.content as any)?.selected_values ?? [])
    .map((v: any) => v?.name).filter(Boolean).join(', ');
  const existingInterests = ((intRow?.content as any)?.existing ?? []).join(', ');
  const exploringInterests = ((intRow?.content as any)?.exploring ?? []).join(', ');
  const categoryNames = ((catRow?.content as any)?.categories ?? [])
    .map((c: any) => typeof c === 'string' ? c : c?.name).filter(Boolean).join(', ');

  const prompt = `You are Tim, a warm, insightful life coach inside the Life Aligner app. A user has created a goal and you need to give them personalized coaching.

USER'S PROFILE:
- Core values: ${valueNames || 'Not yet specified'}
- Current interests: ${existingInterests || 'None listed'}
- Exploring interests: ${exploringInterests || 'None listed'}
- Life categories they focus on: ${categoryNames || 'Not specified'}

THEIR GOAL:
- Title: "${goal.title}"
- Why it matters to them: "${goal.why || 'Not specified'}"
- Connected categories: ${goal.connectedCategories?.join(', ') || 'None'}
- Connected values: ${goal.connectedValues?.join(', ') || 'None'}
- Connected interests: ${goal.connectedInterests?.join(', ') || 'None'}

INSTRUCTIONS:
Respond with a JSON object containing exactly two fields:
1. "whyItHelps" — A warm, personalized paragraph (2-4 sentences) explaining how this goal connects to their values and interests. Reference specific values/interests by name. Be encouraging but genuine, not generic. Speak directly to them using "you" and "your".
2. "dailyIdeas" — An array of 3-4 concrete, actionable daily activities they could do toward this goal. Each should be specific enough to start today, and when possible, tie back to their interests. Keep each under 60 characters.

Respond ONLY with valid JSON, no markdown, no code fences.`;

  // ── Call Gemini ──────────────────────────────────────────────────────────────
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[AI Coach] Gemini error:', geminiRes.status, errText);

      if (geminiRes.status === 429) {
        return NextResponse.json(
          { error: 'Tim is resting — the AI quota has been exceeded. Please wait a minute and try again, or enable billing on your Google Cloud project for higher limits.' },
          { status: 429 }
        );
      }

      if (geminiRes.status === 403) {
        return NextResponse.json(
          { error: 'The API key is not authorized. Check that the Gemini API is enabled in your Google Cloud project.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'AI service returned an error. Please try again later.' },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();

    // Gemini 2.5 may include a "thinking" part before the actual text part.
    // Find the last part that has a `text` field (skip thought parts).
    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const textPart = [...parts].reverse().find((p: any) => typeof p.text === 'string');
    const rawText = textPart?.text;

    if (!rawText) {
      console.error('[AI Coach] No text part in Gemini response:', JSON.stringify(geminiData));
      return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 502 });
    }

    // Parse the JSON response
    let parsed: { whyItHelps: string; dailyIdeas: string[] };
    try {
      // Strip code fences if the model added them despite instructions
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
      if (!parsed.whyItHelps || !Array.isArray(parsed.dailyIdeas)) {
        throw new Error('Missing required fields');
      }
    } catch (parseErr) {
      console.error('[AI Coach] Failed to parse Gemini response:', rawText);
      return NextResponse.json(
        { error: 'AI response was not in the expected format. Please try again.' },
        { status: 502 }
      );
    }

    // ── Save to goal & increment counter ────────────────────────────────────
    const aiContent = {
      whyItHelps: parsed.whyItHelps,
      dailyIdeas: parsed.dailyIdeas.slice(0, 4),
      generatedAt: new Date().toISOString(),
      profileHash,
    };

    // Update the goal's aiContent in the roadmap — explicitly preserve activities to avoid data loss
    const updatedGoals = goals.map((g: any) =>
      g.id === goalId ? { ...g, aiContent } : g
    );

    await supabase
      .from('workbook_entries')
      .update({
        content: {
          ...roadmapContent,
          goals: updatedGoals,
          // Explicitly preserve activities array — do NOT drop it on concurrent writes
          activities: roadmapContent.activities ?? [],
          updated_at: new Date().toISOString(),
        },
      })
      .eq('user_id', user.id)
      .eq('category', 'roadmap');

    // Increment daily counter
    await supabase
      .from('profiles')
      .update({ ai_calls_today: callsToday + 1 })
      .eq('id', user.id);

    return NextResponse.json({ coaching: aiContent, cached: false });
  } catch (err) {
    console.error('[AI Coach] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong with the AI service. Please try again.' },
      { status: 500 }
    );
  }
}
