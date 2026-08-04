# Sig Fig Factory v1

Sig Fig Factory is a self-contained browser game for practicing the recognition
and counting of significant figures.

## Learning objective
Students decide how many significant figures are present in a displayed
measurement.

This first version intentionally does not include rounding calculations. The
goal is to test and strengthen recognition of the sig fig rules before adding a
second factory station.

## Included
- Effectively unlimited generated questions
- Nonzero digits
- Leading zeros
- Captive zeros
- Trailing zeros after decimal points
- Scientific notation
- Immediate explanatory feedback after incorrect choices
- Automatic movement to the next problem after a correct choice
- Five randomized answer choices
- No repeated question within the same 10-question game
- Factory machine animation
- One crate packed per correct answer
- Truck departure after 10 correct answers
- Responsive desktop and mobile layout

## Important design choice
Ambiguous whole numbers such as `1200` are not used by themselves. When trailing
zeros in a whole number matter, the game uses scientific notation so the
intended number of significant figures is explicit.

## Run the game
Open `index.html` in a browser.

For more reliable browser behavior:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Potential later versions
- Rounding to a specified number of significant figures
- Addition/subtraction decimal-place rules
- Multiplication/division sig fig rules
- Mixed factory stations
- Sound effects
- Saved student completion
- Canvas/SCORM packaging
