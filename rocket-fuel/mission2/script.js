(() => {
  'use strict';

  const MISSION_TOTAL = 10;

  const elements = {
    familyBadge: document.getElementById('familyBadge'),
    questionHeading: document.getElementById('questionHeading'),
    sourceDisplay: document.getElementById('sourceDisplay'),
    targetDisplay: document.getElementById('targetDisplay'),
    stepText: document.getElementById('stepText'),
    currentUnitText: document.getElementById('currentUnitText'),
    fuelLinePath: document.getElementById('fuelLinePath'),
    instructionText: document.getElementById('instructionText'),
    answerGrid: document.getElementById('answerGrid'),
    feedback: document.getElementById('feedback'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    fuelLiquid: document.getElementById('fuelLiquid'),
    fuelPercent: document.getElementById('fuelPercent'),
    gaugeNeedle: document.getElementById('gaugeNeedle'),
    rocket: document.getElementById('rocket'),
    smokeCloud: document.getElementById('smokeCloud'),
    countdown: document.getElementById('countdown'),
    missionComplete: document.getElementById('missionComplete'),
    playAgainButton: document.getElementById('playAgainButton')
  };

  const state = {
    completedFuelLines: 0,
    question: null,
    currentStepIndex: 0,
    selectedFactors: [],
    locked: false,
    completed: false
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function factorMarkup(choice) {
    const top = ConversionEngine.formatFactorValue(choice.numeratorValue);
    const bottom = ConversionEngine.formatFactorValue(choice.denominatorValue);

    return `
      <span class="fraction" aria-label="${escapeHtml(top)} ${escapeHtml(choice.numeratorUnit)} divided by ${escapeHtml(bottom)} ${escapeHtml(choice.denominatorUnit)}">
        <span class="numerator"><b>${escapeHtml(top)}</b> ${escapeHtml(choice.numeratorUnit)}</span>
        <span class="fraction-line"></span>
        <span class="denominator"><b>${escapeHtml(bottom)}</b> ${escapeHtml(choice.denominatorUnit)}</span>
      </span>
    `;
  }

  function renderFuelLinePath() {
    const q = state.question;
    elements.fuelLinePath.innerHTML = '';

    q.unitPath.forEach((unit, index) => {
      const unitNode = document.createElement('span');
      unitNode.className = 'path-unit';
      unitNode.textContent = unit.symbol;

      if (index < state.currentStepIndex) {
        unitNode.classList.add('canceled');
      } else if (index === state.currentStepIndex) {
        unitNode.classList.add('active');
      } else if (index === q.unitPath.length - 1) {
        unitNode.classList.add('target');
      }

      elements.fuelLinePath.appendChild(unitNode);

      if (index < q.unitPath.length - 1) {
        const connector = document.createElement('span');
        connector.className = 'path-connector';
        connector.textContent = '→';

        if (index < state.currentStepIndex) {
          connector.classList.add('complete');
        }

        elements.fuelLinePath.appendChild(connector);
      }
    });
  }

  function renderStep() {
    const q = state.question;
    const step = q.steps[state.currentStepIndex];

    state.locked = false;
    elements.questionHeading.textContent = 'Assemble the fuel line';
    elements.stepText.textContent = `Conversion factor ${step.number} of ${step.totalSteps}`;
    elements.currentUnitText.textContent = `Cancel ${step.fromUnit.symbol}`;
    elements.instructionText.textContent = `Choose the factor that places ${step.fromUnit.symbol} in the denominator and leaves ${step.toUnit.symbol}.`;
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
    elements.answerGrid.innerHTML = '';

    renderFuelLinePath();

    step.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'factor-card';
      button.dataset.choiceId = choice.id;
      button.setAttribute('aria-label', `Choice ${index + 1}: ${ConversionEngine.formatFactor(choice)}`);
      button.innerHTML = factorMarkup(choice);
      button.addEventListener('click', () => handleChoice(choice, button));
      elements.answerGrid.appendChild(button);
    });
  }

  function renderQuestion() {
    state.question = ConversionEngine.generateQuestion();
    state.currentStepIndex = 0;
    state.selectedFactors = [];
    state.locked = false;

    const q = state.question;

    elements.familyBadge.textContent = q.familyLabel;
    elements.familyBadge.dataset.family = q.familyKey;
    elements.sourceDisplay.textContent = q.includeNumber
      ? `${q.value} ${q.source.symbol}`
      : q.source.symbol;
    elements.targetDisplay.textContent = q.target.symbol;

    renderStep();
  }

  function handleChoice(choice, button) {
    if (state.locked || state.completed) {
      return;
    }

    const result = ConversionEngine.evaluateChoice(
      state.question,
      state.currentStepIndex,
      choice
    );

    if (!result.correct) {
      button.classList.add('incorrect');
      button.disabled = true;
      window.AcademySound?.play('incorrect');
      window.AcademySound?.play('incorrect');
    elements.feedback.className = 'feedback guidance-feedback';
      elements.feedback.textContent = result.reason;
      return;
    }

    state.locked = true;
    state.selectedFactors[state.currentStepIndex] = choice;
    button.classList.add('correct');
    elements.answerGrid.querySelectorAll('button').forEach(answerButton => {
      answerButton.disabled = true;
    });
    window.AcademySound?.play('fuel');
    elements.feedback.className = 'feedback correct-feedback';
    elements.feedback.textContent = result.reason;

    if (!result.isFinalStep) {
      state.currentStepIndex += 1;
      setTimeout(renderStep, 850);
      return;
    }

    state.currentStepIndex = state.question.steps.length;
    renderFuelLinePath();
    state.completedFuelLines += 1;
    updateFuel();

    elements.feedback.textContent = state.question.completionMessage;

    if (state.completedFuelLines >= MISSION_TOTAL) {
      state.completed = true;
      setTimeout(startLaunchSequence, 1000);
    } else {
      setTimeout(renderQuestion, 1100);
    }
  }

  function updateFuel() {
    const percent = Math.min(
      (state.completedFuelLines / MISSION_TOTAL) * 100,
      100
    );

    elements.progressText.textContent = `${state.completedFuelLines} / ${MISSION_TOTAL} fuel lines`;
    elements.progressFill.style.width = `${percent}%`;
    elements.fuelLiquid.style.height = `${percent}%`;
    elements.fuelPercent.textContent = `${Math.round(percent)}%`;
    elements.gaugeNeedle.style.transform = `rotate(${-70 + percent * 1.4}deg)`;
  }

  function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async function startLaunchSequence() {
    document.body.classList.add('mission-ending');
    elements.answerGrid.querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });
    elements.feedback.className = 'feedback correct-feedback';
    elements.feedback.textContent = 'Fuel line assembly complete. Launch sequence initiated.';

    await delay(700);
    elements.countdown.setAttribute('aria-hidden', 'false');

    for (const number of ['3', '2', '1']) {
      elements.countdown.textContent = number;
      window.AcademySound?.play('countdown');
      elements.countdown.classList.remove('pulse');
      void elements.countdown.offsetWidth;
      elements.countdown.classList.add('pulse');
      await delay(850);
    }

    elements.countdown.textContent = 'IGNITION';
    elements.rocket.classList.add('ignition');
    elements.smokeCloud.classList.add('active');
    await delay(900);

    elements.countdown.textContent = '';
    window.AcademySound?.play('launch');
    elements.rocket.classList.add('launching');
    await delay(3300);

    elements.countdown.setAttribute('aria-hidden', 'true');
    elements.missionComplete.setAttribute('aria-hidden', 'false');
    elements.missionComplete.classList.add('show');
    RocketFuelCampaign.completeMission(2);
  }

  function resetMission() {
    state.completedFuelLines = 0;
    state.currentStepIndex = 0;
    state.selectedFactors = [];
    state.locked = false;
    state.completed = false;

    document.body.classList.remove('mission-ending');
    elements.rocket.className = 'rocket';
    elements.smokeCloud.className = 'smoke-cloud';
    elements.missionComplete.className = 'mission-complete';
    elements.missionComplete.setAttribute('aria-hidden', 'true');
    elements.countdown.textContent = '';
    elements.countdown.setAttribute('aria-hidden', 'true');

    updateFuel();
    renderQuestion();
  }

  elements.playAgainButton.addEventListener('click', RocketFuelCampaign.returnToCampaign);

  resetMission();
})();
