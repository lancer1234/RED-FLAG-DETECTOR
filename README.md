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
- 132 total scenarios: 120 standard scenarios + 12 rare files
- 12 core personas instead of continuously adding disposable characters
- Each core persona has 10 standard scenarios
- Each persona has two separate three-stage story arcs plus four standalone situations
- Regular scenarios hide persona names and emphasize relationship status
- Rare / special files reveal the character name
- Four player stats: LOVE / RADAR / STANDARD / CHAOS
- Recurring-character story arcs can appear within one run
- Rare event files have a low appearance rate and are capped at one per run
- Consistent persona portrait seed across repeated appearances
- Immediate stat-change feedback after each choice
- Keyboard A / B / C reaction controls
- Multiple result archetypes
- Copyable result summary
- 1080×1920 shareable PNG result card generated locally in the browser
- Reduced-motion support and keyboard accessibility

## Persona story design

The library is built around recurring behavior rather than random one-off quotes. Each persona has a stable behavioral profile, but their scenarios include escalation, repair attempts, grey areas and follow-through. This allows the same person to feel recognizable across multiple sessions without making every appearance identical.

Each persona currently contains:

- Story Arc A: three linked situations
- Story Arc B: three linked situations
- Four independent situations that reinforce or complicate the same personality
- One rare named file that can reveal a more memorable turning point

## Deck rules

The question library can grow without increasing session length. A run always keeps its selected mode length. Only one complete story arc is inserted into a run, its stages remain in order, rare files are limited to at most one per run, and filler questions are sampled from standalone scenarios to prevent continuity errors.

## Deferred features

The following are intentionally not included yet:

- Two-player compatibility mode
- Party / big-screen live voting mode
- Anonymous community submission backend

## Run

No build step is required. Open `index.html` directly or serve the repository with any static web server.
