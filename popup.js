// popup.js - Settings persistence
(function () {
    'use strict';

    const DEFAULTS = {
        hideHeader: true,
        removeFade: true,
        hideWarning: true,
        toggleInput: true,
        compactInput: true
    };

    const toggleIds = Object.keys(DEFAULTS);

    // Load settings from storage and set toggle states
    chrome.storage.sync.get(DEFAULTS, (settings) => {
        toggleIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = settings[id];
        });
    });

    // Save on toggle change and notify the active tab
    toggleIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('change', () => {
            const update = {};
            update[id] = el.checked;

            chrome.storage.sync.set(update, () => {
                // Notify the active Gemini tab to apply changes immediately
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].url && tabs[0].url.includes('gemini.google.com')) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', settings: update });
                    }
                });
            });
        });
    });
})();
