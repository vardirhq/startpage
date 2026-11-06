# startpage

A pixel-scenery new tab page: greeting, search, clock, weather, GitHub activity, bookmarks, tasks, notes, a music player and a daily quote. It has switchable **spaces** (Home / Work / Gaming / Dev / your own) and a **Customize** panel for layout, widgets, theme, background and accent color.

Plain HTML/CSS/JS. No build step and no dependencies. All data stays in `localStorage` (plus IndexedDB for a custom background image).

## Run it

- **Locally:** open `index.html`, or serve the folder (`npx serve .`).
- **GitHub Pages:** enable Pages on this repo, then set the URL as your browser's homepage / new tab (Firefox: *Settings → Home → Custom URLs*; Chrome needs an extension to replace the new tab).
- **As a real new tab (Chrome / Edge / Brave):** `chrome://extensions` → enable *Developer mode* → *Load unpacked* → pick this folder. `manifest.json` overrides the new tab page.

## Keyboard

| Key | Action |
| --- | --- |
| `Ctrl/⌘ K` or `/` | Focus search |
| `!gh`, `!mdn`, `!yt`, `!w`, `!npm`, `!so`, `!r`, `!maps` | Search a specific site |
| `Alt 1…9` | Switch space |
| `Esc` | Close Customize |

Right-click a bookmark tile or a space to edit it. With Customize open, drag cards by their grip to reorder them.

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
