const goal = 10;

let score = 0;
let questionNumber = 1;
let currentProblem = null;
let awaitingNext = false;
let usedKeys = new Set();

const problemEl = document.getElementById("problem");
const coefficientInput = document.getElementById("coefficient");
const exponentInput = document.getElementById("exponent");
const submitButton = document.getElementById("submit-button");
const restartButton = document.getElementById("restart-button");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const questionNumberEl = document.getElementById("question-number");
const carEl = document.getElementById("car");
const progressFillEl = document.getElementById("progress-fill");
const progressMessageEl = document.getElementById("progress-message");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function roundTo(value, places = 12) {
  return Number.parseFloat(Number(value).toPrecision(places));
}

function formatDecimal(value) {
  if (value >= 1) {
    return value.toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: 10
    });
  }

  return value.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 14
  });
}

function generateCoefficient() {
  const digits = randomInt(2, 5);
  let text = String(randomInt(1, 9));

  if (digits > 1) {
    text += ".";
    for (let i = 1; i < digits; i += 1) {
      text += randomInt(0, 9);
    }
  }

  return {
    text,
    value: Number(text)
  };
}

function generateProblem() {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const coefficient = generateCoefficient();
    const exponent = randomChoice([
      -9, -8, -7, -6, -5, -4, -3, -2,
       2,  3,  4,  5,  6,  7,  8,  9
    ]);

    const decimalValue = roundTo(coefficient.value * 10 ** exponent, 13);

    if (
      decimalValue === 0 ||
      Math.abs(decimalValue) >= 1e13 ||
      Math.abs(decimalValue) < 1e-13
    ) {
      continue;
    }

    const display = formatDecimal(decimalValue);
    const key = `${display}|${coefficient.text}|${exponent}`;

    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      return {
        display,
        coefficient: coefficient.value,
        coefficientText: coefficient.text,
        exponent
      };
    }
  }

  usedKeys.clear();
  return generateProblem();
}

function renderProblem() {
  currentProblem = generateProblem();
  awaitingNext = false;

  problemEl.textContent = currentProblem.display;
  coefficientInput.value = "";
  exponentInput.value = "";
  coefficientInput.disabled = false;
  exponentInput.disabled = false;
  submitButton.disabled = false;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  coefficientInput.focus();
}

function nearlyEqual(a, b) {
  return Math.abs(a - b) <= Math.max(1e-10, Math.abs(b) * 1e-9);
}

function countDecimalMoves(display, exponent) {
  return Math.abs(exponent);
}

function diagnoseAnswer(coefficient, exponent) {
  const coefficientCorrect = nearlyEqual(coefficient, currentProblem.coefficient);
  const exponentCorrect = exponent === currentProblem.exponent;

  if (!coefficientCorrect && !exponentCorrect) {
    return "Both parts need another look. Move the decimal so the coefficient is at least 1 but less than 10, then count the places moved.";
  }

  if (!coefficientCorrect) {
    return "Your exponent is correct, but the coefficient should be at least 1 and less than 10 while preserving the original digits.";
  }

  if (!exponentCorrect) {
    const direction =
      currentProblem.exponent > 0
        ? "The original number is greater than 1, so the exponent should be positive."
        : "The original number is less than 1, so the exponent should be negative.";
    return `Your coefficient is correct. ${direction}`;
  }

  return "";
}

function updateRace() {
  const fraction = score / goal;
  const carLeft = 3 + fraction * 75;

  carEl.style.left = `${carLeft}%`;
  progressFillEl.style.width = `${fraction * 100}%`;

  carEl.classList.remove("bump");
  void carEl.offsetWidth;
  carEl.classList.add("bump");

  if (score === 0) {
    progressMessageEl.textContent =
      "Get 10 correct answers to finish the race.";
  } else if (score < goal) {
    const remaining = goal - score;
    progressMessageEl.textContent =
      `${remaining} more correct answer${remaining === 1 ? "" : "s"} to reach the finish line.`;
  } else {
    progressMessageEl.textContent = "Race complete!";
  }
}

function finishRace() {
  problemEl.textContent = "Finish line reached!";
  coefficientInput.disabled = true;
  exponentInput.disabled = true;
  submitButton.disabled = true;
  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    "You correctly converted 10 numbers into scientific notation. Returning to the campaign…";
  carEl.style.left = "83%";
  ScientificNotationCampaign.completeMission("mission1");
  ScientificNotationCampaign.returnToCampaign(2200);
}

function checkAnswer() {
  if (awaitingNext || score >= goal) return;

  const coefficient = Number(
    coefficientInput.value.trim().replace(/,/g, "")
  );
  const exponent = Number(exponentInput.value.trim());

  if (
    coefficientInput.value.trim() === "" ||
    exponentInput.value.trim() === "" ||
    !Number.isFinite(coefficient) ||
    !Number.isInteger(exponent)
  ) {
    window.AcademySound?.play("incorrect");
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent =
      "Enter a numerical coefficient and a whole-number exponent.";
    return;
  }

  const coefficientCorrect = nearlyEqual(
    coefficient,
    currentProblem.coefficient
  );
  const exponentCorrect = exponent === currentProblem.exponent;

  if (coefficientCorrect && exponentCorrect) {
    awaitingNext = true;
    coefficientInput.disabled = true;
    exponentInput.disabled = true;
    submitButton.disabled = true;

    score += 1;
    scoreEl.textContent = score;
    window.AcademySound?.play("engine");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent =
      `Correct. ${currentProblem.display} = ${currentProblem.coefficientText} × 10^${currentProblem.exponent}.`;

    updateRace();

    if (score >= goal) {
      window.setTimeout(finishRace, 900);
    } else {
      window.setTimeout(() => {
        questionNumber += 1;
        questionNumberEl.textContent = questionNumber;
        renderProblem();
      }, 1100);
    }
  } else {
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent = diagnoseAnswer(coefficient, exponent);

    if (!coefficientCorrect) {
      coefficientInput.select();
    } else {
      exponentInput.select();
    }
  }
}

submitButton.addEventListener("click", checkAnswer);

coefficientInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    exponentInput.focus();
  }
});

exponentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkAnswer();
  }
});

restartButton.addEventListener("click", () => {
  score = 0;
  questionNumber = 1;
  awaitingNext = false;
  usedKeys.clear();

  scoreEl.textContent = score;
  questionNumberEl.textContent = questionNumber;
  carEl.style.left = "3%";
  progressFillEl.style.width = "0%";
  updateRace();
  renderProblem();
});

updateRace();
renderProblem();
