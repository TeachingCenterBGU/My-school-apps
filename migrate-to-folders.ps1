# migrate-to-folders.ps1
# Run from project root: .\migrate-to-folders.ps1

Write-Host "=== Creating folders ===" -ForegroundColor Cyan

$folders = @(
    "apps/english",
    "apps/hebrew", 
    "apps/math",
    "apps/bible",
    "apps/science",
    "apps/geography",
    "apps/generators",
    "assets/images"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  + $folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Moving files ===" -ForegroundColor Cyan

$english = @(
    "english.html",
    "english-unit2.html",
    "english-unit2-5th-grade.html",
    "eng-unit2-worksheet.html",
    "eng-unit3-worksheet.html",
    "have-has.html",
    "have-has-worksheet.html",
    "word_game_en.html",
    "memory_en.html"
)
foreach ($f in $english) {
    if (Test-Path $f) { 
        Move-Item $f "apps/english/" -Force
        Write-Host "  english/ <- $f" -ForegroundColor Yellow
    }
}

$hebrew = @(
    "milim.html",
    "grammer.html",
    "spelling_game.html",
    "VerbsGame.html",
    "word_game_2.html",
    "start_with.html",
    "memory.html",
    "memory-initial.html"
)
foreach ($f in $hebrew) {
    if (Test-Path $f) {
        Move-Item $f "apps/hebrew/" -Force
        Write-Host "  hebrew/  <- $f" -ForegroundColor Yellow
    }
}

$math = @(
    "addition.html",
    "multiplication1.html",
    "calc8.html",
    "distributive_law.html",
    "math_game.html",
    "fractions_game.html",
    "worksheet_fractions.html",
    "geometry.html",
    "geometry2.html"
)
foreach ($f in $math) {
    if (Test-Path $f) {
        Move-Item $f "apps/math/" -Force
        Write-Host "  math/    <- $f" -ForegroundColor Yellow
    }
}

$bible = @(
    "genesis_28_29_31.html",
    "leviticus9.html",
    "leviticus9_13.html",
    "Leviticus19.html"
)
foreach ($f in $bible) {
    if (Test-Path $f) {
        Move-Item $f "apps/bible/" -Force
        Write-Host "  bible/   <- $f" -ForegroundColor Yellow
    }
}

$science = @(
    "Materials_fix.html",
    "metals.html",
    "metals2.html"
)
foreach ($f in $science) {
    if (Test-Path $f) {
        Move-Item $f "apps/science/" -Force
        Write-Host "  science/ <- $f" -ForegroundColor Yellow
    }
}

$geography = @(
    "geography.html",
    "geography3.html",
    "geography_worksheet.html"
)
foreach ($f in $geography) {
    if (Test-Path $f) {
        Move-Item $f "apps/geography/" -Force
        Write-Host "  geography/ <- $f" -ForegroundColor Yellow
    }
}

$generators = @(
    "generator.html",
    "generator2.html",
    "play.html"
)
foreach ($f in $generators) {
    if (Test-Path $f) {
        Move-Item $f "apps/generators/" -Force
        Write-Host "  generators/ <- $f" -ForegroundColor Yellow
    }
}

$images = @(
    "continents.jpg",
    "continents_blank.jpg",
    "world-map.jpg"
)
foreach ($f in $images) {
    if (Test-Path $f) {
        Move-Item $f "assets/images/" -Force
        Write-Host "  images/  <- $f" -ForegroundColor Yellow
    }
}
if (Test-Path "worldmap.jpg") {
    Move-Item "worldmap.jpg" "assets/images/" -Force
    Write-Host "  images/  <- worldmap.jpg" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "Now run: .\fix-app-references.ps1" -ForegroundColor Magenta
