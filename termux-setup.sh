#!/data/data/com.termux/files/usr/bin/bash
# One-time setup for Termux
set -e
pkg update -y
pkg install -y nodejs git cloudflared termux-api
npm install
[ -f .env ] || cp .env.example .env
echo "Done. Edit .env (nano .env), then run: bash start.sh"
