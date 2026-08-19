# BUILD 4.0 validation notes

- Branch is based on current `main` and changes only replayability/UI documentation files.
- Existing `data.js`, `choices.js`, `events.js`, `interactions-v2.js`, and `flavor.js` remain the content source of truth.
- `index.html` now loads the new `meta.js`, `app-v2.js`, `styles-v2.css`, and `quality-guard.js` layers.
- FULL SCAN remains 15 cards and QUICK SCAN remains 8 cards.
- Existing Rare File and event-card constraints remain in deck generation.
- The environment cannot resolve `raw.githubusercontent.com`, so local Node/browser execution could not be performed here; source was reviewed through the GitHub connector and the branch is kept isolated for PR review.
