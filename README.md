# Lone Post Studio

Upload and schedule **YouTube videos / Shorts** and **Instagram Reels** from one form. Runs on a phone with Termux or on any computer. No passwords are ever stored: YouTube uses Google sign-in (OAuth), Instagram uses an official Meta access token.

## Termux (Android)
```bash
pkg install -y git
git clone https://github.com/YOUR_USERNAME/lone-post-studio.git
cd lone-post-studio
bash termux-setup.sh
nano .env            # fill in keys (see below)
bash start.sh        # then open http://localhost:3000 in your phone browser
```
For Instagram, start with a public tunnel: `bash start.sh tunnel`, copy the `trycloudflare.com` URL into `PUBLIC_URL` in `.env`, and restart. Keep Termux open (the script holds a wake lock) so scheduled posts fire.

## Any computer
```bash
git clone https://github.com/YOUR_USERNAME/lone-post-studio.git && cd lone-post-studio
npm install && cp .env.example .env && npm start
```

## Get the keys
**YouTube**: Google Cloud Console → new project → enable *YouTube Data API v3* → OAuth consent screen → create *OAuth client ID (Web)* with redirect URI `http://localhost:3000/auth/google/callback`. Put the ID and secret in `.env`, then click *Sign in with Google* in the app. New unverified projects upload as private until Google audits the app.

**Instagram**: needs a Business/Creator account linked to a Facebook Page. Create a Meta app, add *Instagram Graph API*, generate a long-lived token with `instagram_content_publish`, and put it and your IG user ID in `.env`. Reels must be MP4, 9:16, 3 s–15 min.

## Publish to GitHub
```bash
git init && git add . && git commit -m "Lone Post Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lone-post-studio.git
git push -u origin main
```
`.env`, `uploads/` and `data/` (tokens) are git-ignored, so secrets never get pushed.

## Notes
- Scheduled posts fire only while the server runs.
- Use only accounts you own, and follow each platform's terms.

## Install as an app
**Quick (PWA):** run `bash start.sh`, open `http://localhost:3000` in Chrome, menu (⋮) → *Install app*. It gets its own fox icon and opens full screen.

**APK:** push to GitHub → *Actions* tab → *Build APK* → download `Lone-Post-Studio-APK` → unzip and install `app-debug.apk`. The APK is a shell around the server, so keep `bash start.sh` running in Termux.

## Scheduling
YouTube videos are uploaded right away and **YouTube itself holds the schedule** (private until the publish time), so a long schedule survives a server restart. Instagram Reels are held on the server until their time, so keep the server (and its storage) running for those.
