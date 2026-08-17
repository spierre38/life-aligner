/**
 * scripts/upload-videos.js
 *
 * Uploads local MP4/M4V files to Vercel Blob storage.
 *
 * Usage:
 *   node scripts/upload-videos.js <path-to-folder-or-file>
 *
 * Example:
 *   node scripts/upload-videos.js "C:\Users\...\Desktop"
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Load .env.local
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
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('âŒ Missing BLOB_READ_WRITE_TOKEN in .env.local');
  process.exit(1);
}

// Known video filename mapping: local file -> blob pathname
const VIDEO_MAP = {
  1: 'framework-videos/v1-welcome.mp4',
  2: 'framework-videos/v2-contentment.mp4',
  3: 'framework-videos/v3-improvement.mp4',
  4: 'framework-videos/v4-goals.mp4',
  5: 'framework-videos/v5-lifeframe-roadmap.mp4',
  6: 'framework-videos/v6-your-story.mp4',
};

function matchBlobPath(filename) {
  const lower = filename.toLowerCase();

  const hashMatch = lower.match(/(?:#|v|video\s*)(\d+)/i);
  if (hashMatch && hashMatch[1]) {
    const num = parseInt(hashMatch[1], 10);
    if (VIDEO_MAP[num]) return VIDEO_MAP[num];
  }

  if (lower.includes('welcome')) return VIDEO_MAP[1];
  if (lower.includes('contentment')) return VIDEO_MAP[2];
  if (lower.includes('continuous') || lower.includes('improvement')) return VIDEO_MAP[3];
  if (lower.includes('goals') || lower.includes('begin')) return VIDEO_MAP[4];
  if (lower.includes('lifeframe') || lower.includes('roadmap')) return VIDEO_MAP[5];
  if (lower.includes('story')) return VIDEO_MAP[6];

  const ext = path.extname(filename).toLowerCase();
  if (['.mp4', '.m4v', '.mov'].includes(ext)) {
    return 'framework-videos/' + path.basename(filename, ext) + '.mp4';
  }
  return null;
}

async function uploadFile(filePath, blobPathname) {
  const { put } = await import('@vercel/blob');
  console.log(`\nâ³ Uploading: ${path.basename(filePath)}`);
  console.log(`   â†’ Blob: ${blobPathname}`);
  const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(1);
  console.log(`   Size: ${sizeMb} MB`);

  const fileBuffer = fs.readFileSync(filePath);

  const blob = await put(blobPathname, fileBuffer, {
    access: 'public',
    token,
    contentType: 'video/mp4',
    addRandomSuffix: true,
  });

  console.log(`âœ… Uploaded: ${blob.url}`);
  return blob.url;
}

async function main() {
  const targetPath = process.argv[2];
  if (!targetPath) {
    console.log('Usage: node scripts/upload-videos.js <directory-or-file-path>');
    process.exit(1);
  }

  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    console.error(`âŒ Path does not exist: ${resolved}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolved);
  const filesToUpload = [];

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(resolved)) {
      const ext = path.extname(entry).toLowerCase();
      if (['.mp4', '.m4v', '.mov'].includes(ext)) {
        const blobPath = matchBlobPath(entry);
        if (blobPath) {
          filesToUpload.push({ full: path.join(resolved, entry), blobPath });
        } else {
          console.warn(`âš ï¸  Could not match blob path for: ${entry}`);
        }
      }
    }
  } else {
    const blobPath = matchBlobPath(path.basename(resolved));
    if (!blobPath) {
      console.error(`âŒ Could not determine blob path for: ${resolved}`);
      process.exit(1);
    }
    filesToUpload.push({ full: resolved, blobPath });
  }

  if (filesToUpload.length === 0) {
    console.log('No video files found.');
    return;
  }

  console.log(`\nFound ${filesToUpload.length} file(s) to upload:`);
  filesToUpload.forEach(f => console.log(`  ${path.basename(f.full)} â†’ ${f.blobPath}`));

  const results = [];
  for (const item of filesToUpload) {
    try {
      const url = await uploadFile(item.full, item.blobPath);
      results.push({ blobPath: item.blobPath, url });
    } catch (err) {
      console.error(`âŒ Failed: ${item.blobPath} â€” ${err.message}`);
    }
  }

  console.log(`\nðŸŽ‰ Done: ${results.length}/${filesToUpload.length} uploaded.`);
  console.log('\nðŸ“‹ Blob URLs (update lib/videos.ts with these):');
  results.forEach(r => console.log(`  ${r.blobPath}: ${r.url}`));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

