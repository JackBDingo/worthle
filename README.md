# Worthle

A daily word-value hunt. Each letter is worth its alphabet position in cents, and players try to find as many words as possible that exactly match the daily target.

## Run locally

Run: python3 -m http.server 4173

Then open http://localhost:4173.

## Notes

- No backend required.
- Daily target selection is deterministic by local date.
- Progress, completion, and stats are stored in localStorage.
- The target seed bank is curated in app.js.
