#!/usr/bin/env bash
# BGUTeachingCenter subscription reminder hook.
#
# Fires on two Claude Code events:
#   * SessionStart      - whenever a session starts / resumes.
#   * UserPromptSubmit  - only when the prompt contains "חזרתי".
#
# If the current git repo's "origin" belongs to the BGUTeachingCenter org,
# it reminds you (via a systemMessage shown in the UI) to switch to your
# second subscription. For any other repo it stays completely silent.
#
# Install: see README.md in this folder (it goes into your PERSONAL
# ~/.claude/settings.json, never into a repo).

set -euo pipefail

input="$(cat)"

# --- Extract fields from the hook JSON (jq preferred, sed fallback) ---
if command -v jq >/dev/null 2>&1; then
  event="$(printf '%s' "$input" | jq -r '.hook_event_name // empty')"
  prompt="$(printf '%s' "$input" | jq -r '.prompt // empty')"
  cwd="$(printf '%s' "$input" | jq -r '.cwd // empty')"
else
  event="$(printf '%s' "$input" | sed -n 's/.*"hook_event_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  prompt="$(printf '%s' "$input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)"[^"]*}[[:space:]]*$/\1/p')"
  cwd="$(printf '%s' "$input" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
fi

[ -n "$cwd" ] || cwd="$PWD"

# --- Which org owns this repo? ---
remote="$(git -C "$cwd" remote get-url origin 2>/dev/null || true)"

# Not a BGUTeachingCenter project -> stay silent.
printf '%s' "$remote" | grep -qi 'teachingcenter' || exit 0

# On UserPromptSubmit, only remind when you say you're back ("חזרתי").
if [ "$event" = "UserPromptSubmit" ]; then
  printf '%s' "$prompt" | grep -q 'חזרתי' || exit 0
fi

msg="🔔 הפרויקט הזה שייך ל-BGUTeachingCenter — כדאי לעבור למנוי השני לפני שממשיכים."

# systemMessage is shown to the user; suppressOutput hides raw stdout noise.
if command -v jq >/dev/null 2>&1; then
  jq -n --arg m "$msg" '{systemMessage: $m, suppressOutput: true}'
else
  printf '{"systemMessage": "%s", "suppressOutput": true}\n' "$msg"
fi
exit 0
