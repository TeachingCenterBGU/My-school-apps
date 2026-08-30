# BGUTeachingCenter subscription reminder hook (Windows / PowerShell).
#
# Fires on two Claude Code events:
#   * SessionStart      - whenever a session starts / resumes.
#   * UserPromptSubmit  - only when the prompt contains "חזרתי".
#
# If the current git repo's "origin" belongs to the BGUTeachingCenter org,
# it reminds you (via a systemMessage shown in the UI) to switch to your
# second subscription. For any other repo it stays completely silent.
#
# Install: run install.ps1 in this folder (it goes into your PERSONAL
# ~/.claude/settings.json, never into a repo).

$ErrorActionPreference = 'SilentlyContinue'

$raw = [Console]::In.ReadToEnd()
try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$eventName = $data.hook_event_name
$prompt    = $data.prompt
$cwd       = $data.cwd
if ([string]::IsNullOrEmpty($cwd)) { $cwd = (Get-Location).Path }

# Which org owns this repo?
$remote = (git -C $cwd remote get-url origin 2>$null)
if (-not $remote) { exit 0 }

# Not a BGUTeachingCenter project -> stay silent.
if ($remote -notmatch '(?i)teachingcenter') { exit 0 }

# On UserPromptSubmit, only remind when you say you're back ("חזרתי").
if ($eventName -eq 'UserPromptSubmit' -and $prompt -notmatch 'חזרתי') { exit 0 }

$msg = '🔔 הפרויקט הזה שייך ל-BGUTeachingCenter — כדאי לעבור למנוי השני לפני שממשיכים.'
$out = @{ systemMessage = $msg; suppressOutput = $true } | ConvertTo-Json -Compress
[Console]::Out.Write($out)
exit 0
