document.addEventListener('DOMContentLoaded', () => {
  const qualitySelect = document.getElementById('qualitySelect');
  const sharpCornersToggle = document.getElementById('sharpCornersToggle');

  // Load saved configurations
  chrome.storage.local.get(['ytQuality', 'sharpCorners'], (result) => {
    qualitySelect.value = result.ytQuality || 'hd1080';
    sharpCornersToggle.checked = !!result.sharpCorners;
  });

  // Handle Quality Dropdown Changes
  qualitySelect.addEventListener('change', (e) => {
    const selectedQuality = e.target.value;
    chrome.storage.local.set({ ytQuality: selectedQuality });

    sendTabMessage({ action: "updateQuality", quality: selectedQuality });
  });

  // Handle Sharp Corners Toggle Changes
  sharpCornersToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ sharpCorners: isChecked });

    sendTabMessage({ action: "toggleCorners", enabled: isChecked });
  });
});

// Helper function to talk to the active YouTube tab
function sendTabMessage(messageData) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && (tabs[0].url.includes("youtube.com") || tabs[0].url.includes("youtube-nocookie.com"))) {
      chrome.tabs.sendMessage(tabs[0].id, messageData);
    }
  });
}
