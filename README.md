# YouTube Analytics Dashboard

A vanilla JavaScript dashboard that fetches and visualizes YouTube channel statistics using the YouTube Data API v3.

## Features

- **Channel overview** — name, description, banner, subscriber count, total views, country, join date
- **6 stat cards** — Total Views, Subscribers, Est. Engagement Rate, Est. Monthly Revenue, Est. Avg Watch Time
- **Interactive charts** — Subscribers (line), Views (bar), Engagement breakdown (doughnut) via Chart.js
- **Video browser** — sorted tabs: Most Viewed, Most Liked, Most Discussed, Engagement, Recent
- **Paste auto-scrape** — paste any YouTube video URL to auto-load its channel
- **Channel search** — search by name/handle with keyboard navigation
- **Export** — download video data as CSV or JSON
- **Dark/light theme** — persisted to localStorage
- **Client-side caching** — localStorage with TTL and version invalidation

## Usage

1. Replace the API key in `config.js` with your own from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Enable the **YouTube Data API v3**
   - Restrict the key to that API and your domain for security
2. Open `index.html` in a browser (or serve via any static server)
3. Paste a channel ID, handle, or YouTube video link, and click **Analyze**

> **Local development:** create `config.local.js` (ignored by git) with `window.LOCAL_API_KEY = 'your_key_here';` to override the key without modifying `config.js`.

## Stack

- Vanilla HTML / CSS / JavaScript (no build step)
- [Chart.js](https://www.chartjs.org/) via CDN
- YouTube Data API v3

## Project Structure

```
├── index.html       # Page structure, script load order
├── style.css        # All styles, dark mode, responsive
├── config.js        # App config, API key, chart presets
├── utils.js         # Formatting, caching, helpers
├── api.js           # YouTube API calls, data generation
├── charts.js        # Chart.js initialization and updates
├── ui.js            # DOM rendering, export, skeletons
└── script.js        # Entry point, event wiring
```
