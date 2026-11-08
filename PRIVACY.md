# Privacy policy: Startpage

_Last updated: 2026-11-07_

Startpage is a new tab page. It has no server, no account and no analytics. The developer receives none of your data.

## What is stored, and where

Everything you enter (name, birthday if you give it, location, tasks, notes, habits, bookmarks and how often you open them, time capsules, puzzle progress, mood log, counters, settings, and a small daily activity log used for the weekly recap) is stored **only in your browser**, in `localStorage` and IndexedDB. Uninstalling the extension or clearing site data deletes it.

## What leaves your browser

Only requests you turn on, sent directly from your browser to these services:

| Service | When | What is sent |
| --- | --- | --- |
| Open-Meteo (`api.open-meteo.com`, `geocoding-api.open-meteo.com`, `air-quality-api.open-meteo.com`) | When you set a location | The city you search for, and the coordinates of your location |
| GitHub API (`api.github.com`) | When you enter a GitHub username | Your username, and your token if you add one |
| GitHub Gist | Only if you turn on Sync | Your startpage data, saved to a **private** gist in your own account. Your token and API key are never included. |
| Hacker News (Algolia) / dev.to | When the News widget is shown | A request for top stories |
| Wikipedia (`en.wikipedia.org`) | When the On this day widget is shown | Today's month and day |
| Frankfurter (`api.frankfurter.dev`) | When the Currency widget is shown, or you convert currency in search | A request for the latest exchange rates (nothing about you) |
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | When the page loads | A normal request for the page's typeface, which reveals your IP address to Google, as any web font does |
| Google favicon service | When bookmark icons are on (you can turn them off) | The domains of your bookmarks |
| Anthropic API (`api.anthropic.com`) | Only with your own API key: when you ask a voice something, have it write the morning brief, or create a voice | Your question or voice description, the conversation so far, your name, open task and habit names, best streak and today's visit count, so the voice can answer in context and act on your tasks when asked. Handled under [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy). |
| Audio stream URLs | Only the ones you add to the music player | A normal request to that URL |

Your Anthropic API key and GitHub token stay in your browser's storage and go only to the service they belong to.

Speech ("read aloud") uses your browser's built-in speech synthesis. Shared voice links contain only the voice's wording, never your data.

## Contact

Open an issue at https://github.com/vardirhq/startpage/issues.
