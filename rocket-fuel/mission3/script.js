(() => {
  'use strict';

  const MISSION_TOTAL = 10;
  const CHECKLIST_ITEMS = [
    'Fuel Tanks',
    'Pressure Test',
    'Guidance System',
    'Navigation',
    'Communications',
    'Flight Computer',
    'Main Engines',
    'Weather Check',
    'Final Systems',
    'Launch Authorization'
  ];

  const elements = {
    familyBadge: document.getElementById('familyBadge'),
    calculationSetup: document.getElementById('calculationSetup'),
    answerForm: document.getElementById('answerForm'),
    numberInput: document.getElementById('numberInput'),
    unitInput: document.getElementById('unitInput'),
    submitButton: document.getElementById('submitButton'),
    feedback: document.getElementById('feedback'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    launchChecklist: document.getElementById('launchChecklist'),
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function numberMarkup(value) {
    return escapeHtml(ConversionEngine.formatNumber(value));
  }

  function fractionMarkup(factor) {
    return `
      <span class="paper-factor">
        <span class="paper-numerator">
          <b>${numberMarkup(factor.numeratorValue)}</b>
          <span class="cancel-unit">${escapeHtml(factor.numeratorUnit)}</span>
        </span>
        <span class="paper-fraction-line"></span>
        <span class="paper-denominator">
          <b>${numberMarkup(factor.denominatorValue)}</b>
          <span class="cancel-unit canceled-unit">${escapeHtml(factor.denominatorUnit)}</span>
        </span>
      </span>
    `;
  }

  function renderCalculation() {
    const q = state.question;
    const factorHtml = q.factors.map(factor => `
      <span class="multiply-symbol" aria-hidden="true">×</span>
      ${fractionMarkup(factor)}
    `).join('');

    elements.calculationSetup.innerHTML = `
      <span class="starting-quantity">
        <b>${numberMarkup(q.startValue)}</b>
        <span class="cancel-unit canceled-unit">${escapeHtml(q.source.symbol)}</span>
      </span>
      ${factorHtml}
      <span class="equals-symbol" aria-hidden="true">=</span>
      <span class="question-mark">?</span>
    `;
  }

  function renderChecklist() {
    elements.launchChecklist.innerHTML = '';
    CHECKLIST_ITEMS.forEach((item, index) => {
      const row = document.createElement('li');
      if (index < state.correctCount) row.classList.add('complete');
      if (index === state.correctCount && !state.completed) row.classList.add('current');
      row.innerHTML = `<span class="check-icon">${index < state.correctCount ? '✓' : '○'}</span><span>${escapeHtml(item)}</span>`;
      elements.launchChecklist.appendChild(row);
    });
  }

  function renderQuestion() {
    state.question = ConversionEngine.generateQuestion();
    state.locked = false;
    elements.familyBadge.textContent = state.question.familyLabel;
    elements.familyBadge.dataset.family = state.question.familyKey;
    elements.numberInput.value = '';
    elements.unitInput.value = '';
    elements.numberInput.className = '';
    elements.unitInput.className = '';
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
    elements.submitButton.disabled = false;
    renderCalculation();
    requestAnimationFrame(() => elements.numberInput.focus());
  }

  function updateProgress() {
    const percent = Math.min((state.correctCount / MISSION_TOTAL) * 100, 100);
    elements.progressText.textContent = `${state.correctCount} / ${MISSION_TOTAL} authorized`;
    elements.progressFill.style.width = `${percent}%`;
    elements.fuelLiquid.style.height = `${percent}%`;
    elements.fuelPercent.textContent = `${Math.round(percent)}%`;
    elements.gaugeNeedle.style.transform = `rotate(${-70 + percent * 1.4}deg)`;
    renderChecklist();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (state.locked || state.completed) return;

    const result = ConversionEngine.evaluateAnswer(
      elements.numberInput.value,
      elements.unitInput.value,
      state.question
    );

    elements.numberInput.classList.toggle('entry-correct', result.numberCorrect);
    elements.numberInput.classList.toggle('entry-guidance', !result.numberCorrect);
    elements.unitInput.classList.toggle('entry-correct', result.unitCorrect);
    elements.unitInput.classList.toggle('entry-guidance', !result.unitCorrect);

    if (!result.correct) {
      window.AcademySound?.play('incorrect');
      window.AcademySound?.play('incorrect');
    elements.feedback.className = 'feedback guidance-feedback';
      elements.feedback.textContent = result.message;
      if (!result.numberCorrect) elements.numberInput.focus();
      else elements.unitInput.focus();
      return;
    }

    state.locked = true;
    elements.submitButton.disabled = true;
    window.AcademySound?.play('correct');
    elements.feedback.className = 'feedback correct-feedback';
    elements.feedback.textContent = result.message;
    state.correctCount += 1;
    updateProgress();

    if (state.correctCount >= MISSION_TOTAL) {
      state.completed = true;
      setTimeout(startLaunchSequence, 950);
    } else {
      setTimeout(renderQuestion, 1050);
    }
  }

  function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async function startLaunchSequence() {
    document.body.classList.add('mission-ending');
    elements.submitButton.disabled = true;
    elements.feedback.className = 'feedback correct-feedback';
    elements.feedback.textContent = 'All launch calculations authorized. Launch sequence initiated.';

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
    RocketFuelCampaign.completeMission(3);
    await delay(1200);
    Academy.completeActivity("rocket-fuel");
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
    updateProgress();
    renderQuestion();
  }

  elements.answerForm.addEventListener('submit', handleSubmit);
  elements.playAgainButton.addEventListener('click', RocketFuelCampaign.returnToCampaign);
  resetMission();
})();
