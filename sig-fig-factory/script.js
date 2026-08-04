const goal = 10;

const problemTypes = [
  "nonzero",
  "leadingZeros",
  "captiveZeros",
  "decimalTrailingZeros",
  "scientific",
  "exactDecimal",
  "integerUnambiguous"
];

let score = 0;
let questionNumber = 1;
let currentProblem = null;
let awaitingNext = false;
let usedKeys = new Set();

const problemEl = document.getElementById("problem");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const questionNumberEl = document.getElementById("question-number");
const restartButton = document.getElementById("restart-button");
const machineCountEl = document.getElementById("machine-count");
const truckLabelEl = document.getElementById("truck-label");
const progressMessageEl = document.getElementById("progress-message");
const crateTrackEl = document.getElementById("crate-track");
const machineEl = document.querySelector(".machine");
const truckEl = document.getElementById("truck");
const lights = [...document.querySelectorAll(".light")];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomNonzeroDigit() {
  return randomInt(1, 9);
}

function randomDigits(length, allowZero = true) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += allowZero ? randomInt(0, 9) : randomNonzeroDigit();
  }
  return result;
}

function buildNonzeroProblem() {
  const digits = randomInt(2, 6);
  const value = randomDigits(digits, false);
  return {
    display: value,
    answer: digits,
    explanation: "Every nonzero digit is significant."
  };
}

function buildLeadingZeroProblem() {
  const leadingZeros = randomInt(1, 5);
  const significantDigits = randomInt(2, 5);
  let coefficient = String(randomNonzeroDigit());

  for (let i = 1; i < significantDigits; i += 1) {
    coefficient += randomInt(0, 9);
  }

  const display = `0.${"0".repeat(leadingZeros)}${coefficient}`;

  return {
    display,
    answer: significantDigits,
    explanation:
      `The ${leadingZeros + 1} zero${leadingZeros + 1 === 1 ? "" : "s"} before the first nonzero digit are leading zeros, so they are not significant.`
  };
}

function buildCaptiveZeroProblem() {
  const left = randomDigits(randomInt(1, 2), false);
  const zeroCount = randomInt(1, 3);
  const right = randomDigits(randomInt(1, 2), false);
  const useDecimal = Math.random() < 0.45;
  const display = useDecimal
    ? `${left}.${"0".repeat(zeroCount)}${right}`
    : `${left}${"0".repeat(zeroCount)}${right}`;

  return {
    display,
    answer: left.length + zeroCount + right.length,
    explanation: "Zeros between nonzero digits are captive zeros and are significant."
  };
}

function buildDecimalTrailingZeroProblem() {
  const whole = Math.random() < 0.45 ? "0" : String(randomNonzeroDigit());
  const coreLength = randomInt(1, 3);
  let core = "";

  if (whole === "0") {
    const leadingZeros = randomInt(0, 2);
    core = `${"0".repeat(leadingZeros)}${randomNonzeroDigit()}${randomDigits(coreLength - 1)}`;
  } else {
    core = randomDigits(coreLength);
  }

  const trailingZeros = randomInt(1, 3);
  const display = `${whole}.${core}${"0".repeat(trailingZeros)}`;

  let significantPart = `${whole}${core}${"0".repeat(trailingZeros)}`;
  significantPart = significantPart.replace(/^0+/, "");

  return {
    display,
    answer: significantPart.length,
    explanation:
      "Trailing zeros to the right of a decimal point are significant."
  };
}

function buildScientificProblem() {
  const significantDigits = randomInt(2, 6);
  let coefficient = String(randomNonzeroDigit());

  if (significantDigits > 1) {
    coefficient += `.${randomDigits(significantDigits - 1)}`;
  }

  const exponent = randomInt(-8, 8);
  const signedExponent = exponent >= 0 ? `+${exponent}` : `${exponent}`;

  return {
    display: `${coefficient} × 10${toSuperscript(signedExponent)}`,
    answer: significantDigits,
    explanation:
      "In scientific notation, only the digits in the coefficient determine the significant figures."
  };
}

function buildExactDecimalProblem() {
  const whole = randomInt(1, 999);
  const decimalDigits = randomInt(1, 3);
  const decimalPart = randomDigits(decimalDigits);
  const display = `${whole}.${decimalPart}`;
  const answer = String(whole).length + decimalDigits;

  return {
    display,
    answer,
    explanation:
      "All nonzero digits and any zeros between or after measured decimal digits are significant."
  };
}

function buildIntegerUnambiguousProblem() {
  const significantDigits = randomInt(2, 5);
  let coefficient = String(randomNonzeroDigit());

  if (significantDigits > 1) {
    coefficient += `.${randomDigits(significantDigits - 1)}`;
  }

  const exponent = randomInt(2, 6);

  return {
    display: `${coefficient} × 10${toSuperscript(`+${exponent}`)}`,
    answer: significantDigits,
    explanation:
      "Scientific notation removes ambiguity: count the digits in the coefficient."
  };
}

