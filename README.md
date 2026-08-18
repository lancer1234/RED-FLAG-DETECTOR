# RED FLAG DETECTOR

A mobile-first relationship scenario game built with plain HTML, CSS and JavaScript.

## Structure

- `index.html` — UI structure and overlays
- `styles.css` — visual system, responsive layout and animations
- `data.js` — personas, scenario library and reusable reaction sets
- `app.js` — deck generation, scoring, rendering, story arcs and result logic

## Current gameplay

- FULL SCAN: fixed 15 randomized scenarios
- QUICK SCAN: fixed 8 randomized scenarios
- 60 standard scenarios + 6 rare files
- Every scenario is bound to a defined persona with a consistent relationship status, communication style and behavior pattern
- RED / GREEN flag judgement before the player's reaction choice
- Separate flag detection accuracy score
- Four player stats: LOVE / RADAR / STANDARD / CHAOS
- Three-stage recurring-character story arcs that can appear within one run
- Rare event files with a low appearance rate
- Consistent persona portrait seed across repeated appearances
- Immediate stat-change feedback after each choice
- Keyboard R / G judgement controls and A / B / C reaction controls
- Multiple result archetypes including high-accuracy detection result
- Copyable result summary
- 1080×1920 shareable PNG result card generated locally in the browser
- Reduced-motion support and keyboard accessibility

## Deck rules

The question library can grow without increasing session length. A run always keeps its selected mode length. Story-arc rounds are inserted in sequence, rare files are limited to at most one per run, and filler questions are sampled from non-arc scenarios to prevent continuity errors.

## Deferred features

The following are intentionally not included yet:

- Two-player compatibility mode
- Party / big-screen live voting mode
- Anonymous community submission backend

## Run

No build step is required. Open `index.html` directly or serve the repository with any static web server.
