// scripts/upload_videos.mjs — Upload framework videos 7-19 to Vercel Blob
// Run from project root: node scripts/upload_videos.mjs

import { put } from '@vercel/blob';
import { readFileSync, createReadStream, statSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const desktop = `C:\\Users\\Barnes Building\\Desktop`;

// Read token from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const tokenLine = envContent.split('\n').find(l => l.startsWith('BLOB_READ_WRITE_TOKEN='));
if (!tokenLine) { console.error('No BLOB_READ_WRITE_TOKEN in .env.local'); process.exit(1); }
const token = tokenLine.split('=').slice(1).join('=').trim();
process.env.BLOB_READ_WRITE_TOKEN = token;

const videos = [
  { file: '2026-08-17 #7 How to Use Tools.mp4',                pathname: 'framework-videos/v7-tools.mp4',                        id: 'v7-tools' },
  { file: '2026-08-17 #8 Values.mp4',                           pathname: 'framework-videos/v8-values-interests-categories.mp4',  id: 'v8-values-interests-categories' },
  { file: '2026-08-18 #9 Worksheet 1.mp4',                      pathname: 'framework-videos/v9-character.mp4',                    id: 'v9-character' },
  { file: '2026-08-18 #10 Interests.mp4',                       pathname: 'framework-videos/v10-values-worksheet.mp4',            id: 'v10-values-worksheet' },
  { file: '2026-08-18 #11 Worksheet 2.mp4',                     pathname: 'framework-videos/v11-interests.mp4',                   id: 'v11-interests' },
  { file: '2026-08-18 #12 Life Categories.mp4',                 pathname: 'framework-videos/v12-life-categories-1.mp4',           id: 'v12-life-categories-1' },
  { file: '2026-08-19 #13 Relationships Community Purpose.mp4', pathname: 'framework-videos/v13-life-categories-2.mp4',           id: 'v13-life-categories-2' },
  { file: '2026-08-19 #14 Worksheet 3.mp4',                     pathname: 'framework-videos/v14-community.mp4',                   id: 'v14-community' },
  { file: '2026-08-19 #15 Goals Behavior Driven Regret.mp4',    pathname: 'framework-videos/v15-purpose.mp4',                     id: 'v15-purpose' },
  { file: '2026-08-19 #16 Chart Your Own Course.mp4',           pathname: 'framework-videos/v16-worksheet3.mp4',                  id: 'v16-worksheet3' },
  { file: '2026-08-19 #17 Behavior Changes.mp4',                pathname: 'framework-videos/v17-goals-activities.mp4',            id: 'v17-goals-activities' },
  { file: '2026-08-20 #18 Tough Farmer and Roadmap.mp4',        pathname: 'framework-videos/v18-minimize-regrets.mp4',            id: 'v18-minimize-regrets' },
  { file: '2026-08-20 #19 Closing.mp4',                         pathname: 'framework-videos/v19-chart-your-course.mp4',           id: 'v19-chart-your-course' },
];

const resultsPath = `C:\\Users\\Barnes Building\\.gemini\\antigravity-ide\\brain\\04cab460-1e44-4f60-9173-29cc66ed067d\\scratch\\upload_results.json`;
const results = [];

for (const v of videos) {
  const filePath = join(desktop, v.file);

  if (!existsSync(filePath)) {
    console.warn(`\n[SKIP] File not found: ${v.file}`);
    results.push({ id: v.id, blobUrl: 'SKIPPED', file: v.file });
    continue;
  }

  const sizeMB = (statSync(filePath).size / (1024 * 1024)).toFixed(1);
  console.log(`\n${'='.repeat(55)}`);
  console.log(`[UPLOAD] ${v.file}`);
  console.log(`  Size   : ${sizeMB} MB`);
  console.log(`  Blob   : ${v.pathname}`);

  const start = Date.now();
  try {
    const stream = createReadStream(filePath);
    const blob = await put(v.pathname, stream, {
      access: 'public',
      contentType: 'video/mp4',
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  DONE in ${elapsed}s`);
    console.log(`  URL: ${blob.url}`);

    results.push({ id: v.id, blobUrl: blob.url, file: v.file });
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    results.push({ id: v.id, blobUrl: 'ERROR', file: v.file, error: err.message });
  }

  // Save progress after each video so partial results survive interruption
  writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`  Progress saved.`);
}

console.log(`\n${'='.repeat(55)}`);
console.log('UPLOAD COMPLETE');
console.log(`${'='.repeat(55)}`);
for (const r of results) {
  const status = r.blobUrl === 'ERROR' ? 'FAIL' : r.blobUrl === 'SKIPPED' ? 'SKIP' : ' OK ';
  console.log(`[${status}] ${r.id}`);
}
console.log(`\nResults saved to: ${resultsPath}`);
