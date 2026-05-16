# Worthle

A daily Wordle-style word-value game. Each letter is worth its alphabet position in cents, and the daily answer must match the target value.

## Run locally

Run: python3 -m http.server 4173

Then open http://localhost:4173.

## Notes

- No backend required.
- Daily puzzle selection is deterministic by local date.
- Progress, completion, and stats are stored in localStorage.
- The answer bank is curated in app.js.
