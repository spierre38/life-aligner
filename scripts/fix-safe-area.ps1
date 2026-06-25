$base = 'c:\Users\Barnes Building\Documents\life-aligner'
$files = @(
  'app\dashboard\page.tsx',
  'app\reflections\page.tsx',
  'app\settings\page.tsx',
  'app\resources\page.tsx',
  'app\todo\MobileInbox.tsx',
  'app\todo\DesktopTodoPad.tsx',
  'app\roadmap\page.tsx',
  'app\roadmap\components\MobileGoalList.tsx',
  'app\roadmap\components\BubbleCanvas.tsx',
  'app\roadmap\components\FTUECategoryPicker.tsx',
  'app\roadmap\components\GoalDetailView.tsx',
  'app\chapters\page.tsx'
)

foreach ($f in $files) {
  $p = Join-Path $base $f
  if (Test-Path $p) {
    $c = Get-Content $p -Raw
    $n = $c -replace 'min-h-screen pt-16', 'min-h-screen pt-navbar'
    if ($c -ne $n) {
      Set-Content $p $n -NoNewline
      Write-Host "Updated: $f"
    } else {
      Write-Host "No change: $f"
    }
  } else {
    Write-Host "Not found: $f"
  }
}
