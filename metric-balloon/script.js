const unitFamilies = [
  {
    name: "length",
    units: [
      { symbol: "km", exponent: 3 },
      { symbol: "m", exponent: 0 },
      { symbol: "cm", exponent: -2 },
      { symbol: "mm", exponent: -3 },
      { symbol: "µm", exponent: -6 }
    ]
  },
  {
    name: "mass",
    units: [
      { symbol: "kg", exponent: 3 },
      { symbol: "g", exponent: 0 },
      { symbol: "mg", exponent: -3 },
      { symbol: "µg", exponent: -6 }
    ]
  },
  {
    name: "volume",
    units: [
      { symbol: "kL", exponent: 3 },
      { symbol: "L", exponent: 0 },
      { symbol: "mL", exponent: -3 },
      { symbol: "µL", exponent: -6 }
    ]
  }
];

const friendlyCoefficients = [
  1.2, 1.5, 1.8, 2.4, 2.5, 3.2, 3.5, 4.2, 4.5, 5.6,
  6.4, 6.8, 7.2, 7.5, 8.1, 8.4, 9.1, 12.5, 15, 18,
  24, 25, 32, 45, 56, 64, 75, 81, 125, 250, 450, 750
];

const displayPowers = [-3, -2, -1, 0, 1, 2];
const goal = 10;

let score = 0;
let questionNumber = 1;
let currentProblem = null;
let awaitingNext = false;
let usedProblemKeys = new Set();

const problemEl = document.getElementById("problem");
const targetUnitEl = document.getElementById("target-unit");
const answerInput = document.getElementById("answer");
const answerForm = document.getElementById("answer-form");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const questionNumberEl = document.getElementById("question-number");
const nextButton = document.getElementById("next-button");
const submitButton = document.getElementById("submit-button");
const restartButton = document.getElementById("restart-button");
const balloon = document.getElementById("balloon");
const balloonWrap = document.getElementById("balloon-wrap");
const progressMessage = document.getElementById("progress-message");

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function roundToPrecision(value, digits = 12) {
  return Number.parseFloat(Number(value).toPrecision(digits));
}

function formatNumber(value) {
  if (value === 0) return "0";

  const absolute = Math.abs(value);

  if (absolute >= 1e7 || absolute < 1e-5) {
    return value
      .toExponential(6)
      .replace(/\.?0+e/, "e")
      .replace("e+", " × 10^")
      .replace("e-", " × 10^-");
  }

  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 12
  });
}

function conversionFactorText(fromUnit, toUnit) {
  const exponentDifference = fromUnit.exponent - toUnit.exponent;
  const factor = 10 ** Math.abs(exponentDifference);

  if (exponentDifference > 0) {
    return `1 ${fromUnit.symbol} = ${formatNumber(factor)} ${toUnit.symbol}`;
  }

  return `${formatNumber(factor)} ${fromUnit.symbol} = 1 ${toUnit.symbol}`;
}

function makeProblemKey(problem) {
  return `${problem.family}|${problem.value}|${problem.from}|${problem.to}`;
}

function generateProblem() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const family = randomChoice(unitFamilies);
    const fromUnit = randomChoice(family.units);
    const possibleTargets = family.units.filter(
      (unit) => unit.symbol !== fromUnit.symbol
    );
    const toUnit = randomChoice(possibleTargets);

    const coefficient = randomChoice(friendlyCoefficients);
    const displayPower = randomChoice(displayPowers);
    const value = roundToPrecision(coefficient * 10 ** displayPower);
    const answer = roundToPrecision(
      value * 10 ** (fromUnit.exponent - toUnit.exponent)
    );

    // Keep introductory questions readable while still allowing a wide range.
    if (
      value <= 0 ||
      answer <= 0 ||
      Math.abs(answer) >= 1e12 ||
      Math.abs(answer) < 1e-10
    ) {
      continue;
    }

    const problem = {
      family: family.name,
      value,
      from: fromUnit.symbol,
      to: toUnit.symbol,
      answer,
      factorText: conversionFactorText(fromUnit, toUnit)
    };

    const key = makeProblemKey(problem);
    if (!usedProblemKeys.has(key)) {
      usedProblemKeys.add(key);
      return problem;
    }
  }

  // This is extremely unlikely in a 10-question game, but prevents a stall.
  usedProblemKeys.clear();
  return generateProblem();
}

