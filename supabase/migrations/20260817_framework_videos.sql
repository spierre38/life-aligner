-- Create the framework-videos storage bucket (PRIVATE — signed URLs only)
-- Run this in your Supabase SQL editor: Dashboard → SQL Editor → New Query

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'framework-videos',
    'framework-videos',
    false,          -- PRIVATE: requires signed URLs to access
    524288000,      -- 500MB per file limit
    ARRAY['video/mp4', 'video/x-m4v', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- 2. RLS: Authenticated users can read (needed for createSignedUrl to work)
--    No user-facing upload policies — uploads are done via service_role in upload script.
CREATE POLICY "Authenticated users can read framework videos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'framework-videos' AND
        auth.role() = 'authenticated'
    );

-- 3. Add video_progress column to profiles
-- Stores: { watched: ["v1-welcome", "v2-contentment"], lastUnlockSeen: "v3-improvement" }
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS video_progress jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.video_progress IS 'Tracks watched video IDs and last unlock celebration shown. Shape: { watched: string[], lastUnlockSeen: string }';
