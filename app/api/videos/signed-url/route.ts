/**
 * app/api/videos/signed-url/route.ts
 *
 * Server-side endpoint for video access:
 *
 * GET  ?videoId=v1-welcome  → Returns a 1-hour signed URL for the video
 * POST { videoId }          → Marks a video as watched in the user's profile
 *
 * The bucket is PRIVATE — only this server route can generate signed URLs.
 * Each URL expires after 1 hour. If the user comes back later, they get a new one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getVideo } from '@/lib/videos';

const BUCKET = 'framework-videos';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

// ─── GET: Generate signed URL ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
  }

  const video = getVideo(videoId);
  if (!video || !video.storageKey) {
    return NextResponse.json({ error: 'Video not found or not yet available' }, { status: 404 });
  }

  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate signed URL
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(video.storageKey, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.error('[videos/signed-url] Failed to create signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate video URL. The video may not be uploaded yet.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresIn: SIGNED_URL_EXPIRY,
    videoId: video.id,
    title: video.title,
  });
}

// ─── POST: Mark video as watched ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { videoId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { videoId } = body;
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  const video = getVideo(videoId);
  if (!video) {
    return NextResponse.json({ error: 'Unknown video ID' }, { status: 404 });
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch current video_progress
  const { data: profile } = await supabase
    .from('profiles')
    .select('video_progress')
    .eq('id', user.id)
    .single();

  const current = (profile?.video_progress ?? {}) as Record<string, unknown>;
  const watched = Array.isArray(current.watched) ? [...current.watched] : [];

  // Add videoId if not already watched
  if (!watched.includes(videoId)) {
    watched.push(videoId);
  }

  // Save updated progress
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      video_progress: { ...current, watched },
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('[videos/signed-url] Failed to update video_progress:', updateError);
    return NextResponse.json({ error: 'Failed to save watch progress' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, watched });
}
