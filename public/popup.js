document.addEventListener("DOMContentLoaded", async () => {
  const langSelect = document.getElementById("targetLang");
  const autoTranslateCheckbox = document.getElementById("autoTranslate");
  const notificationsCheckbox = document.getElementById("showNotifications");

  // Get languages from background script
  chrome.runtime.sendMessage({ type: "getLanguages" }, (languages) => {
    // Populate language dropdown
    for (const [code, name] of Object.entries(languages)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      langSelect.appendChild(option);
    }

    // Load saved settings
    chrome.storage.local.get(
      ["targetLanguage", "autoTranslate", "showNotifications"],
      (settings) => {
        langSelect.value = settings.targetLanguage || "en";
        autoTranslateCheckbox.checked = settings.autoTranslate || false;
        notificationsCheckbox.checked = settings.showNotifications || true;
      }
    );
  });

  // Save settings when changed
  langSelect.addEventListener("change", (e) => {
    const newLang = e.target.value;
    chrome.runtime.sendMessage({
      type: "setLanguage",
      language: newLang,
      showNotification: notificationsCheckbox.checked,
    });
  });

  autoTranslateCheckbox.addEventListener("change", (e) => {
    chrome.storage.local.set({ autoTranslate: e.target.checked });
  });

  notificationsCheckbox.addEventListener("change", (e) => {
    chrome.storage.local.set({ showNotifications: e.target.checked });
  });
});
