# fix-app-references.ps1
# Fix internal references in moved app files
# Run from project root AFTER migrate-to-folders.ps1

Write-Host "=== Fixing back-to-home links ===" -ForegroundColor Cyan

$filesToFix = @(
    "apps/math/distributive_law.html",
    "apps/math/fractions_game.html",
    "apps/geography/geography_worksheet.html",
    "apps/bible/leviticus9.html",
    "apps/hebrew/memory-initial.html",
    "apps/hebrew/memory.html",
    "apps/english/memory_en.html",
    "apps/science/metals2.html",
    "apps/generators/play.html",
    "apps/hebrew/start_with.html"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $content = $content -replace "href='index\.html'", "href='../../index.html'"
        $content = $content -replace 'href="index\.html"', 'href="../../index.html"'
        $content = $content -replace "'index\.html'", "'../../index.html'"
        Set-Content $file $content -Encoding UTF8
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [--] $file (not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Fixing image paths in geography files ===" -ForegroundColor Cyan

$geoFile1 = "apps/geography/geography.html"
if (Test-Path $geoFile1) {
    $c = Get-Content $geoFile1 -Raw -Encoding UTF8
    $c = $c.Replace('src="world-map.jpg"', 'src="../../assets/images/world-map.jpg"')
    Set-Content $geoFile1 $c -Encoding UTF8
    Write-Host "  [OK] $geoFile1" -ForegroundColor Green
}

$geoFile2 = "apps/geography/geography_worksheet.html"
if (Test-Path $geoFile2) {
    $c = Get-Content $geoFile2 -Raw -Encoding UTF8
    $c = $c.Replace('src="world-map.jpg"', 'src="../../assets/images/world-map.jpg"')
    Set-Content $geoFile2 $c -Encoding UTF8
    Write-Host "  [OK] $geoFile2" -ForegroundColor Green
}

$geoFile3 = "apps/geography/geography3.html"
if (Test-Path $geoFile3) {
    $c = Get-Content $geoFile3 -Raw -Encoding UTF8
    $c = $c.Replace('src="continents.jpg"', 'src="../../assets/images/continents.jpg"')
    $c = $c.Replace('src="continents_blank.jpg"', 'src="../../assets/images/continents_blank.jpg"')
    Set-Content $geoFile3 $c -Encoding UTF8
    Write-Host "  [OK] $geoFile3" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Fixing letters/ audio path ===" -ForegroundColor Cyan

$letterFiles = @("apps/hebrew/memory.html", "apps/hebrew/memory-initial.html")
foreach ($file in $letterFiles) {
    if (Test-Path $file) {
        $c = Get-Content $file -Raw -Encoding UTF8
        $c = $c.Replace("'letters/", "'../../letters/")
        Set-Content $file $c -Encoding UTF8
        Write-Host "  [OK] $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Fixing data/ path in play.html ===" -ForegroundColor Cyan

$playFile = "apps/generators/play.html"
if (Test-Path $playFile) {
    $c = Get-Content $playFile -Raw -Encoding UTF8
    $c = $c.Replace('`data/', '`../../data/')
    Set-Content $playFile $c -Encoding UTF8
    Write-Host "  [OK] $playFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== All done! ===" -ForegroundColor Green
