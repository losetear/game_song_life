#!/bin/bash
export ANTHROPIC_AUTH_TOKEN="5f84c969f0204d90b582660849535234.oLO0Z6VSzAa9PnoA"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export API_TIMEOUT_MS="3000000"
cd /mnt/c/GameDev/game_song_life

PROMPT=$(cat CLAUDE_TASK.md)

exec claude -p "$PROMPT" --allowedTools "Read,Edit,Write,Bash" --max-turns 40
