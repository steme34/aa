(() => {
  "use strict";


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

  const script = document.currentScript;
  const academyHref = script?.dataset.academyHref || "../index.html";
  const campaignHref = script?.dataset.campaignHref || "";

  if (document.querySelector(".academy-navigation")) return;

  document.body.classList.add("academy-integrated");

  const nav = document.createElement("header");
  nav.className = "academy-navigation";

  const inner = document.createElement("div");
  inner.className = "academy-navigation__inner";

  const links = document.createElement("nav");
  links.className = "academy-navigation__links";
  links.setAttribute("aria-label", "Academy navigation");

  const academyLink = document.createElement("a");
  academyLink.className = "academy-navigation__button academy-navigation__button--academy";
  academyLink.href = academyHref;
  academyLink.innerHTML = '<span class="academy-navigation__home" aria-hidden="true">⌂</span><span>Return to Academy</span>';
  links.appendChild(academyLink);

  const soundButton = document.createElement("button");
  soundButton.type = "button";
  soundButton.className = "academy-navigation__button academy-navigation__sound";
  soundButton.dataset.academySoundToggle = "";
  soundButton.addEventListener("click", () => {
    setSoundEnabled(!soundEnabled());
    if (soundEnabled()) playSound("click");
  });
  links.appendChild(soundButton);

  if (campaignHref) {
    const campaignLink = document.createElement("a");
    campaignLink.className = "academy-navigation__button";
    campaignLink.href = campaignHref;
    campaignLink.innerHTML = '<span aria-hidden="true">←</span><span>Return to Campaign</span>';
    links.appendChild(campaignLink);
  }

  const identity = document.createElement("div");
  identity.className = "academy-navigation__identity";
  identity.innerHTML = '<span class="academy-navigation__mark" aria-hidden="true">⚗</span><span><strong>Chemistry Skills Academy</strong><small>Interactive Skills Training</small></span>';

  inner.appendChild(links);
  inner.appendChild(identity);
  nav.appendChild(inner);
  document.body.insertBefore(nav, document.body.firstChild);
  updateSoundButtons();

  document.addEventListener("click", (event) => {
    if (event.target.closest("button, .play-button, .academy-navigation__button")) playSound("click");
  }, { capture: true });
})();
