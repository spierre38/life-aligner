/**
 * app/api/videos/watch/route.ts
 *
 * POST { videoId } — marks a video as watched in the user's profile.
 * Called by VideoPlayer at 95% completion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getVideo } from '@/lib/videos';

export async function POST(req: NextRequest) {
  let body: { videoId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const { videoId } = body;
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  if (!getVideo(videoId)) return NextResponse.json({ error: 'Unknown video' }, { status: 404 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch current progress
  const { data: profile } = await supabase
    .from('profiles')
    .select('video_progress')
    .eq('id', user.id)
    .single();

  const current = (profile?.video_progress ?? {}) as Record<string, unknown>;
  const watched = Array.isArray(current.watched) ? [...current.watched as string[]] : [];
  if (!watched.includes(videoId)) watched.push(videoId);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ video_progress: { ...current, watched }, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('[videos/watch] Update failed:', updateError);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, watched });
}
