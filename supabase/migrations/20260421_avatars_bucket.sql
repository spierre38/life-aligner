-- Create the avatars storage bucket
-- Run this in your Supabase SQL editor or Dashboard → Storage → New Bucket

-- If using SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,           -- Public bucket so avatar URLs work without auth tokens
    2097152,        -- 2MB server-side limit (client compresses to ~100KB before this)
    ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
) ON CONFLICT (id) DO NOTHING;

-- RLS: any authenticated user can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS: anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- RLS: users can update/delete their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
