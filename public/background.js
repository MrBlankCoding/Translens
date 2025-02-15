const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

let targetLanguage = "en";

chrome.runtime.onInstalled.addListener(() => {
  // Set default language
  chrome.storage.local.set({
    targetLanguage: "en",
    autoTranslate: false,
    showNotifications: true,
  });

  // Create context menu
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "Translate Selection",
    contexts: ["selection"],
  });

  // Add auto-translate toggle
  chrome.contextMenus.create({
    id: "autoTranslateToggle",
    title: "Auto-translate pages",
    type: "checkbox",
    contexts: ["all"],
  });
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "setLanguage":
      targetLanguage = request.language;
      chrome.storage.local.set({ targetLanguage: request.language });
      if (request.showNotification) {
        showNotification(
          `Language changed to ${SUPPORTED_LANGUAGES[request.language]}`
        );
      }
      break;
    case "translateText":
      translateText(request.text, sender.tab.id);
      break;
    case "getLanguages":
      sendResponse(SUPPORTED_LANGUAGES);
      return true;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translateSelection") {
    await translateText(info.selectionText, tab.id);
  } else if (info.menuItemId === "autoTranslateToggle") {
    chrome.storage.local.set({ autoTranslate: info.checked });
  }
});

async function translateText(text, tabId) {
  try {
    const { targetLanguage } = await chrome.storage.local.get("targetLanguage");
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data[0][0][0];
    const detectedLanguage = data[2];

    // Send message to content script instead of executing script
    await chrome.tabs.sendMessage(tabId, {
      action: "replace",
      translation,
      originalText: text,
      detectedLanguage,
    });
  } catch (error) {
    console.error("Translation error:", error);
    showNotification("Translation failed. Please try again.");
  }
}

function showNotification(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "Quick Translator",
    message,
  });
}
