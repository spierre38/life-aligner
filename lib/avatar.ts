/**
 * lib/avatar.ts
 * Profile picture upload — compresses to WEBP via canvas before uploading to Supabase Storage.
 */

import { supabase } from './supabase';

const BUCKET = 'avatars';
const MAX_SIZE = 256; // px — resize to 256×256 max
const QUALITY = 0.85;

/**
 * Compress and resize an image file to a square WEBP blob.
 */
async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const canvas = document.createElement('canvas');
            canvas.width = MAX_SIZE;
            canvas.height = MAX_SIZE;
            const ctx = canvas.getContext('2d')!;
            // Centre-crop to square
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
            URL.revokeObjectURL(url);
            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                'image/webp',
                QUALITY
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });
}

/**
 * Upload a profile picture for the current user.
 * Returns the public URL of the uploaded image.
 */
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { url: null, error: 'Not authenticated' };

    try {
        const blob = await compressImage(file);
        // Store as {userId}/avatar.webp so the folder-based RLS policy matches
        const path = `${user.id}/avatar.webp`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, { contentType: 'image/webp', upsert: true });

        if (uploadError) return { url: null, error: uploadError.message };

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

        // Cache-bust so the browser fetches the new image
        const url = `${publicUrl}?t=${Date.now()}`;

        // Persist to profiles table
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);

        // Also update user metadata so it's available in auth.getUser()
        await supabase.auth.updateUser({ data: { avatar_url: url } });

        return { url, error: null };
    } catch (err: any) {
        return { url: null, error: err.message || 'Upload failed' };
    }
}

/**
 * Remove the current user's avatar.
 */
export async function removeAvatar(): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const path = `${user.id}/avatar.webp`;

    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    await supabase.auth.updateUser({ data: { avatar_url: null } });

    return { error: null };
}

/**
 * Get the current user's avatar URL from their profile.
 */
export async function getAvatarUrl(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

    return data?.avatar_url || null;
}
