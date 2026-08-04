# Metric Balloon v1.2

Version 1.2 replaces the small fixed question bank with an effectively unlimited
metric-conversion question generator.

## Included
- Randomly generated length, mass, and volume conversions
- Units ranging from kilo- through micro-
- Varied starting values, decimal locations, and conversion directions
- No repeated question within a single 10-question game
- Automatic answer calculation and checking
- Numerical answers and `e` scientific notation accepted
- Conversion-factor hints after incorrect answers
- Automatic advance after a correct answer
- Balloon progress and launch after 10 correct answers
- Responsive desktop and mobile layout

## Current unit families
- Length: km, m, cm, mm, µm
- Mass: kg, g, mg, µg
- Volume: kL, L, mL, µL

The generator combines many coefficients, powers of ten, unit families, source
units, and target units. This creates tens of thousands of readable combinations
before considering the randomized order of play.

## Run the game
Open `index.html` in a browser.

For more reliable browser behavior:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Still intentionally excluded
- Required significant-figure formatting
- Timed modes
- Saved student results
- Canvas/SCORM tracking
- Sound effects
- Multiple visual themes
- Adaptive difficulty
