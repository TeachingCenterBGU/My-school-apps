#!/usr/bin/env bash
# Installs the BGUTeachingCenter subscription reminder into your PERSONAL
# Claude Code user settings (~/.claude/settings.json).
#
# It touches ONLY your own machine's user config - never any repo - so other
# collaborators on the BGU projects are not affected.
#
# Safe to re-run: it backs up your settings and merges the hooks in without
# removing anything you already have.

set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_SRC="$SRC_DIR/bgu-subscription-reminder.sh"
SCRIPT_DST="$CLAUDE_DIR/bgu-subscription-reminder.sh"

command -v jq >/dev/null 2>&1 || { echo "❌ jq is required (brew install jq / apt install jq)"; exit 1; }
[ -f "$SCRIPT_SRC" ] || { echo "❌ Can't find $SCRIPT_SRC"; exit 1; }

mkdir -p "$CLAUDE_DIR"

# 1) Copy the hook script into ~/.claude and make it executable.
cp "$SCRIPT_SRC" "$SCRIPT_DST"
chmod +x "$SCRIPT_DST"
echo "✅ Installed hook script -> $SCRIPT_DST"

# 2) Merge the two hooks into settings.json (backup first).
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
cp "$SETTINGS" "$SETTINGS.bak.$(date +%Y%m%d%H%M%S)"

tmp="$(mktemp)"
jq --arg cmd "$SCRIPT_DST" '
  def ensure(ev):
    .hooks[ev] = ((.hooks[ev] // [])
      # drop any previous copy of this hook so re-running does not duplicate it
      | map(select(any(.hooks[]?; .command == $cmd) | not))
      + [ { hooks: [ { type: "command", command: $cmd } ] } ]);
  .hooks = (.hooks // {})
  | ensure("SessionStart")
  | ensure("UserPromptSubmit")
' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"

echo "✅ Merged SessionStart + UserPromptSubmit hooks into $SETTINGS"
echo
echo "Done. Open Claude Code's /hooks menu once (or restart) to load it."
