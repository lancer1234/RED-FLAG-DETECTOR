# RED FLAG DETECTOR

A mobile-first relationship scenario game built with plain HTML, CSS and JavaScript.

## Structure

- `index.html` — UI structure and overlays
- `styles.css` — visual system, responsive layout and interaction states
- `data.js` — personas and the 132-scenario content library
- `interactions.js` — contextual answer choices, character replies and branching story events
- `app.js` — deck generation, scoring, rendering, story flow and result logic

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
- Contextual A / B / C answers replace the old small set of globally repeated reaction templates
- Major and recurring scenarios can pause after a choice to show an in-character response
- The player explicitly continues after a response instead of every question auto-skipping immediately
- Selected turning-point scenarios have branching story events; A / B / C can produce different dialogue and consequences
- Rare event files have a low appearance rate and are capped at one per run
- Consistent persona portrait seed across repeated appearances
- Immediate stat-change feedback after each choice
- Keyboard A / B / C reaction controls; Enter / Space continues a response panel
- Multiple result archetypes
- Copyable result summary
- 1080×1920 shareable PNG result card generated locally in the browser
- Reduced-motion support and keyboard accessibility

## Interaction design

The scenario library and interaction writing are intentionally separated. `data.js` describes what happens and who it belongs to. `interactions.js` decides how the player can respond, how that persona answers back, and whether the moment becomes a story event. This keeps answer writing tied to the actual situation without making deck logic or persona data difficult to maintain.

High-impact scenarios have hand-written answer sets. Remaining scenarios use persona-specific fallback responses rather than the previous global `boundary / trust / positive / social` answer sets, which significantly reduces repeated wording and keeps the response tone aligned with the same recurring person.

Character responses are not shown after every question. Story-arc stages, rare files and a subset of standalone situations pause for an in-character response; lighter questions can still move forward automatically to preserve pacing.

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
