# Scientific Notation Campaign

A two-mission Chemistry Skills Academy browser campaign that practices scientific notation in both directions.

## Missions

### Mission 1 — Scientific Notation Speedway
Convert ordinary decimal notation into scientific notation.

### Mission 2 — 100 Meter Dash
Convert scientific notation into ordinary decimal notation.

Both missions are available immediately and may be completed in either order. Each remains freely replayable.

## Campaign completion

Mission completion is recorded with `sessionStorage`, so progress persists while the current browser session remains open. No permanent save file or account is used.

When both missions have been completed during the session, the campaign hub displays:

`⭐⭐ Scientific Notation Campaign Complete ⭐⭐`

## Run

Open the top-level `index.html` file in a modern browser.

For more reliable local browser behavior, run a simple local server from the `ScientificNotation` folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

- `index.html` — campaign hub
- `shared/shared.css` — campaign hub and shared navigation styles
- `shared/shared.js` — session completion tracking and campaign navigation
- `mission1/` — original Scientific Notation Speedway game with campaign integration
- `mission2/` — original Scientific Notation 100 m Dash game with campaign integration
