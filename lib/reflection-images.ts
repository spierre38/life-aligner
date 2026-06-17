/**
 * reflection-images.ts — Image upload helpers for Life Chapters
 *
 * Stubbed for now — requires Supabase Storage bucket "reflection-images"
 * to be created. Once the bucket exists, uncomment the real implementations.
 *
 * File path pattern: {user_id}/{goal_id}/{reflection_id}/{filename}
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'reflection-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1200; // px — resize larger images
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Client-side image resize ────────────────────────────────────────────────

/**
 * Resizes an image File to a max dimension (width or height) using the
 * browser Canvas API. Returns a new Blob in JPEG format.
 */
export async function resizeImage(file: File, maxDim = MAX_DIMENSION): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only downscale, never upscale
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WebP image.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be under 5MB.';
  }
  return null; // valid
}

// ─── Upload (stubbed — needs Supabase Storage bucket) ────────────────────────

/**
 * Uploads a reflection image to Supabase Storage.
 *
 * @returns The public URL of the uploaded image, or null if the bucket isn't set up.
 */
export async function uploadReflectionImage(
  file: File,
  userId: string,
  goalId: string,
  reflectionId: string
): Promise<string | null> {
  // Validate
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  // Resize
  const resized = await resizeImage(file);
  const ext = 'jpg'; // we convert everything to JPEG
  const path = `${userId}/${goalId}/${reflectionId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, resized, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.warn('[reflection-images] Upload failed — bucket may not exist yet:', uploadError.message);
    return null;
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a reflection image from Supabase Storage.
 */
export async function deleteReflectionImage(publicUrl: string): Promise<void> {
  // Extract the path from the public URL
  const bucketUrl = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl;
  const path = publicUrl.replace(bucketUrl, '');

  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.warn('[reflection-images] Delete failed:', error.message);
  }
}
