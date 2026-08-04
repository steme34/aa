# Chemistry Skills Academy

A unified browser-based collection of completed chemistry practice games and campaigns.

## Included activities

- Metric Balloon — metric conversions
- Sig Fig Factory — counting significant figures
- Scientific Notation — two complementary missions
- Rocket Fuel — three sequential dimensional-analysis missions

## Run

Open `index.html` in a modern browser. All games use HTML, CSS, and JavaScript only.

Session progress for the Scientific Notation and Rocket Fuel campaigns is stored with `sessionStorage` and remains available while the browser session is open.

## Structure

- `index.html` — Academy home screen
- `shared/` — Academy-wide navigation and styling
- `metric-balloon/` — existing Metric Balloon game
- `sig-fig-factory/` — existing Sig Fig Factory game
- `scientific-notation/` — existing two-mission campaign
- `rocket-fuel/` — existing three-mission campaign

## Visual integration update

Academy navigation now appears in a shared full-width header above each activity. It no longer occupies a game-panel grid position, preserving the original side-by-side game and animation layouts on desktop while remaining responsive on mobile.


## Academy completion tracking

Academy-wide activity completion is stored in `sessionStorage`. The Academy home displays completed activity ribbons and an automatic four-activity progress summary. Progress remains available through page refreshes and resets when the browser session ends.


## Sound and animation polish

The Academy includes browser-generated sound effects, a session sound toggle, animated feedback, progress celebrations, and a reduced-motion accessibility fallback. No external audio files or network access are required.