function toSuperscript(value) {
  const map = {
    "-": "⁻",
    "+": "⁺",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹"
  };

  return String(value)
    .split("")
    .map((character) => map[character] ?? character)
    .join("");
}

function generateProblem() {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const type = randomChoice(problemTypes);
    let problem;

    switch (type) {
      case "nonzero":
        problem = buildNonzeroProblem();
        break;
      case "leadingZeros":
        problem = buildLeadingZeroProblem();
        break;
      case "captiveZeros":
        problem = buildCaptiveZeroProblem();
        break;
      case "decimalTrailingZeros":
        problem = buildDecimalTrailingZeroProblem();
        break;
      case "scientific":
        problem = buildScientificProblem();
        break;
      case "exactDecimal":
        problem = buildExactDecimalProblem();
        break;
      default:
        problem = buildIntegerUnambiguousProblem();
    }

    const key = `${problem.display}|${problem.answer}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      return problem;
    }
  }

  usedKeys.clear();
  return generateProblem();
}

function makeChoices(correctAnswer) {
  const choices = new Set([correctAnswer]);

  while (choices.size < 5) {
    const offset = randomChoice([-3, -2, -1, 1, 2, 3]);
    const candidate = correctAnswer + offset;
    if (candidate >= 1 && candidate <= 9) {
      choices.add(candidate);
    }
  }

  return [...choices].sort(() => Math.random() - 0.5);
}

function renderProblem() {
  currentProblem = generateProblem();
  awaitingNext = false;
  problemEl.textContent = currentProblem.display;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  choicesEl.innerHTML = "";

  for (const choice of makeChoices(currentProblem.answer)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;
    button.dataset.value = String(choice);
    button.addEventListener("click", () => checkAnswer(button, choice));
    choicesEl.appendChild(button);
  }
}

function disableChoices() {
  const buttons = [...choicesEl.querySelectorAll("button")];
  for (const button of buttons) {
    button.disabled = true;
  }
}

function checkAnswer(button, choice) {
  if (awaitingNext || score >= goal) return;

  if (choice === currentProblem.answer) {
    awaitingNext = true;
    disableChoices();
    button.classList.add("correct-choice");

    score += 1;
    scoreEl.textContent = score;
    machineCountEl.textContent = score;
    truckLabelEl.textContent = `${score}/${goal}`;
    window.AcademySound?.play("crate");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent =
      `Correct — ${currentProblem.display} has ${currentProblem.answer} significant figure${currentProblem.answer === 1 ? "" : "s"}.`;

    animatePackedCrate();
    updateProgress();

    if (score >= goal) {
      window.setTimeout(finishFactory, 1050);
    } else {
      window.setTimeout(() => {
        questionNumber += 1;
        questionNumberEl.textContent = questionNumber;
        renderProblem();
      }, 1150);
    }
  } else {
    button.disabled = true;
    button.classList.add("wrong-choice");
    window.AcademySound?.play("incorrect");
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent = `Not yet. ${currentProblem.explanation}`;
    activateLight("wrong");
  }
}

function activateLight(state) {
  lights.forEach((light) => light.classList.remove("active"));

  if (state === "correct") {
    lights[0].classList.add("active");
  } else if (state === "waiting") {
    lights[1].classList.add("active");
  } else if (state === "wrong") {
    lights[2].classList.add("active");
  }
}

function animatePackedCrate() {
  machineEl.classList.remove("processing");
  void machineEl.offsetWidth;
  machineEl.classList.add("processing");
  activateLight("correct");

  const crate = document.createElement("div");
  crate.className = "crate";
  crateTrackEl.appendChild(crate);

  window.setTimeout(() => {
    crate.remove();
    activateLight("waiting");
  }, 1000);
}

function updateProgress() {
  if (score === 0) {
    progressMessageEl.textContent = "Pack 10 crates to send the truck.";
  } else if (score < goal) {
    const remaining = goal - score;
    progressMessageEl.textContent =
      `${remaining} more crate${remaining === 1 ? "" : "s"} until the truck departs.`;
  } else {
    progressMessageEl.textContent = "Shipment complete — the truck is leaving!";
  }
}

function finishFactory() {
  window.AcademySound?.play("engine");
  problemEl.textContent = "Shipment complete!";
  choicesEl.innerHTML = "";
  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    "You correctly counted the significant figures in 10 different measurements.";
  truckEl.classList.add("depart");
  activateLight("correct");
  window.setTimeout(() => Academy.completeActivity("sig-fig-factory"), 1450);
}

restartButton.addEventListener("click", () => {
  score = 0;
  questionNumber = 1;
  awaitingNext = false;
  usedKeys.clear();

  scoreEl.textContent = score;
  questionNumberEl.textContent = questionNumber;
  machineCountEl.textContent = score;
  truckLabelEl.textContent = `0/${goal}`;
  truckEl.classList.remove("depart");

  activateLight("waiting");
  updateProgress();
  renderProblem();
});

activateLight("waiting");
updateProgress();
renderProblem();
