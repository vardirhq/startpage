# startpage

A pixel-scenery new tab page: greeting, search, clock, weather, GitHub activity, bookmarks, tasks, notes, a music player and a daily quote. It has switchable **spaces** (Home / Work / Gaming / Dev / your own) and a **Customize** panel for layout, widgets, theme, background and accent color.

Plain HTML/CSS/JS. No build step and no dependencies. All data stays in `localStorage` (plus IndexedDB for a custom background image).

## Run it

- **Locally:** open `index.html`, or serve the folder (`npx serve .`).
- **GitHub Pages:** `.github/workflows/pages.yml` deploys every push to `main` to https://vardirhq.github.io/startpage/. One-time setup: *Settings → Pages → Build and deployment → Source: GitHub Actions*. Then set the URL as your homepage (Firefox: *Settings → Home → Homepage and new windows → Custom URLs*; Chrome: *Settings → On startup*). Chrome can't point the new tab at a URL without an extension; use the unpacked-extension route below for that.
- **As a real new tab (Chrome / Edge / Brave):** `chrome://extensions` → enable *Developer mode* → *Load unpacked* → pick this folder. `manifest.json` overrides the new tab page.

## First run

A fresh browser opens a short, skippable setup: your name, your city (optional), and a voice. Each voice card previews how that voice would greet you, using your name, and the setup re-voices itself as you pick one. Skipping counts as done; run it again from Settings → Profile or with `>setup`. Browsers that already have saved data never see it.

Whatever you skip stays empty, and the page starts with no personal data: no name (the greeting says "friend"), no location (Weather and Forecast show a *Set location* button, and the clock uses your browser's time zone), and a few self-explaining example tasks, notes, habits and a New Year countdown. Replace or delete them as you like; **Reset all** in Settings brings these defaults back.

## What's on it

**Modules:** search · clock · weather · forecast (24h chart, wind, UV, sunrise/sunset, air quality) · GitHub activity · repo vitals · bookmarks · tasks · notes · focus timer · calendar (ISO weeks) · countdowns · world clocks · habits (streaks + heatmap) · news (Hacker News / dev.to) · music · daily quote

**Spaces:** each space (Home, Work, Gaming, Dev, your own) has its own widget set, order and card sizes.

**Voices:** eight personalities rewrite *all* of the page's copy: greetings, widgets, the Customize panel, settings, dialogs, placeholders and toasts. Neutral is the baseline; Monday ("Ugh. It's you again"), Super Supportive, Surfer, Professional, Therapist, Weepy and Victorian are each pushed to the extreme of themselves, and each has opinions about the others in the voice picker. Wherever a voice renames a control, hovering shows the plain wording. Copy lives in `js/voices.js`; the concept comes from [Dead Repo](https://github.com/MadsenDev/dead-repo), as does the alive / fading / flatlined / dead classification used by *Repo vitals*.

**Command palette:** in the search bar, type `>` for commands (`>task buy milk`, `>theme forest`, `>space dev`, `>timer`…), or just type math (`sqrt(2)*12^2`), unit conversions (`5 km to mi`, `100 c to f`), or date math (`days until 2027-07-01`, `week`).

**Animated background:** twinkling stars, shooting stars, water shimmer, flickering city windows, snow (Nordic), fireflies (Forest), drifting dust (Minimal). It runs at ~12 fps on a 384×216 canvas, pauses when the tab is hidden, and is off when reduced motion is requested.

**Sync:** with a GitHub token that has `gist` access, Settings → Sync keeps devices in step through a private Gist (e.g. this site and the browser extension). The token itself is never uploaded; the newest copy wins.

## Tests

```
node --test test/*.test.js
```

Covers the search bar's math parser (no `eval`) and unit conversion. The Pages workflow runs them before every deploy.

## Keyboard

| Key | Action |
| --- | --- |
| `Ctrl/⌘ K` or `/` | Focus search |
| `!gh`, `!mdn`, `!yt`, `!w`, `!npm`, `!so`, `!r`, `!maps` | Search a specific site |
| `>` in search | Command palette |
| `Alt 1…9` | Switch space |
| `Esc` | Close Customize |

Right-click a bookmark tile, world clock or space to edit it. With Customize open, drag cards by their grip to reorder them and use the size button to make a card small, medium or large.

## How each feature works

| Feature | Status | Notes |
| --- | --- | --- |
| Greeting, date, tagline | ✅ | Pure JS. |
| Search + `Ctrl K` | ✅ | Suggests matching bookmarks. In an extension new tab, Chrome focuses the address bar first, so press `/` or click to use the page's search. |
| Clock + location | ✅ | Local time. Location set in Settings (city search or geolocation). |
| Weather | ✅ | [Open-Meteo](https://open-meteo.com): free, no API key, CORS-enabled. Cached for 30 minutes. |
| GitHub activity + CI | ✅ / 🔑 | Public REST API. Without a token: public events plus Actions status (60 req/h, cached for 10 minutes). With a token (stored locally): private repos, plus an unread-notifications badge if it's a classic token with `notifications` scope. |
| Bookmarks + folders | ✅ | Stored locally. Icons come from Google's favicon service (toggle in Settings). Reading the *browser's own* bookmarks needs the `bookmarks` extension permission (not used yet). |
| Tasks, Notes | ✅ | Stored locally. Export/import JSON to move between devices. |
| Theme, accent, background, layout | ✅ | Backgrounds are procedurally generated pixel art (`js/scene.js`), so there are no image assets. Shuffle makes a new scene. Upload your own image if you like. |
| Spaces | ✅ | Each space has its own widget set and order. Data is shared. |
| Music "Now Playing" | ⚠️ | A web page **cannot see what other apps (Spotify, etc.) are playing**. This widget plays your own audio: stream/file URLs or local files. A real Spotify integration is possible via the Spotify Web API (OAuth PKCE, registered app, Premium for playback control). |
| Sync across devices | ⚠️ | Not built in. Use Export/Import, or `chrome.storage.sync` if run as an extension. |
