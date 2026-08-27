// scripts/retry_multipart.mjs — Upload large videos using SDK multipart uploader
// Uses createMultipartUploader which handles chunked uploads correctly for large files

import { createMultipartUploader } from '@vercel/blob';
import { readFileSync, statSync, existsSync, writeFileSync, openSync, readSync, closeSync } from 'fs';
import { join } from 'path';

const desktop = `C:\\Users\\Barnes Building\\Desktop`;

// Read token from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const tokenLine = envContent.split('\n').find(l => l.startsWith('BLOB_READ_WRITE_TOKEN='));
if (!tokenLine) { console.error('No BLOB_READ_WRITE_TOKEN in .env.local'); process.exit(1); }
const token = tokenLine.split('=').slice(1).join('=').trim();
process.env.BLOB_READ_WRITE_TOKEN = token;

const videos = [
  { file: '2026-08-17 #8 Values.mp4',                           pathname: 'framework-videos/v8-values-interests-categories.mp4',  id: 'v8-values-interests-categories' },
  { file: '2026-08-19 #13 Relationships Community Purpose.mp4', pathname: 'framework-videos/v13-life-categories-2.mp4',           id: 'v13-life-categories-2' },
  { file: '2026-08-19 #15 Goals Behavior Driven Regret.mp4',    pathname: 'framework-videos/v15-purpose.mp4',                     id: 'v15-purpose' },
  { file: '2026-08-20 #18 Tough Farmer and Roadmap.mp4',        pathname: 'framework-videos/v18-minimize-regrets.mp4',            id: 'v18-minimize-regrets' },
];

const resultsPath = `C:\\Users\\Barnes Building\\.gemini\\antigravity-ide\\brain\\04cab460-1e44-4f60-9173-29cc66ed067d\\scratch\\retry_results.json`;
const results = [];

// 50 MB chunks for multipart upload
const CHUNK_SIZE = 50 * 1024 * 1024;

for (const v of videos) {
  const filePath = join(desktop, v.file);

  if (!existsSync(filePath)) {
    console.warn(`\n[SKIP] File not found: ${v.file}`);
    results.push({ id: v.id, blobUrl: 'SKIPPED', file: v.file });
    continue;
  }

  const fileSize = statSync(filePath).size;
  const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

  console.log(`\n${'='.repeat(55)}`);
  console.log(`[MULTIPART] ${v.file}`);
  console.log(`  Size   : ${sizeMB} MB`);
  console.log(`  Chunks : ${totalChunks} x 50 MB`);
  console.log(`  Blob   : ${v.pathname}`);

  const start = Date.now();
  try {
    const uploader = await createMultipartUploader(v.pathname, {
      access: 'public',
      contentType: 'video/mp4',
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });

    const fd = openSync(filePath, 'r');
    let offset = 0;
    let chunkNum = 0;

    while (offset < fileSize) {
      const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
      const chunk = Buffer.alloc(chunkSize);
      readSync(fd, chunk, 0, chunkSize, offset);
      offset += chunkSize;
      chunkNum++;

      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      const pct = ((offset / fileSize) * 100).toFixed(1);
      console.log(`  Chunk ${chunkNum}/${totalChunks} (${pct}% | ${elapsed}s elapsed)...`);

      await uploader.uploadPart(chunkNum, chunk);
    }

    closeSync(fd);

    console.log(`  Completing multipart upload...`);
    const blob = await uploader.complete();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  DONE in ${elapsed}s`);
    console.log(`  URL: ${blob.url}`);

    results.push({ id: v.id, blobUrl: blob.url, file: v.file });
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    console.error(err.stack);
    results.push({ id: v.id, blobUrl: 'ERROR', file: v.file, error: err.message });
  }

  writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`  Progress saved.`);
}

console.log(`\n${'='.repeat(55)}`);
console.log('RETRY COMPLETE');
console.log(`${'='.repeat(55)}`);
for (const r of results) {
  const status = r.blobUrl === 'ERROR' ? 'FAIL' : r.blobUrl === 'SKIPPED' ? 'SKIP' : ' OK ';
  console.log(`[${status}] ${r.id}: ${r.blobUrl}`);
}
console.log(`\nResults saved to: ${resultsPath}`);
