let isSharpCornersEnabled = false;
let cornerEnforcerInterval = null;

// --- QUALITY FORCER LOGIC ---
function forceQuality(quality) {
  const script = document.createElement('script');
  script.textContent = `
  try {
    let player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
    if (!player) {
      player = document.querySelector('ytd-player') || document.querySelector('.video-stream');
    }
    if (player && typeof player.setPlaybackQualityRange === 'function') {
      player.setPlaybackQualityRange('${quality}');
      player.setPlaybackQuality('${quality}');
    }
    const now = Date.now();
    window.localStorage.setItem('yt-player-quality', JSON.stringify({
      data: '${quality}',
      expiration: now + 2592000000,
      creation: now
    }));
  } catch (e) {
    console.error("YouTube Quality Forcer Error:", e);
  }
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// --- NONSTOP ANTI-PAUSE LOOP ---
setInterval(() => {
  const ytConfirmBtn = document.querySelector('yt-button-renderer#confirm-button a, ytd-popup-container paper-button#button');
  const ytmConfirmBtn = document.querySelector('ytmusic-you-there-renderer yt-button-renderer button');
  if (ytConfirmBtn && ytConfirmBtn.offsetWidth > 0) ytConfirmBtn.click();
  if (ytmConfirmBtn && ytmConfirmBtn.offsetWidth > 0) ytmConfirmBtn.click();
}, 5000);

// --- THE NUCLEAR SHARP CORNERS ENGINE ---
const GLOBAL_SHARP_CSS = `
* {
  border-radius: 0px !important;
  --ytd-thumbnail-border-radius: 0px !important;
  --yt-spec-thumbnail-border-radius: 0px !important;
  --yt-spec-2x-border-radius: 0px !important;
  --yt-spec-3x-border-radius: 0px !important;
  --yt-spec-4x-border-radius: 0px !important;
  --yt-button-border-radius: 0px !important;
  --yt-spec-button-chip-background-shape: 0px !important;
  --ytd-player-border-radius: 0px !important;
  --yt-spec-base-background-shape: 0px !important;
  --ytd-searchbox-border-radius: 0px !important;
  --ytd-backstage-image-border-radius: 0px !important;
  --yt-spec-badge-shape: 0px !important;
  --yt-spec-large-thumbnail-border-radius: 0px !important;
}

/* Force YouTube's specific tags just to be safe */
yt-image, yt-core-image, .yt-core-image, #thumbnail, #player-container, video {
  border-radius: 0px !important;
}
`;

function enforceUltimateSharpCorners() {
  if (!isSharpCornersEnabled) return;

  // 1. Apply to the main Document (Light DOM)
  if (!document.getElementById('yt-global-sharp-css')) {
    const style = document.createElement('style');
    style.id = 'yt-global-sharp-css';
    style.textContent = GLOBAL_SHARP_CSS;
    (document.documentElement || document.head).appendChild(style);
  }

  // 2. The Shadow DOM Piercer (This breaks through YouTube's hidden components)
  const allElements = document.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];

    // Strip inline styles if YouTube JS tries to force it directly
    if (el.style && el.style.borderRadius) {
      el.style.setProperty('border-radius', '0px', 'important');
    }

    // Pierce the Shadow Root and inject CSS directly inside the component
    if (el.shadowRoot && !el.shadowRoot.getElementById('yt-shadow-sharp-css')) {
      const shadowStyle = document.createElement('style');
      shadowStyle.id = 'yt-shadow-sharp-css';
      shadowStyle.textContent = '* { border-radius: 0px !important; }';
      el.shadowRoot.appendChild(shadowStyle);
    }
  }
}

function applyCornersStyle(shouldBeSharp) {
  isSharpCornersEnabled = shouldBeSharp;

  if (shouldBeSharp) {
    enforceUltimateSharpCorners();
    // Run the enforcer every 500ms so YouTube can never override it
    if (!cornerEnforcerInterval) {
      cornerEnforcerInterval = setInterval(enforceUltimateSharpCorners, 500);
    }
  } else {
    // Clean up if the user turns the feature off
    clearInterval(cornerEnforcerInterval);
    cornerEnforcerInterval = null;

    const globalStyle = document.getElementById('yt-global-sharp-css');
    if (globalStyle) globalStyle.remove();

    const allElements = document.querySelectorAll('*');
    for (let el of allElements) {
      if (el.shadowRoot) {
        const shadowStyle = el.shadowRoot.getElementById('yt-shadow-sharp-css');
        if (shadowStyle) shadowStyle.remove();
      }
    }
  }
}

// Initial configuration loading on page start
chrome.storage.local.get(['ytQuality', 'sharpCorners'], (result) => {
  const quality = result.ytQuality || 'hd1080';
  forceQuality(quality);
  applyCornersStyle(!!result.sharpCorners);
});

// Listener loop for popup dashboard updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateQuality") forceQuality(request.quality);
  if (request.action === "toggleCorners") applyCornersStyle(request.enabled);
});
