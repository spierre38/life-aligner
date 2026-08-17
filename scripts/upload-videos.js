/**
 * scripts/upload-videos.js
 *
 * Uploads local MP4/M4V files to the Supabase Storage private bucket 'framework-videos'.
 *
 * Usage:
 *   node scripts/upload-videos.js <path-to-folder-or-file>
 *
 * Example:
 *   node scripts/upload-videos.js "C:\Users\...\Downloads"
 *   node scripts/upload-videos.js "C:\Users\...\Downloads\v1-welcome.mp4"
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or pass via env: SUPABASE_SERVICE_ROLE_KEY=... node ...)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'framework-videos';

// Known video filename mapping
const VIDEO_MAP = {
  1: 'v1-welcome.mp4',
  2: 'v2-contentment.mp4',
  3: 'v3-improvement.mp4',
  4: 'v4-goals.mp4',
  5: 'v5-lifeframe-roadmap.mp4',
  6: 'v6-your-story.mp4',
};

function matchStorageKey(filename) {
  const lower = filename.toLowerCase();

  // Explicit check for "#1", "# 1", "v1", "video 1" etc.
  const hashMatch = lower.match(/(?:#|v|video\s*)(\d+)/i);
  if (hashMatch && hashMatch[1]) {
    const num = parseInt(hashMatch[1], 10);
    if (VIDEO_MAP[num]) {
      return VIDEO_MAP[num];
    }
  }

  // Check for title keywords
  if (lower.includes('welcome')) return 'v1-welcome.mp4';
  if (lower.includes('contentment')) return 'v2-contentment.mp4';
  if (lower.includes('continuous') || lower.includes('improvement')) return 'v3-improvement.mp4';
  if (lower.includes('goals') || lower.includes('begin with')) return 'v4-goals.mp4';
  if (lower.includes('lifeframe') || lower.includes('roadmap')) return 'v5-lifeframe-roadmap.mp4';
  if (lower.includes('story') || lower.includes('tim')) return 'v6-your-story.mp4';

  if (lower.endsWith('.mp4') || lower.endsWith('.m4v') || lower.endsWith('.mov')) {
    const ext = path.extname(filename);
    return path.basename(filename, ext) + '.mp4';
  }
  return null;
}

async function uploadFile(filePath, targetKey) {
  console.log(`\n⏳ Uploading: ${path.basename(filePath)} -> bucket '${BUCKET}/${targetKey}'`);
  const fileBuffer = fs.readFileSync(filePath);
  const fileSizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`   Size: ${fileSizeMb} MB`);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(targetKey, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    console.error(`❌ Failed to upload ${targetKey}:`, error.message);
    return false;
  }

  console.log(`✅ Uploaded successfully: ${targetKey}`);
  return true;
}

async function main() {
  const targetPath = process.argv[2];
  if (!targetPath) {
    console.log('Usage: node scripts/upload-videos.js <directory-or-file-path>');
    process.exit(1);
  }

  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ Path does not exist: ${resolved}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolved);
  let filesToUpload = [];

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(resolved);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (['.mp4', '.m4v', '.mov'].includes(ext)) {
        const full = path.join(resolved, entry);
        const key = matchStorageKey(entry);
        if (key) {
          filesToUpload.push({ full, key });
        } else {
          console.warn(`⚠️ Could not automatically match key for: ${entry}`);
        }
      }
    }
  } else {
    const key = matchStorageKey(path.basename(resolved));
    if (key) {
      filesToUpload.push({ full: resolved, key });
    } else {
      console.error(`❌ Could not determine target key for: ${resolved}`);
      process.exit(1);
    }
  }

  if (filesToUpload.length === 0) {
    console.log('No video files found to upload.');
    return;
  }

  console.log(`Found ${filesToUpload.length} file(s) to upload to '${BUCKET}':`);
  filesToUpload.forEach(f => console.log(` - ${path.basename(f.full)} => ${f.key}`));

  let successCount = 0;
  for (const item of filesToUpload) {
    const ok = await uploadFile(item.full, item.key);
    if (ok) successCount++;
  }

  console.log(`\n🎉 Finished: ${successCount}/${filesToUpload.length} video(s) uploaded.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
