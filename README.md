# RED FLAG DETECTOR

A mobile-first relationship choice game built with plain HTML, CSS and JavaScript.

## Structure

- `index.html` — UI structure and overlays
- `styles.css` / `styles-v2.css` — base visual system plus replayability UI
- `data.js` — 132 recurring-character scenarios
- `choices.js` — dedicated choices for character scenarios
- `events.js` — 16 systemic event cards
- `interactions-v2.js` — character replies and branching beats
- `flavor.js` — scenario-safe entertainment hooks
- `meta.js` — modifiers, hidden traits, cross-event chains and secret endings
- `app-v2.js` — deck generation, scoring, survival rules, character memory, unlocks, encyclopedia and result logic

## Current gameplay

- FULL SCAN stays fixed at 15 cards; QUICK SCAN stays fixed at 8
- 132 character scenarios + 16 systemic event cards
- one recurring three-stage character arc can appear in a run
- FULL SCAN includes 2 event cards; QUICK SCAN includes 1
- regular character cards hide names; Rare Files reveal names
- LOVE / RADAR / STANDARD / CHAOS are Reigns-style survival meters
- any meter reaching 0 or 100 immediately triggers one of eight extreme endings
- surviving the full deck can trigger a normal archetype or a hidden ending

## Replayability systems

### Tonight Modifier
Each run starts with one modifier such as `姐妹就在旁邊`, `微醺模式`, `剛失戀三週`, `旅行模式`, or `諮商後遺症`. The modifier changes how strongly certain stat deltas apply for that run.

### Hidden traits
Choices quietly build traits such as:

- 容易心軟
- 界線很硬
- 細節雷達
- 續集體質
- 直球溝通
- 先算了派
- 看行動派
- 心動優先

Traits are shown only after they become meaningful. They can also unlock a fourth `D` choice on later cards.

### Conditional choices
High RADAR / detective traits can unlock timeline-checking answers. High STANDARD / boundary traits can unlock hard-boundary answers. Strong romantic or chaos builds can unlock corresponding special choices. The UI shows only directional impact (`LOVE ↑`, `RADAR ↓`) before choosing; exact stat changes are revealed afterward.

### Character memory
Each recurring persona now has hidden per-run `trust`, `pressure`, and `heat` values. Repeated encounters can therefore display states such as:

- 關係正在升溫
- 信任正在下降
- 對方開始退縮
- 情緒濃度升高
- 熟悉感增加中

This sits on top of the existing `PREVIOUSLY ON // 上回提要` recap system.

### Cross-event continuity
Selected systemic event cards leave flags behind. Later relevant character cards can display a `CROSS FILE` reminder, for example a dating-app screenshot, a mutual-friend warning, a group-chat 4:0 vote, an unknown caller, an ex wedding invitation, or a sudden work trip.

### Hidden endings
In addition to the eight 0 / 100 collapse endings and the normal relationship archetypes, full runs can unlock secret endings such as:

- 情緒平衡大師
- 前任封鎖完成
- 本季續訂成功
- 嘴可以停，行動留下
- 界線管理局局長

### Danger warnings
Meters near 0 or 100 now trigger explicit system warnings, not only a color change.

### Detected Files
A browser-local encyclopedia remembers which recurring personas, systemic events and Rare Files the player has actually encountered. It is accessible from the start and result screens and does not require a backend.

## Visual identity

Recurring personas retain stable pixel identities across repeated appearances while differing in hairstyle, glasses, facial hair, earrings, clothing silhouettes and props. Event cards use their own system-event visual language rather than a face portrait.

## Deferred features

The following remain intentionally deferred:

- Two-player compatibility mode
- Party / big-screen live voting mode
- Anonymous community submission backend

## Run

No build step is required. Open `index.html` directly or serve the repository with any static web server.
