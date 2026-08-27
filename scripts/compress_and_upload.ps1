# compress_and_upload.ps1
# Compresses ALL framework videos using FFmpeg (H.264 CRF 23, max 1080p)
# then uploads compressed versions to Vercel Blob.
# Run from the project root directory.

$ErrorActionPreference = 'Continue'

# Refresh PATH to find ffmpeg
$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')

# Verify ffmpeg
$ffmpegCheck = ffmpeg -version 2>&1 | Select-Object -First 1
Write-Host "FFmpeg: $ffmpegCheck" -ForegroundColor Cyan

# Paths
$desktop   = "$env:USERPROFILE\Desktop"
$outDir    = "$desktop\compressed"
$envPath   = "C:\Users\Barnes Building\Documents\life-aligner\.env.local"
$resultsPath = "C:\Users\Barnes Building\.gemini\antigravity-ide\brain\04cab460-1e44-4f60-9173-29cc66ed067d\scratch\compress_upload_results.json"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Read blob token
$token = (Get-Content $envPath | Where-Object { $_ -match '^BLOB_READ_WRITE_TOKEN=' }) -replace '^BLOB_READ_WRITE_TOKEN=',''
if (-not $token) { Write-Error "No BLOB_READ_WRITE_TOKEN found"; exit 1 }

# All 13 videos to process (compress + upload)
$videos = @(
    @{ file = "2026-08-14 #1 - Welcome.mp4";                              id = "v1-welcome";                       pathname = "framework-videos/v1-welcome-compressed.mp4" },
    @{ file = "2026-08-14 #2 - What is Contentment.mp4";                 id = "v2-contentment";                   pathname = "framework-videos/v2-contentment-compressed.mp4" },
    @{ file = "2026-08-14 #3 - Continuous Improvement.mp4";              id = "v3-improvement";                   pathname = "framework-videos/v3-improvement-compressed.mp4" },
    @{ file = "2026-08-15 #4.mp4";                                        id = "v4-goals";                         pathname = "framework-videos/v4-goals-compressed.mp4" },
    @{ file = "2026-08-15 #5.mp4";                                        id = "v5-lifeframe-roadmap";             pathname = "framework-videos/v5-lifeframe-roadmap-compressed.mp4" },
    @{ file = "2026-08-15 #6.mp4";                                        id = "v6-your-story";                    pathname = "framework-videos/v6-your-story-compressed.mp4" },
    @{ file = "2026-08-17 #7 How to Use Tools.mp4";                       id = "v7-tools";                         pathname = "framework-videos/v7-tools-compressed.mp4" },
    @{ file = "2026-08-17 #8 Values.mp4";                                 id = "v8-values-interests-categories";   pathname = "framework-videos/v8-values-interests-categories-compressed.mp4" },
    @{ file = "2026-08-18 #9 Worksheet 1.mp4";                            id = "v9-character";                     pathname = "framework-videos/v9-character-compressed.mp4" },
    @{ file = "2026-08-18 #10 Interests.mp4";                             id = "v10-values-worksheet";             pathname = "framework-videos/v10-values-worksheet-compressed.mp4" },
    @{ file = "2026-08-18 #11 Worksheet 2.mp4";                           id = "v11-interests";                    pathname = "framework-videos/v11-interests-compressed.mp4" },
    @{ file = "2026-08-18 #12 Life Categories.mp4";                       id = "v12-life-categories-1";            pathname = "framework-videos/v12-life-categories-1-compressed.mp4" },
    @{ file = "2026-08-19 #13 Relationships Community Purpose.mp4";       id = "v13-life-categories-2";            pathname = "framework-videos/v13-life-categories-2-compressed.mp4" },
    @{ file = "2026-08-19 #14 Worksheet 3.mp4";                           id = "v14-community";                    pathname = "framework-videos/v14-community-compressed.mp4" },
    @{ file = "2026-08-19 #15 Goals Behavior Driven Regret.mp4";          id = "v15-purpose";                      pathname = "framework-videos/v15-purpose-compressed.mp4" },
    @{ file = "2026-08-19 #16 Chart Your Own Course.mp4";                 id = "v16-worksheet3";                   pathname = "framework-videos/v16-worksheet3-compressed.mp4" },
    @{ file = "2026-08-19 #17 Behavior Changes.mp4";                      id = "v17-goals-activities";             pathname = "framework-videos/v17-goals-activities-compressed.mp4" },
    @{ file = "2026-08-20 #18 Tough Farmer and Roadmap.mp4";              id = "v18-minimize-regrets";             pathname = "framework-videos/v18-minimize-regrets-compressed.mp4" },
    @{ file = "2026-08-20 #19 Closing.mp4";                               id = "v19-chart-your-course";            pathname = "framework-videos/v19-chart-your-course-compressed.mp4" }
)

