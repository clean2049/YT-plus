// background.js
// This keeps the extension active in the background context
chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube PLUS installed and active.");
});
