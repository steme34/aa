const goal = 10;

let score = 0;
let questionNumber = 1;
let currentProblem = null;
let awaitingNext = false;
let usedKeys = new Set();

const problemEl = document.getElementById("problem");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-button");
const restartButton = document.getElementById("restart-button");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const questionNumberEl = document.getElementById("question-number");
const runnerEl = document.getElementById("runner");
const distanceMarkersEl = document.getElementById("distance-markers");
const progressFillEl = document.getElementById("progress-fill");
const progressMessageEl = document.getElementById("progress-message");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateCoefficientText() {
  const sigDigits = randomInt(2, 5);
  let text = String(randomInt(1, 9));

  if (sigDigits > 1) {
    text += ".";
    for (let i = 1; i < sigDigits; i += 1) {
      text += randomInt(0, 9);
    }
  }

  return text;
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

function exactDecimalString(coefficientText, exponent) {
  const [wholePart, fractionalPart = ""] = coefficientText.split(".");
  const digits = `${wholePart}${fractionalPart}`;
  const originalDecimalIndex = wholePart.length;
  const newDecimalIndex = originalDecimalIndex + exponent;

  if (newDecimalIndex <= 0) {
    return `0.${"0".repeat(Math.abs(newDecimalIndex))}${digits}`;
  }

  if (newDecimalIndex >= digits.length) {
    return `${digits}${"0".repeat(newDecimalIndex - digits.length)}`;
  }

  return `${digits.slice(0, newDecimalIndex)}.${digits.slice(newDecimalIndex)}`;
}

function normalizeDecimalString(value) {
  let normalized = value.trim().replace(/,/g, "");

  if (normalized.startsWith(".")) {
    normalized = `0${normalized}`;
  }

  if (normalized.startsWith("-.")) {
    normalized = normalized.replace("-.", "-0.");
  }

  normalized = normalized.replace(/^(\d+)\.0+$/, "$1");

  if (normalized.includes(".")) {
    normalized = normalized.replace(/0+$/, "").replace(/\.$/, "");
  }

  normalized = normalized.replace(/^0+(?=\d)/, "");

  if (normalized.startsWith(".")) {
    normalized = `0${normalized}`;
  }

  return normalized || "0";
}

function generateProblem() {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const coefficientText = generateCoefficientText();
    const exponent = randomChoice([
      -9, -8, -7, -6, -5, -4, -3, -2,
       2,  3,  4,  5,  6,  7,  8,  9
    ]);

    const answerText = exactDecimalString(coefficientText, exponent);
    const key = `${coefficientText}|${exponent}|${answerText}`;

    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      return {
        coefficientText,
        exponent,
        answerText,
        display: `${coefficientText} × 10${toSuperscript(exponent)}`
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
  answerInput.value = "";
  answerInput.disabled = false;
  submitButton.disabled = false;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  answerInput.focus();
}

function createDistanceMarkers() {
  distanceMarkersEl.innerHTML = "";

  for (let meters = 10; meters <= 100; meters += 10) {
    const marker = document.createElement("div");
    marker.className = "distance-marker";
    marker.style.left = `${4 + (meters / 100) * 85}%`;
    marker.dataset.label = `${meters} m`;
    distanceMarkersEl.appendChild(marker);
  }
}

const runnerPositions = [4, 12.5, 21, 29.5, 38, 46.5, 55, 63.5, 72, 80.5, 89];

function updateProgress(moveRunner = true) {
  const fraction = score / goal;

  if (moveRunner) {
    runnerEl.style.left = `${runnerPositions[score]}%`;
  }

  progressFillEl.style.width = `${fraction * 100}%`;


  if (score === 0) {
    progressMessageEl.textContent = "Reach 100 meters to finish the race.";
  } else if (score < goal) {
    const remainingMeters = 100 - score * 10;
    progressMessageEl.textContent = `${remainingMeters} meters remaining.`;
  } else {
    progressMessageEl.textContent = "Event complete!";
  }
}

function animateMovement() {
  runnerEl.classList.add("run");
  runnerEl.classList.remove("sprint-step");
  void runnerEl.offsetWidth;
  runnerEl.classList.add("sprint-step");

  updateProgress(true);

  window.setTimeout(() => {
    runnerEl.classList.remove("sprint-step");
  }, 650);
}

function diagnoseAnswer(userAnswer) {
  const normalized = normalizeDecimalString(userAnswer);
  const expected = normalizeDecimalString(currentProblem.answerText);

  if (normalized === expected) {
    return "";
  }

  if (currentProblem.exponent > 0) {
    return `Move the decimal ${currentProblem.exponent} place${currentProblem.exponent === 1 ? "" : "s"} to the right.`;
  }

  return `Move the decimal ${Math.abs(currentProblem.exponent)} place${Math.abs(currentProblem.exponent) === 1 ? "" : "s"} to the left.`;
}

function finishEvent() {
  problemEl.textContent = "Finish line reached!";
  answerInput.disabled = true;
  submitButton.disabled = true;
  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    "You completed the 100-meter dash by correctly converting 10 scientific-notation values. Returning to the campaign…";
  runnerEl.style.left = `${runnerPositions[goal]}%`;
  runnerEl.classList.remove("run");
  ScientificNotationCampaign.completeMission("mission2");
  ScientificNotationCampaign.returnToCampaign(2200);
}

function checkAnswer() {
  if (awaitingNext || score >= goal) return;

  const raw = answerInput.value.trim();

  if (raw === "" || !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(raw.replace(/,/g, ""))) {
    window.AcademySound?.play("incorrect");
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent = "Enter a numerical value.";
    return;
  }

  const normalized = normalizeDecimalString(raw);
  const expected = normalizeDecimalString(currentProblem.answerText);

  if (normalized === expected) {
    awaitingNext = true;
    answerInput.disabled = true;
    submitButton.disabled = true;

    score += 1;
    scoreEl.textContent = score * 10;
    window.AcademySound?.play("step");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent =
      `Correct. ${currentProblem.display} = ${currentProblem.answerText}.`;

    updateProgress(false);
    animateMovement();

    if (score >= goal) {
      window.setTimeout(finishEvent, 900);
    } else {
      window.setTimeout(() => {
        questionNumber += 1;
        questionNumberEl.textContent = questionNumber;
        renderProblem();
      }, 1050);
    }
  } else {
    feedbackEl.className = "feedback incorrect";
    feedbackEl.textContent = diagnoseAnswer(raw);
    answerInput.select();
  }
}

submitButton.addEventListener("click", checkAnswer);

answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkAnswer();
  }
});

restartButton.addEventListener("click", () => {
  score = 0;
  questionNumber = 1;
  awaitingNext = false;
  usedKeys.clear();

  scoreEl.textContent = "0";
  questionNumberEl.textContent = questionNumber;
  runnerEl.style.left = `${runnerPositions[0]}%`;
  runnerEl.classList.add("run");
  createDistanceMarkers();
  updateProgress();
  renderProblem();
});

createDistanceMarkers();
runnerEl.classList.add("run");
updateProgress();
renderProblem();
