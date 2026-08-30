# Installs the BGUTeachingCenter subscription reminder into your PERSONAL
# Claude Code user settings (~/.claude/settings.json) on Windows.
#
# It touches ONLY your own machine's user config - never any repo - so other
# collaborators on the BGU projects are not affected.
#
# Safe to re-run: it backs up your settings and merges the hooks in without
# removing anything you already have.

$ErrorActionPreference = 'Stop'

$ClaudeDir    = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE '.claude' }
$SettingsPath = Join-Path $ClaudeDir 'settings.json'
$SrcDir       = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptSrc    = Join-Path $SrcDir    'bgu-subscription-reminder.ps1'
$ScriptDst    = Join-Path $ClaudeDir 'bgu-subscription-reminder.ps1'

if (-not (Test-Path $ScriptSrc)) { throw "Can't find $ScriptSrc" }
New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null

# 1) Copy the hook script into ~/.claude
Copy-Item -Force $ScriptSrc $ScriptDst
Write-Host "OK  Installed hook script -> $ScriptDst"

$cmd = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$ScriptDst`""

# 2) Load settings (or start fresh), backing up first.
if (Test-Path $SettingsPath) {
  Copy-Item $SettingsPath ("$SettingsPath.bak." + (Get-Date -Format 'yyyyMMddHHmmss'))
  $json = Get-Content -Raw -Path $SettingsPath
  if ([string]::IsNullOrWhiteSpace($json)) { $json = '{}' }
} else {
  $json = '{}'
}

# Turn the JSON into a mutable hashtable tree.
function ConvertTo-Hashtable($obj) {
  if ($obj -is [System.Management.Automation.PSCustomObject]) {
    $h = [ordered]@{}
    foreach ($p in $obj.PSObject.Properties) { $h[$p.Name] = ConvertTo-Hashtable $p.Value }
    return $h
  } elseif ($obj -is [System.Collections.IEnumerable] -and $obj -isnot [string]) {
    return ,@($obj | ForEach-Object { ConvertTo-Hashtable $_ })
  } else {
    return $obj
  }
}

$cfg = ConvertTo-Hashtable ($json | ConvertFrom-Json)
if ($cfg -isnot [System.Collections.IDictionary]) { $cfg = [ordered]@{} }
if (-not $cfg.Contains('hooks') -or $cfg['hooks'] -isnot [System.Collections.IDictionary]) {
  $cfg['hooks'] = [ordered]@{}
}

function Set-ReminderHook($hooks, $eventName, $cmd) {
  $existing = @()
  if ($hooks.Contains($eventName)) { $existing = @($hooks[$eventName]) }
  # Drop any previous copy of this hook so re-running does not duplicate it.
  $kept = @()
  foreach ($entry in $existing) {
    $isOurs = $false
    if ($entry -is [System.Collections.IDictionary] -and $entry.Contains('hooks')) {
      foreach ($h in @($entry['hooks'])) {
        if ($h -is [System.Collections.IDictionary] -and "$($h['command'])" -like '*bgu-subscription-reminder.ps1*') { $isOurs = $true }
      }
    }
    if (-not $isOurs) { $kept += $entry }
  }
  $kept += [ordered]@{ hooks = @([ordered]@{ type = 'command'; command = $cmd }) }
  $hooks[$eventName] = [object[]]$kept
}

Set-ReminderHook $cfg['hooks'] 'SessionStart'     $cmd
Set-ReminderHook $cfg['hooks'] 'UserPromptSubmit' $cmd

($cfg | ConvertTo-Json -Depth 20) | Set-Content -Path $SettingsPath -Encoding UTF8
Write-Host "OK  Merged SessionStart + UserPromptSubmit hooks into $SettingsPath"
Write-Host ""
Write-Host "Done. Open Claude Code's /hooks menu once (or restart) to load it."
