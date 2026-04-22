#!/bin/bash
# Usage: ./produce.sh "dirname|Game Title|description|category|prompt details"
# Reads lines from stdin or file, runs 5 parallel Claude Code instances

REPO="/tmp/findpicked-games"
QUALITY=$(cat "$REPO/scripts/QUALITY_RULES.txt")

DESIGN='Design: Apple-inspired minimal. bg #fafafa, text #1d1d1f, secondary #6e6e73, accent #0071e3. Font: -apple-system, BlinkMacSystemFont, SF Pro Display, Helvetica Neue, sans-serif. Buttons: rounded pill, 44px min height. White cards, subtle shadows, 16px radius. Responsive, mobile-first.'

produce_one() {
  local spec="$1"
  local dirname=$(echo "$spec" | cut -d'|' -f1)
  local title=$(echo "$spec" | cut -d'|' -f2)
  local gamedir="$REPO/$dirname"
  local prompt=$(echo "$spec" | cut -d'|' -f5)
  
  mkdir -p "$gamedir"
  
  if [ -f "$gamedir/index.html" ] && [ $(wc -c < "$gamedir/index.html") -gt 2000 ]; then
    echo "SKIP $dirname"
    return
  fi
  
  cd "$gamedir"
  CLAUDE_CONFIG_DIR=~/.claude-b claude --permission-mode bypassPermissions --print \
    "Build '$title' as a single index.html. $DESIGN $QUALITY $prompt Write complete file to index.html." \
    > /dev/null 2>&1
  
  if [ -f "$gamedir/index.html" ] && [ $(wc -c < "$gamedir/index.html") -gt 2000 ]; then
    echo "DONE $dirname"
  else
    echo "FAIL $dirname"
  fi
}

export -f produce_one
export REPO QUALITY DESIGN

# Read specs and run 5 at a time
while IFS= read -r line; do
  [ -z "$line" ] && continue
  produce_one "$line" &
  # Limit to 5 parallel
  while [ $(jobs -r | wc -l) -ge 5 ]; do sleep 2; done
done

wait
echo "ALL BATCHES COMPLETE"
