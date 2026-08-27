// scripts/compress_and_upload.mjs
// Compresses videos with FFmpeg and uploads via @vercel/blob SDK

import { put } from '@vercel/blob';
import { readFileSync, createReadStream, statSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const desktop = `C:\\Users\\Barnes Building\\Desktop`;
const outDir = join(desktop, 'compressed');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// Read token from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const tokenLine = envContent.split('\n').find(l => l.startsWith('BLOB_READ_WRITE_TOKEN='));
if (!tokenLine) { console.error('No BLOB_READ_WRITE_TOKEN in .env.local'); process.exit(1); }
const token = tokenLine.split('=').slice(1).join('=').trim();
process.env.BLOB_READ_WRITE_TOKEN = token;

// Priority: First the 4 missing videos (v8, v13, v15, v18), then the rest
const priorityVideos = [
  { file: '2026-08-17 #8 Values.mp4',                           pathname: 'framework-videos/v8-values-interests-categories.mp4',  id: 'v8-values-interests-categories' },
  { file: '2026-08-19 #13 Relationships Community Purpose.mp4', pathname: 'framework-videos/v13-life-categories-2.mp4',           id: 'v13-life-categories-2' },
  { file: '2026-08-19 #15 Goals Behavior Driven Regret.mp4',    pathname: 'framework-videos/v15-purpose.mp4',                     id: 'v15-purpose' },
  { file: '2026-08-20 #18 Tough Farmer and Roadmap.mp4',        pathname: 'framework-videos/v18-minimize-regrets.mp4',            id: 'v18-minimize-regrets' },
];

const remainingVideos = [
  { file: '2026-08-14 #1 - Welcome.mp4',                        pathname: 'framework-videos/v1-welcome.mp4',                      id: 'v1-welcome' },
  { file: '2026-08-14 #2 - What is Contentment.mp4',            pathname: 'framework-videos/v2-contentment.mp4',                  id: 'v2-contentment' },
  { file: '2026-08-14 #3 - Continuous Improvement.mp4',         pathname: 'framework-videos/v3-improvement.mp4',                  id: 'v3-improvement' },
  { file: '2026-08-15 #4.mp4',                                  pathname: 'framework-videos/v4-goals.mp4',                        id: 'v4-goals' },
  { file: '2026-08-15 #5.mp4',                                  pathname: 'framework-videos/v5-lifeframe-roadmap.mp4',            id: 'v5-lifeframe-roadmap' },
  { file: '2026-08-15 #6.mp4',                                  pathname: 'framework-videos/v6-your-story.mp4',                   id: 'v6-your-story' },
  { file: '2026-08-17 #7 How to Use Tools.mp4',                 pathname: 'framework-videos/v7-tools.mp4',                        id: 'v7-tools' },
  { file: '2026-08-18 #9 Worksheet 1.mp4',                      pathname: 'framework-videos/v9-character.mp4',                    id: 'v9-character' },
  { file: '2026-08-18 #10 Interests.mp4',                       pathname: 'framework-videos/v10-values-worksheet.mp4',            id: 'v10-values-worksheet' },
  { file: '2026-08-18 #11 Worksheet 2.mp4',                     pathname: 'framework-videos/v11-interests.mp4',                   id: 'v11-interests' },
  { file: '2026-08-18 #12 Life Categories.mp4',                 pathname: 'framework-videos/v12-life-categories-1.mp4',           id: 'v12-life-categories-1' },
  { file: '2026-08-19 #14 Worksheet 3.mp4',                     pathname: 'framework-videos/v14-community.mp4',                   id: 'v14-community' },
  { file: '2026-08-19 #16 Chart Your Own Course.mp4',           pathname: 'framework-videos/v16-worksheet3.mp4',                  id: 'v16-worksheet3' },
  { file: '2026-08-19 #17 Behavior Changes.mp4',                pathname: 'framework-videos/v17-goals-activities.mp4',            id: 'v17-goals-activities' },
  { file: '2026-08-20 #19 Closing.mp4',                         pathname: 'framework-videos/v19-chart-your-course.mp4',           id: 'v19-chart-your-course' },
];

const allVideos = [...priorityVideos, ...remainingVideos];
const resultsPath = `C:\\Users\\Barnes Building\\.gemini\\antigravity-ide\\brain\\04cab460-1e44-4f60-9173-29cc66ed067d\\scratch\\compressed_upload_results.json`;

let results = [];
try {
  if (existsSync(resultsPath)) {
    results = JSON.parse(readFileSync(resultsPath, 'utf8'));
  }
} catch (e) {}

const ffmpegBin = `"${join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-full_build', 'bin', 'ffmpeg.exe')}"`;

for (const v of allVideos) {
  const srcPath = join(desktop, v.file);
  const outPath = join(outDir, `${v.id}.mp4`);

  if (!existsSync(srcPath)) {
    console.warn(`[SKIP] Source file not found: ${v.file}`);
    continue;
  }

  const srcMB = (statSync(srcPath).size / (1024 * 1024)).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[PROCESS] ${v.id}: ${v.file} (${srcMB} MB)`);

  // Step 1: Compress with FFmpeg if not already compressed
  if (!existsSync(outPath)) {
    console.log(`  -> Compressing with FFmpeg (CRF 24, max 1080p, fast preset)...`);
    const cStart = Date.now();
    try {
      // H.264 CRF 24 gives crisp 1080p video while slashing file size by 70-85%
      const cmd = `${ffmpegBin} -y -i "${srcPath}" -c:v libx264 -crf 24 -preset fast -vf "scale='if(gt(iw,1920),1920,iw)':'if(gt(iw,1920),-2,ih)'" -c:a aac -b:a 128k -movflags +faststart "${outPath}"`;
      execSync(cmd, { stdio: 'inherit' });
      const cTime = ((Date.now() - cStart) / 1000).toFixed(1);
      const outMB = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
      const savedPct = Math.round((1 - outMB / srcMB) * 100);
      console.log(`  -> Compression done in ${cTime}s: ${srcMB} MB -> ${outMB} MB (${savedPct}% saved)`);
    } catch (err) {
      console.error(`  -> Compression failed: ${err.message}`);
      continue;
    }
  } else {
    const outMB = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
    console.log(`  -> Using existing compressed file (${outMB} MB)`);
  }

  // Step 2: Upload compressed file to Vercel Blob
  const compSizeMB = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
  console.log(`  -> Uploading compressed file (${compSizeMB} MB) to ${v.pathname}...`);
  const uStart = Date.now();
  try {
    const stream = createReadStream(outPath);
    const blob = await put(v.pathname, stream, {
      access: 'public',
      contentType: 'video/mp4',
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });
    const uTime = ((Date.now() - uStart) / 1000).toFixed(1);
    console.log(`  -> UPLOAD SUCCESS in ${uTime}s!`);
    console.log(`  -> URL: ${blob.url}`);

    const existingIdx = results.findIndex(r => r.id === v.id);
    const record = { id: v.id, file: v.file, originalMB: srcMB, compressedMB: compSizeMB, url: blob.url };
    if (existingIdx >= 0) results[existingIdx] = record;
    else results.push(record);

    writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
  } catch (err) {
    console.error(`  -> Upload error: ${err.message}`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log('ALL PROCESSING COMPLETE!');
console.log(`${'='.repeat(60)}`);
console.log(JSON.stringify(results, null, 2));
