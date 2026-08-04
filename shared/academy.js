(() => {
  "use strict";

  const STORAGE_KEY = "chemistrySkillsAcademyCompletion";

  const SOUND_KEY = "chemistrySkillsAcademySoundEnabled";
  let audioContext = null;

  function soundEnabled() {
    try { return sessionStorage.getItem(SOUND_KEY) !== "false"; }
    catch (error) { return true; }
  }

  function setSoundEnabled(enabled) {
    try { sessionStorage.setItem(SOUND_KEY, String(Boolean(enabled))); }
    catch (error) { /* Sound remains usable when storage is unavailable. */ }
    updateSoundButtons();
  }

  function getAudioContext() {
    if (!soundEnabled()) return null;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!audioContext) audioContext = new Context();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency, duration = 0.12, options = {}) {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, context.currentTime + duration);
    const volume = options.volume ?? 0.055;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  function playSound(name) {
    if (!soundEnabled()) return;
    const sequences = {
      click: [[420, .045, 0]],
      correct: [[523.25, .09, 0], [659.25, .11, .07]],
      incorrect: [[220, .11, 0], [174.61, .14, .08]],
      inflate: [[260, .10, 0], [330, .12, .07]],
      crate: [[180, .06, 0], [125, .09, .06]],
      engine: [[90, .22, 0], [125, .20, .15]],
      step: [[210, .045, 0], [260, .045, .08]],
      fuel: [[320, .07, 0], [390, .07, .06], [470, .09, .12]],
      countdown: [[660, .10, 0]],
      launch: [[95, .55, 0], [150, .45, .18], [240, .35, .40]],
      complete: [[523.25, .12, 0], [659.25, .12, .11], [783.99, .16, .22]],
      academyComplete: [[523.25, .14, 0], [659.25, .14, .12], [783.99, .14, .24], [1046.5, .30, .38]]
    };
    (sequences[name] || sequences.click).forEach(([frequency, duration, delay]) => {
      window.setTimeout(() => tone(frequency, duration, {
        type: name === "launch" || name === "engine" ? "sawtooth" : "sine",
        volume: name === "launch" ? .035 : .055,
        endFrequency: name === "launch" ? frequency * 1.8 : undefined
      }), delay * 1000);
    });
  }

  function updateSoundButtons() {
    document.querySelectorAll("[data-academy-sound-toggle]").forEach((button) => {
      const enabled = soundEnabled();
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "Mute Academy sounds" : "Turn on Academy sounds");
      button.innerHTML = `<span aria-hidden="true">${enabled ? "🔊" : "🔇"}</span><span>${enabled ? "Sound On" : "Sound Off"}</span>`;
    });
  }

  window.AcademySound = Object.freeze({ play: playSound, isEnabled: soundEnabled, setEnabled: setSoundEnabled });

  const ACTIVITY_IDS = Object.freeze([
    "metric-balloon",
    "sig-fig-factory",
    "scientific-notation",
    "rocket-fuel"
  ]);

  const script = document.currentScript;
  const academyHref = script?.dataset.academyHref || "index.html";

  function readCompletion() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      return ACTIVITY_IDS.reduce((result, id) => {
        result[id] = parsed[id] === true;
        return result;
      }, {});
    } catch (error) {
      return ACTIVITY_IDS.reduce((result, id) => {
        result[id] = false;
        return result;
      }, {});
    }
  }

  function writeCompletion(completion) {
    const safeCompletion = ACTIVITY_IDS.reduce((result, id) => {
      result[id] = completion[id] === true;
      return result;
    }, {});

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeCompletion));
    } catch (error) {
      // Activities remain playable when sessionStorage is unavailable.
    }

    return safeCompletion;
  }

  let lastRenderedCount = null;

  function refreshAcademy() {
    const completion = readCompletion();
    const completedCount = ACTIVITY_IDS.filter((id) => completion[id]).length;
    const percent = Math.round((completedCount / ACTIVITY_IDS.length) * 100);

    const count = document.getElementById("academy-progress-count");
    const percentText = document.getElementById("academy-progress-percent");
    const fill = document.getElementById("academy-progress-fill");

    if (count) count.textContent = `${completedCount} of ${ACTIVITY_IDS.length} Activities Completed`;
    if (percentText) percentText.textContent = `${percent}% Complete`;
    if (fill) {
      fill.style.width = `${percent}%`;
      fill.classList.remove("progress-celebrate");
      void fill.offsetWidth;
      if (lastRenderedCount !== null && completedCount > lastRenderedCount) fill.classList.add("progress-celebrate");
    }

    if (lastRenderedCount !== null && completedCount > lastRenderedCount) {
      playSound(completedCount === ACTIVITY_IDS.length ? "academyComplete" : "complete");
    }
    lastRenderedCount = completedCount;

    const certificateClaim = document.getElementById("certificate-claim");
    if (certificateClaim) certificateClaim.hidden = completedCount !== ACTIVITY_IDS.length;

    document.querySelectorAll("[data-activity-id]").forEach((card) => {
      const completed = completion[card.dataset.activityId] === true;
      card.classList.toggle("completed", completed);
      const ribbon = card.querySelector(".completion-ribbon");
      if (ribbon) ribbon.hidden = !completed;
    });

    return completion;
  }

  function returnToAcademy() {
    window.location.href = academyHref;
  }

  function completeActivity(activityId) {
    if (!ACTIVITY_IDS.includes(activityId)) return false;
    const completion = readCompletion();
    completion[activityId] = true;
    writeCompletion(completion);
    refreshAcademy();
    returnToAcademy();
    return true;
  }

  function initializeSoundControl() {
    if (document.querySelector("[data-academy-sound-toggle]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "academy-sound-toggle";
    button.dataset.academySoundToggle = "";
    button.addEventListener("click", () => {
      setSoundEnabled(!soundEnabled());
      if (soundEnabled()) playSound("click");
    });
    document.body.appendChild(button);
    updateSoundButtons();
    document.addEventListener("click", (event) => {
      if (event.target.closest("button, .play-button")) playSound("click");
    }, { capture: true });
  }

  function initializeCertificate() {
    const form = document.getElementById("certificate-form");
    const nameInput = document.getElementById("student-name");
    const error = document.getElementById("certificate-name-error");
    const overlay = document.getElementById("certificate-overlay");
    const studentName = document.getElementById("certificate-student-name");
    const certificateDate = document.getElementById("certificate-date");
    const closeButton = document.getElementById("certificate-close");
    const printButton = document.getElementById("certificate-print");

    if (!form || !nameInput || !overlay || !studentName || !certificateDate) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const completion = readCompletion();
      const academyComplete = ACTIVITY_IDS.every((id) => completion[id]);
      const name = nameInput.value.trim().replace(/\s+/g, " ");

      if (!academyComplete || !name) {
        if (error) error.hidden = Boolean(name);
        if (!name) nameInput.focus();
        return;
      }

      if (error) error.hidden = true;
      studentName.textContent = name;
      certificateDate.textContent = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date());
      overlay.hidden = false;
      playSound("academyComplete");
      document.body.style.overflow = "hidden";
      closeButton?.focus();
    });

    nameInput.addEventListener("input", () => {
      if (error) error.hidden = true;
    });

    function closeCertificate() {
      overlay.hidden = true;
      document.body.style.overflow = "";
      nameInput.focus();
    }

    closeButton?.addEventListener("click", closeCertificate);
    printButton?.addEventListener("click", () => window.print());
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeCertificate();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) closeCertificate();
    });
  }

  window.Academy = Object.freeze({
    completeActivity,
    readCompletion,
    refreshAcademy,
    returnToAcademy
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      refreshAcademy();
      initializeSoundControl();
      initializeCertificate();
    }, { once: true });
  } else {
    refreshAcademy();
    initializeSoundControl();
    initializeCertificate();
  }
})();
