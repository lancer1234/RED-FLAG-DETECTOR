# RED FLAG DETECTOR

A mobile-first relationship scenario game built with plain HTML, CSS and JavaScript.

## Structure

- `index.html` — UI structure and overlays
- `styles.css` — visual system, responsive layout, event cards and danger states
- `data.js` — personas and the 132 character-scenario library
- `choices.js` — dedicated A / B / C choices for every current character scenario ID
- `events.js` — systemic event cards with their own choices and stat effects
- `interactions-v2.js` — in-character replies and branching story events
- `flavor.js` — scenario-safe entertainment hooks / episode-style presentation copy
- `app.js` — deck generation, scoring, Reigns-style survival rules, rendering, story memory, recap flow and result logic

## Current gameplay

- FULL SCAN: fixed 15 cards
- QUICK SCAN: fixed 8 cards
- 132 character scenarios: 120 standard scenarios + 12 rare files
- 16 separate systemic event cards
- FULL SCAN inserts 2 event cards; QUICK SCAN inserts 1 event card
- 12 recurring core personas rather than disposable one-off characters
- Each core persona has two separate three-stage story arcs plus standalone situations
- Regular scenarios hide persona names and emphasize relationship status
- Rare / special files reveal the character name
- Four survival stats: LOVE / RADAR / STANDARD / CHAOS
- Any stat reaching 0 or 100 immediately ends the run with one of eight extreme endings
- Event cards intentionally create larger stat swings and can push a run toward an extreme ending
- Every character scenario ID has its own dedicated A / B / C choice set
- Story-arc stages and rare files can pause after a choice to show an in-character response
- Selected turning points use branching story events, so A / B / C can produce different dialogue and consequences
- Story continuation screens show `PREVIOUSLY ON // 上回提要` before stage 2 / 3
- Recaps include the previous event, the player's earlier choice, the character reply and the consequence when available
- Flavor copy never borrows a random line from another scenario: exact hooks are used when written, otherwise the scenario's own type is shown
- FULL SCAN has an 88% chance to include one complete three-stage character arc; QUICK SCAN uses 65%
- Rare files remain capped at one per run
- Recurring personas keep a consistent visual identity, but the 12 personas now vary in hairstyle, glasses, facial hair, accessories, clothing and props
- System event cards use a separate pixel-card visual language rather than a character portrait
- Immediate stat-change feedback after each choice
- Stats visually warn when approaching the 0 / 100 danger zone
- Keyboard A / B / C reaction controls; Enter / Space continues a response panel
- Normal end-of-run archetypes remain for runs that survive all cards
- Copyable result summary and 1080×1920 shareable PNG result card

## Reigns-style survival layer

The four meters are no longer only personality scores. They are survival resources. After every choice, the game checks all four values. Reaching either edge ends the run immediately.

Extreme endings exist for:

- LOVE 0 / LOVE 100
- RADAR 0 / RADAR 100
- STANDARD 0 / STANDARD 100
- CHAOS 0 / CHAOS 100

If the player survives the full deck without touching an edge, the existing relationship archetype result system is used instead.

## Event cards

Event cards are not tied to one recurring persona. They represent outside pressure and unpredictable situations such as:

- a friend's dating-app screenshot
- a drunk-message draft
- a suspicious mutual friend
- accidentally reacting to an old story
- an ex's wedding invitation
- a dating-app algorithm resurfacing someone
- travel deposits and money decisions
- a unanimous group-chat warning
- family pressure
- both phones dying on a date
- a sudden work trip
- an unknown caller who knows the other person's name
- birthdays, wedding +1 decisions, ranking conversations and running into an ex

They use the same A / B / C controls but generally have stronger stat effects than ordinary character cards.

## Story memory / recap

The game stores the player's choices during the current run. When stage 2 or 3 of the same story arc appears after several unrelated cards, a recap restores context before the new situation appears.

A recap can show what happened, what the player chose, what the character replied and the branch consequence. It uses relationship status rather than revealing regular persona names.

## Deck rules

Session length never grows with the content library. FULL SCAN stays at 15 cards and QUICK SCAN stays at 8. One complete three-stage character arc can be inserted in order, rare files are capped at one per run, and event-card slots are reserved separately so an event never breaks a three-stage story sequence.

## Deferred features

The following are intentionally not included yet:

- Two-player compatibility mode
- Party / big-screen live voting mode
- Anonymous community submission backend

## Run

No build step is required. Open `index.html` directly or serve the repository with any static web server.
