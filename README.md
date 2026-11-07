# startpage

A pixel-scenery new tab page: greeting, search, clock, weather, GitHub activity, bookmarks, tasks, notes, a music player and a daily quote. It has switchable **spaces** (Home / Work / Gaming / Dev / your own) and a **Customize** panel for layout, widgets, theme, background and accent color.

Plain HTML/CSS/JS. No build step and no dependencies. All data stays in `localStorage` (plus IndexedDB for a custom background image).

## Run it

- **Locally:** open `index.html`, or serve the folder (`npx serve .`).
- **GitHub Pages:** `.github/workflows/pages.yml` deploys every push to `main` to https://vardirhq.github.io/startpage/. One-time setup: *Settings → Pages → Build and deployment → Source: GitHub Actions*. Then set the URL as your homepage (Firefox: *Settings → Home → Homepage and new windows → Custom URLs*; Chrome: *Settings → On startup*). Chrome can't point the new tab at a URL without an extension; use the unpacked-extension route below for that.
- **On your phone (or as a desktop app):** open the Pages URL and choose *Install app* / *Add to Home screen* (or `>install` in the search bar where the browser offers it). It runs full-screen and works offline: `sw.js` caches the app shell (stale-while-revalidate, so a new version shows up on the next open) and leaves every API call live.
- **As a real new tab (Chrome / Edge / Brave):** `chrome://extensions` → enable *Developer mode* → *Load unpacked* → pick this folder. `manifest.json` overrides the new tab page.
- **Chrome Web Store:** `scripts/package.sh` runs the tests and builds `dist/startpage-<version>.zip` (it also fails on inline scripts or `eval`, which MV3 forbids). Pushing a `v*` tag that matches `manifest.json`'s version runs `.github/workflows/extension.yml`, which attaches the zip to a GitHub release. Uploading to the store is manual: the listing copy is in `store/listing.md`, the screenshots and promo tile are in `store/`, and the privacy policy is `PRIVACY.md`. The extension needs no permissions: every API it calls allows cross-origin requests.
- **Firefox:** the same script also builds `dist/startpage-<version>-firefox.zip`, adding the Manifest V3 settings addons.mozilla.org requires: an add-on ID and the data-collection declaration (`required: ["none"]`; location, name, questions to Claude and bookmark domains listed as optional, since they only go to third-party services you turn on). `npx web-ext lint` reports 0 errors; its warnings are the usual ones about `innerHTML`, and everything inserted that way is escaped. Try it with *about:debugging → This Firefox → Load Temporary Add-on*.

## First run

A fresh browser opens a short, skippable setup: your name, your city (optional), and a voice. Each voice card previews how that voice would greet you, using your name, and the setup re-voices itself as you pick one. Skipping counts as done; run it again from Settings → Profile or with `>setup`. Browsers that already have saved data never see it.

