# Rocket Fuel Campaign

A three-mission Chemistry Skills Academy browser campaign for dimensional analysis.

## Run

Open `index.html` in a modern browser. No installation or server is required.

## Campaign progression

- Mission 1: Fuel Selection
- Mission 2: Fuel Line Assembly
- Mission 3: Launch Calculation

Mission progress is stored in `sessionStorage`, so it remains available while the browser session is open. Closing the browser clears campaign progress.

## Project structure

- `index.html` — campaign hub
- `shared/` — campaign navigation, progress state, and hub styling
- `mission1/` — Fuel Selection
- `mission2/` — Fuel Line Assembly
- `mission3/` — Launch Calculation
