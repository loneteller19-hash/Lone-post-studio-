#!/data/data/com.termux/files/usr/bin/bash
# Starts the app, keeps phone awake so schedules fire, and (optionally) opens a public tunnel for Instagram.
cd "$(dirname "$0")"
command -v termux-wake-lock >/dev/null && termux-wake-lock
node server.js &
if [ "$1" = "tunnel" ]; then
  echo "Copy the https://...trycloudflare.com URL below into PUBLIC_URL in .env, then restart."
  cloudflared tunnel --url http://localhost:${PORT:-3000}
else
  wait
fi