function chooseProblem() {
  currentProblem = generateProblem();

  problemEl.textContent =
    `${formatNumber(currentProblem.value)} ${currentProblem.from} = ? ${currentProblem.to}`;
  targetUnitEl.textContent = currentProblem.to;
  answerInput.value = "";
  answerInput.disabled = false;
  submitButton.disabled = false;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextButton.classList.add("hidden");
  awaitingNext = false;
  answerInput.focus();
}

function nearlyEqual(a, b) {
  const tolerance = Math.max(1e-10, Math.abs(b) * 1e-7);
  return Math.abs(a - b) <= tolerance;
}

function updateBalloon() {
  const fraction = score / goal;
  const scale = 0.7 + fraction * 0.45;
  const rise = fraction * 52;

  balloon.style.transform = `scale(${scale})`;
  balloonWrap.style.bottom = `${14 + rise}%`;

  if (score === 0) {
    progressMessage.textContent = "Fill the balloon with 10 correct answers.";
  } else if (score < goal) {
    progressMessage.textContent =
      `${goal - score} more correct answer${goal - score === 1 ? "" : "s"} until liftoff.`;
  } else {
    progressMessage.textContent = "Liftoff! You completed the metric challenge.";
  }
}

function finishGame() {
  window.AcademySound?.play("complete");
  problemEl.textContent = "Balloon launched!";
  targetUnitEl.textContent = "";
  answerInput.disabled = true;
  submitButton.disabled = true;
  nextButton.classList.add("hidden");
  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    "You completed 10 different metric conversions correctly.";
  balloonWrap.style.bottom = "76%";
  window.setTimeout(() => Academy.completeActivity("metric-balloon"), 800);
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (awaitingNext || score >= goal) return;

  const raw = answerInput.value
    .trim()
    .replace(/,/g, "")
    .replace(/[×x]\s*10\^?/i, "e");
  const numericAnswer = Number(raw);

  if (raw === "" || !Number.isFinite(numericAnswer)) {
    window.AcademySound?.play("incorrect");
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent =
      "Enter a numerical value. Scientific notation such as 3.2e4 is accepted.";
    return;
  }

  if (nearlyEqual(numericAnswer, currentProblem.answer)) {
    score += 1;
    scoreEl.textContent = score;
    window.AcademySound?.play("inflate");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent =
      `Correct. ${formatNumber(currentProblem.value)} ${currentProblem.from} = ` +
      `${formatNumber(currentProblem.answer)} ${currentProblem.to}.`;
    answerInput.disabled = true;
    submitButton.disabled = true;
    awaitingNext = true;
    updateBalloon();

    if (score >= goal) {
      window.setTimeout(finishGame, 700);
    } else {
      window.setTimeout(() => {
        questionNumber += 1;
        questionNumberEl.textContent = questionNumber;
        chooseProblem();
      }, 900);
    }
  } else {
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent =
      `Not yet. Use ${currentProblem.factorText}, then try again.`;
    answerInput.select();
  }
});

nextButton.addEventListener("click", () => {
  questionNumber += 1;
  questionNumberEl.textContent = questionNumber;
  chooseProblem();
});

restartButton.addEventListener("click", () => {
  score = 0;
  questionNumber = 1;
  usedProblemKeys.clear();
  scoreEl.textContent = score;
  questionNumberEl.textContent = questionNumber;
  updateBalloon();
  chooseProblem();
});

updateBalloon();
chooseProblem();
