
(() => {
  'use strict';
  const progress = RocketFuelCampaign.readProgress();
  const allComplete = progress.mission1 && progress.mission2 && progress.mission3;
  document.getElementById('campaignComplete').hidden = !allComplete;

  [1,2,3].forEach(number => {
    const complete = progress[`mission${number}`];
    const unlocked = RocketFuelCampaign.isUnlocked(number) || allComplete;
    const card = document.querySelector(`[data-mission="${number}"]`);
    const status = document.getElementById(`status${number}`);
    const play = document.getElementById(`play${number}`);
    card.classList.toggle('complete', complete);
    card.classList.toggle('locked', !unlocked);
    status.textContent = complete ? '✓ Mission Complete' : unlocked ? 'Available' : 'Locked';
    play.setAttribute('aria-disabled', String(!unlocked));
    play.textContent = complete ? `Replay Mission ${number}` : unlocked ? `Play Mission ${number}` : 'Locked';
  });
})();
