# Privacy policy: Startpage

_Last updated: 2026-11-06_

Startpage is a new tab page. It has no server, no account and no analytics. The developer receives none of your data.

## What is stored, and where

Everything you enter (name, location, tasks, notes, habits, bookmarks, settings, and a small daily activity log used for the weekly recap) is stored **only in your browser**, in `localStorage` and IndexedDB. Uninstalling the extension or clearing site data deletes it.

## What leaves your browser

Only requests you turn on, sent directly from your browser to these services:

| Service | When | What is sent |
| --- | --- | --- |
| Open-Meteo (`api.open-meteo.com`, `geocoding-api.open-meteo.com`, `air-quality-api.open-meteo.com`) | When you set a location | The city you search for, and the coordinates of your location |
| GitHub API (`api.github.com`) | When you enter a GitHub username | Your username, and your token if you add one |
| GitHub Gist | Only if you turn on Sync | Your startpage data, saved to a **private** gist in your own account. Your token and API key are never included. |
| Hacker News (Algolia) / dev.to | When the News widget is shown | A request for top stories |
| Google favicon service | When bookmark icons are on (you can turn them off) | The domains of your bookmarks |
| Anthropic API (`api.anthropic.com`) | Only when you use "Ask a voice" with your own API key | Your question, the conversation so far, your name, open task titles, best streak and today's visit count, so the voice can answer in context. Handled under [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy). |
| Audio stream URLs | Only the ones you add to the music player | A normal request to that URL |

Your Anthropic API key and GitHub token stay in your browser's storage and go only to the service they belong to.

## Contact

Open an issue at https://github.com/vardirhq/startpage/issues.
