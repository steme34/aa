(() => {
  'use strict';

  const elements = {
    familyBadge: document.getElementById('familyBadge'),
    sourceDisplay: document.getElementById('sourceDisplay'),
    targetDisplay: document.getElementById('targetDisplay'),
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
    correctCount: 0,
    question: null,
    locked: false,
    completed: false
  };

  function factorMarkup(choice) {
    const top = ConversionEngine.formatFactorValue(choice.numeratorValue);
    const bottom = ConversionEngine.formatFactorValue(choice.denominatorValue);
    return `
      <span class="fraction" aria-label="${top} ${choice.numeratorUnit} divided by ${bottom} ${choice.denominatorUnit}">
        <span class="numerator"><b>${top}</b> ${choice.numeratorUnit}</span>
        <span class="fraction-line"></span>
        <span class="denominator"><b>${bottom}</b> ${choice.denominatorUnit}</span>
      </span>
    `;
  }

  function renderQuestion() {
    state.question = ConversionEngine.generateQuestion();
    state.locked = false;
    const q = state.question;

    elements.familyBadge.textContent = q.familyLabel;
    elements.familyBadge.dataset.family = q.familyKey;
    elements.sourceDisplay.textContent = q.includeNumber ? `${q.value} ${q.source.symbol}` : q.source.symbol;
    elements.targetDisplay.textContent = q.target.symbol;
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
    elements.answerGrid.innerHTML = '';

    q.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'factor-card';
      button.dataset.choiceId = choice.id;
      button.setAttribute('aria-label', `Choice ${index + 1}`);
      button.innerHTML = factorMarkup(choice);
      button.addEventListener('click', () => handleChoice(choice, button));
      elements.answerGrid.appendChild(button);
    });
  }

  function handleChoice(choice, button) {
    if (state.locked || state.completed) return;

    const isCorrect = state.question.correctIds.has(choice.id);
    if (isCorrect) {
      state.locked = true;
      button.classList.add('correct');
      window.AcademySound?.play('fuel');
      elements.feedback.className = 'feedback correct-feedback';
      elements.feedback.textContent = choice.reason;
      state.correctCount += 1;
      updateFuel();

      if (state.correctCount >= 10) {
        state.completed = true;
        setTimeout(startLaunchSequence, 850);
      } else {
        setTimeout(renderQuestion, 900);
      }
      return;
    }

    button.classList.add('incorrect');
    button.disabled = true;
    window.AcademySound?.play('incorrect');
    elements.feedback.className = 'feedback guidance-feedback';
    elements.feedback.textContent = choice.reason;
  }

  function updateFuel() {
    const percent = Math.min(state.correctCount * 10, 100);
    elements.progressText.textContent = `${state.correctCount} / 10 correct`;
    elements.progressFill.style.width = `${percent}%`;
    elements.fuelLiquid.style.height = `${percent}%`;
    elements.fuelPercent.textContent = `${percent}%`;
    elements.gaugeNeedle.style.transform = `rotate(${-70 + percent * 1.4}deg)`;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function startLaunchSequence() {
    document.body.classList.add('mission-ending');
    elements.answerGrid.querySelectorAll('button').forEach(button => { button.disabled = true; });
    elements.feedback.className = 'feedback correct-feedback';
    elements.feedback.textContent = 'Fuel selection complete. Launch sequence initiated.';

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
    RocketFuelCampaign.completeMission(1);
  }

  function resetMission() {
    state.correctCount = 0;
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
