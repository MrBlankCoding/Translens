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

function replaceWithTranslation(translation, originalText, detectedLanguage) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.className = "qt-translated-text";
  span.setAttribute("data-original", originalText);
  span.setAttribute("data-lang", detectedLanguage);
  span.innerHTML = translation;

  // Apply styles
  span.style.cssText = `
    position: relative;
    background-color: rgba(240, 248, 255, 0.8);
    cursor: help;
    transition: background-color 0.2s;
    padding: 0 2px;
    border-radius: 2px;
  `;

  // Add hover effect
  span.addEventListener("mouseenter", createTooltip);
  span.addEventListener("mouseleave", removeTooltip);
  span.addEventListener("dblclick", revertToOriginal);

  range.deleteContents();
  range.insertNode(span);
  selection.removeAllRanges();
}

function createTooltip(event) {
  const span = event.target;
  const tooltip = document.createElement("div");
  tooltip.className = "qt-translation-tooltip";

  const originalText = span.getAttribute("data-original");
  const detectedLanguage = span.getAttribute("data-lang");

  tooltip.innerHTML = `
    <div>Original (${
      SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage
    }):</div>
    <div>${originalText}</div>
    <div class="qt-tooltip-footer">Double-click to revert</div>
  `;

  tooltip.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 300px;
    word-wrap: break-word;
    z-index: 10000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  span.appendChild(tooltip);
}

function removeTooltip(event) {
  const tooltip = event.target.querySelector(".qt-translation-tooltip");
  if (tooltip) tooltip.remove();
}

function revertToOriginal(event) {
  const span = event.target;
  const originalText = span.getAttribute("data-original");
  span.innerHTML = originalText;
  span.style.backgroundColor = "transparent";
  span.style.cursor = "text";

  // Remove all event listeners
  const newSpan = span.cloneNode(true);
  span.parentNode.replaceChild(newSpan, span);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "replace") {
    replaceWithTranslation(
      request.translation,
      request.originalText,
      request.detectedLanguage
    );
  }
});