$results = @()

foreach ($v in $videos) {
    $srcPath = Join-Path $desktop $v.file
    $outPath = Join-Path $outDir ($v.id + ".mp4")

    if (-not (Test-Path $srcPath)) {
        Write-Warning "Source not found, skipping: $($v.file)"
        $results += [PSCustomObject]@{ id=$v.id; blobUrl="SKIPPED"; srcMB=0; outMB=0 }
        continue
    }

    $srcMB = [math]::Round((Get-Item $srcPath).Length / 1MB, 1)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[$($v.id)] $($v.file)" -ForegroundColor Cyan
    Write-Host "  Source : ${srcMB} MB" -ForegroundColor Cyan

    # ── COMPRESS ─────────────────────────────────────────────────────────────
    if (Test-Path $outPath) {
        $existMB = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
        Write-Host "  Compressed file already exists (${existMB} MB), skipping FFmpeg..." -ForegroundColor Yellow
    } else {
        Write-Host "  Compressing with FFmpeg (CRF 23, max 1080p)..." -ForegroundColor White
        $compressStart = Get-Date

        # H.264 CRF 23, scale down to max 1920 width if larger, AAC 128k, fast preset
        ffmpeg -y -i $srcPath `
            -c:v libx264 -crf 23 -preset fast `
            -vf "scale='if(gt(iw,1920),1920,iw)':'if(gt(iw,1920),-2,ih)'" `
            -c:a aac -b:a 128k `
            -movflags +faststart `
            $outPath 2>&1 | Where-Object { $_ -match 'frame=|time=|Error|error' } | Select-Object -Last 5

        $compressElapsed = [math]::Round(((Get-Date) - $compressStart).TotalSeconds)
        if (Test-Path $outPath) {
            $outMB = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
            $reduction = [math]::Round((1 - $outMB / $srcMB) * 100)
            Write-Host "  Compressed: ${outMB} MB (-${reduction}%) in ${compressElapsed}s" -ForegroundColor Green
        } else {
            Write-Warning "  Compression failed, skipping upload"
            $results += [PSCustomObject]@{ id=$v.id; blobUrl="COMPRESS_FAILED"; srcMB=$srcMB; outMB=0 }
            continue
        }
    }

    $outMB = [math]::Round((Get-Item $outPath).Length / 1MB, 1)

    # ── UPLOAD ────────────────────────────────────────────────────────────────
    Write-Host "  Uploading to Vercel Blob..." -ForegroundColor White
    $uploadStart = Get-Date

    $blobUrl = "https://blob.vercel-storage.com/$($v.pathname)"
    $headers = @{
        Authorization             = "Bearer $token"
        "x-content-type"          = "video/mp4"
        "x-cache-control-max-age" = "31536000"
    }

    try {
        $response = Invoke-WebRequest `
            -Uri $blobUrl `
            -Method PUT `
            -InFile $outPath `
            -Headers $headers `
            -ContentType "video/mp4" `
            -TimeoutSec 3600

        $uploadElapsed = [math]::Round(((Get-Date) - $uploadStart).TotalSeconds)
        $responseJson  = $response.Content | ConvertFrom-Json
        $finalUrl      = $responseJson.url

        Write-Host "  Uploaded in ${uploadElapsed}s" -ForegroundColor Green
        Write-Host "  URL: $finalUrl" -ForegroundColor Green

        $results += [PSCustomObject]@{ id=$v.id; blobUrl=$finalUrl; srcMB=$srcMB; outMB=$outMB }
    } catch {
        Write-Warning "  Upload FAILED: $_"
        $results += [PSCustomObject]@{ id=$v.id; blobUrl="UPLOAD_FAILED"; srcMB=$srcMB; outMB=$outMB }
    }

    # Save progress after each video
    $results | ConvertTo-Json | Out-File -FilePath $resultsPath -Encoding UTF8
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "DONE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
foreach ($r in $results) {
    $saved = if ($r.srcMB -gt 0 -and $r.outMB -gt 0) { " ($($r.srcMB)MB -> $($r.outMB)MB)" } else { "" }
    $status = if ($r.blobUrl -match '^https') { " OK " } else { "FAIL" }
    Write-Host "[$status] $($r.id)$saved"
}
Write-Host ""
Write-Host "Results: $resultsPath" -ForegroundColor Cyan