Whatever you skip stays empty, and the page starts with no personal data: no name (the greeting says "friend"), no location (Weather and Forecast show a *Set location* button, and the clock uses your browser's time zone), and a few self-explaining example tasks, notes, habits and a New Year countdown. Replace or delete them as you like; **Reset all** in Settings brings these defaults back.

## What's on it

**Modules:** search · clock · weather · forecast (24h chart, wind, UV, sunrise/sunset, air quality) · GitHub activity · repo vitals · bookmarks · tasks · notes · focus timer · calendar (ISO weeks) · countdowns · world clocks · habits (streaks + heatmap) · news (Hacker News / dev.to) · music · daily quote

**Spaces:** each space (Home, Work, Gaming, Dev, your own) has its own widget set, order and card sizes.

**Voices:** eight personalities rewrite *all* of the page's copy: greetings, widgets, the Customize panel, settings, dialogs, placeholders and toasts. Neutral is the baseline; Monday ("Ugh. It's you again"), Super Supportive, Surfer, Professional, Therapist, Weepy and Victorian are each pushed to the extreme of themselves, and each has opinions about the others in the voice picker. Wherever a voice renames a control, hovering shows the plain wording. Copy lives in `js/voices.js`; the concept comes from [Dead Repo](https://github.com/MadsenDev/dead-repo), as does the alive / fading / flatlined / dead classification used by *Repo vitals*.

**Reactions:** voices react as things happen: a task ticked, added or deleted unfinished, the timer paused at 23:41 ("Paused at 23:41. Called it."), a streak that ended while you were away, a 3am visit, the 20th visit today. They come one at a time, and the frequent ones only now and then (`js/react.js`).

**Secret voices:** three more voices sit locked in the picker until you earn them. **Night Owl**: open a tab after midnight on five nights. **Ghost**: stay away for a week ("oh. you're alive."). **Proud Parent**: keep a habit going for 30 days. Each one introduces itself when unlocked, and your current voice has something to say about it (`js/secrets.js`).

**Voices arguing:** roughly one hour in three, another voice butts in under the summary line ("Monday: She counts your visits. That's not love. That's surveillance."). **Chaos mode** (Customize → Voice, or `>chaos`) gives every card its own voice, reshuffled daily or with `>shuffle voices`.

**Wrapped:** the first tab each Sunday opens a weekly recap narrated by the current voice: tasks done and added, focus time, best streak, visits (and how many after midnight), tasks dropped, dead repos. **Save image** exports a 1080×1350 PNG over your pixel scene. Open it any time with `>wrapped` or from Settings (`js/wrapped.js`).

**Ask a voice:** type `? anything` in the search bar and the current voice answers in character, using the Claude API with **your own key** (Settings → Ask a voice; Claude Opus 5.5 by default, with Sonnet 5.5 and Haiku 5.5 as cheaper options). The request goes straight from the browser to Anthropic, with the voice's persona and your open tasks as context. *Security trade-off:* the key is kept in this browser's `localStorage`, outside the synced and exported data, but any script on the page (or an extension with access to it) could read it. Use a key with a low spending limit (`js/ask.js`).

**Ask can do things:** besides answering, Ask has tools. "? remind me to call mum tomorrow" adds the task, "? start a 25 minute focus session" starts the timer, and it can tick off tasks, add notes, habits and countdowns, check off a habit, change the scene, or read your week's numbers. The chat shows each thing it did. Tool input is validated before anything runs; a malformed call is sent back to Claude as an error instead of being run.

**Morning brief:** the first tab of the day (before noon) opens a short brief in the current voice: the weather, your open tasks, a streak you'd lose by skipping today, and what's coming up this week. *Read it to me* reads it aloud; with an API key, *Have Monday write it* rewrites it in character. Turn it off in Customize → Voice, or open it any time with `>brief` (`js/brief.js`).

**Grudges:** voices remember how you treat them: how often you left, who for, how long you stayed away. Leave Monday twice and switch back, and she'll mention it ("You left me for Super Supportive twice. I counted."). A few voices also bring it up in the summary line. Super Supportive gets clingier the longer you're gone (`js/bonds.js`).

**Voices out loud:** turn on *Read reactions and answers aloud* and the browser's built-in speech reads voiced toasts, Ask answers and the brief, each voice with its own pitch and pace (a slow Victorian, a breathless Supportive, a barely-there Ghost). Stage directions like *sobs* are skipped (`js/speak.js`).

**Make your own voice:** Customize → Voice → *Create a voice*. Describe it ("a pirate who hates Mondays") and Claude writes the voice with your key: greetings, the summary line, reactions, weather comments and the main labels. The rest falls back to Neutral. Custom voices sync with your other settings and can be shared as a link (`#voice=…`, compressed) or a file. Anything imported is treated as untrusted: only known keys are kept, lengths are capped, placeholders are filled from a fixed list, and it is always shown as text, never as HTML (`js/maker.js`).

**Achievements and reward scenes:** 13 achievements (finish 50 tasks, 10 focus sessions, a 30-day streak, try every voice, unlock the secret ones…) are listed under Settings with progress bars. Three of them unlock new scenes: **Dunes**, **Harbor** and **Polar Night**. Existing data counts, and is awarded quietly the first time (`js/achieve.js`).

**Live sky:** the pixel scene follows the real world. It rains, snows, fogs or storms when it does outside; the light follows your actual sunrise and sunset (dawn, day, dusk, night); and the calendar adds December flurries, New Year's Eve fireworks and Halloween bats. It only needs your location; turn it off in Customize → Theme (`js/sky.js`).

**Command palette:** in the search bar, type `>` for commands (`>task buy milk`, `>theme forest`, `>space dev`, `>timer`…), or just type math (`sqrt(2)*12^2`), unit conversions (`5 km to mi`, `100 c to f`), or date math (`days until 2027-07-01`, `week`).

**Animated background:** twinkling stars, shooting stars, water shimmer, flickering city windows, snow (Nordic), fireflies (Forest), drifting dust (Minimal). It runs at ~12 fps on a 384×216 canvas, pauses when the tab is hidden, and is off when reduced motion is requested.

**Sync:** with a GitHub token that has `gist` access, Settings → Sync keeps devices in step through a private Gist (e.g. this site and the browser extension). The token itself is never uploaded; the newest copy wins.

## Tests

```
node --test test/*.test.js
```

Covers the search bar's math parser (no `eval`) and unit conversion, and renders every line of every voice (reactions, heckles and Wrapped included) against rich and empty data to catch `undefined`, `NaN` and the like. It also checks secret-voice locking, the Ask persona prompt, grudges, the morning brief, speech clean-up, the voice maker's sanitizing and share links, and that every file in `js/` is loaded. The Pages workflow runs them before every deploy.

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
