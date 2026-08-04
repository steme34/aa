(() => {
  "use strict";

  const STORAGE_KEY = "scientificNotationCampaignProgress";
  const DEFAULT_PROGRESS = Object.freeze({ mission1: false, mission2: false });

  function readProgress() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_PROGRESS };
      const parsed = JSON.parse(stored);
      return {
        mission1: parsed.mission1 === true,
        mission2: parsed.mission2 === true
      };
    } catch (error) {
      return { ...DEFAULT_PROGRESS };
    }
  }

  function writeProgress(progress) {
    const safeProgress = {
      mission1: progress.mission1 === true,
      mission2: progress.mission2 === true
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeProgress));
    } catch (error) {
      // The games remain playable even if session storage is unavailable.
    }

    return safeProgress;
  }

  function completeMission(missionId) {
    if (missionId !== "mission1" && missionId !== "mission2") return readProgress();
    const progress = readProgress();
    progress[missionId] = true;
    return writeProgress(progress);
  }

  function isCampaignComplete() {
    const progress = readProgress();
    return progress.mission1 && progress.mission2;
  }

  function renderStatus(element, completed) {
    if (!element) return;
    element.textContent = completed ? "✓ Completed" : "Not Completed";
    element.classList.toggle("completed", completed);
  }

  function renderHub() {
    const progress = readProgress();
    renderStatus(document.getElementById("mission1-status"), progress.mission1);
    renderStatus(document.getElementById("mission2-status"), progress.mission2);

    const completePanel = document.getElementById("campaign-complete");
    if (completePanel) completePanel.hidden = !(progress.mission1 && progress.mission2);
  }

  function returnToCampaign(delay = 1800) {
    window.setTimeout(() => {
      window.location.href = "../index.html";
    }, delay);
  }

  window.ScientificNotationCampaign = Object.freeze({
    readProgress,
    completeMission,
    isCampaignComplete,
    renderHub,
    returnToCampaign
  });
})();
