# RED FLAG DETECTOR

A mobile-first relationship scenario game built with plain HTML, CSS and JavaScript.

## Structure

- `index.html` — UI structure and overlays
- `styles.css` — visual system, responsive layout and interaction states
- `data.js` — personas and the 132-scenario content library
- `choices.js` — dedicated A / B / C choices for every current scenario ID
- `interactions-v2.js` — in-character replies and branching story events
- `flavor.js` — short entertainment hooks / episode-style presentation copy
- `app.js` — deck generation, scoring, rendering, story memory, recap flow and result logic

## Current gameplay

- FULL SCAN: fixed 15 randomized scenarios
- QUICK SCAN: fixed 8 randomized scenarios
- 132 total scenarios: 120 standard scenarios + 12 rare files
- 12 recurring core personas rather than disposable one-off characters
- Each core persona has 10 standard scenarios
- Each persona has two separate three-stage story arcs plus four standalone situations
- Regular scenarios hide persona names and emphasize relationship status
- Rare / special files reveal the character name
- Four player stats: LOVE / RADAR / STANDARD / CHAOS
- Every current scenario ID has its own dedicated A / B / C choice set
- Story-arc stages and rare files can pause after a choice to show an in-character response
- Selected turning points use branching story events, so A / B / C can produce different dialogue and consequences
- Story continuation screens show `PREVIOUSLY ON // 上回提要` before stage 2 / 3
- Recaps include the previous event, the player's earlier choice, the character reply and the consequence when available
- Episode-style hooks such as `名分沒有，醋先吃了`, `02:13 // 前任帳號復活` and `訂位呢？` add a lighter entertainment layer without changing persona logic
- FULL SCAN now has an 88% chance to include one complete three-stage character arc; QUICK SCAN uses 65%
- Rare files remain capped at one per run, with slightly higher appearance odds in FULL SCAN
- Consistent persona portrait seed across repeated appearances
- Immediate stat-change feedback after each choice
- Keyboard A / B / C reaction controls; Enter / Space continues a response panel
- Multiple result archetypes
- Copyable result summary
- 1080×1920 shareable PNG result card generated locally in the browser
- Reduced-motion support and keyboard accessibility

## Interaction design

Scenario data, player choices and presentation are intentionally separated. `data.js` describes what happens and which recurring persona it belongs to. `choices.js` supplies the exact three answers for that specific scenario ID. `interactions-v2.js` decides how the character responds and whether the moment becomes a branching story beat. `flavor.js` supplies short episode-style hooks that make otherwise realistic situations faster and more fun to read.

There is no active persona-level answer fallback. If a future scenario is added without a matching entry in `choices.js`, the game exposes a visible `MISSING CHOICE DATA` state rather than borrowing unrelated answers.

## Story memory / recap

The game stores the player's choices during the current run. When stage 2 or 3 of the same story arc appears after several unrelated questions, a recap card restores context before the new situation appears.

A recap can show:

- what happened in the earlier stage
- what the player chose
- what the character replied
- the branch consequence, when the previous choice triggered one

The recap uses relationship status rather than revealing regular persona names, preserving the rule that names are reserved for rare / special files.

## Persona story design

The library is built around recurring behavior rather than random one-off quotes. Each persona has a stable behavioral profile, but their scenarios include escalation, repair attempts, grey areas, repeated habits and follow-through. The goal is for repeat sessions to create recognition — the player should remember the type of person even when a different storyline is drawn.

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
