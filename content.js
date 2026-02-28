// content.js - Gemini Web Customizer (with settings support)
(function () {
    'use strict';

    const DEFAULTS = {
        hideHeader: true,
        removeFade: true,
        hideWarning: true,
        toggleInput: true,
        compactInput: true
    };

    let settings = { ...DEFAULTS };
    let isInputOpen = true;
    let btnCreated = false;

    // Load settings from storage
    function loadSettings(callback) {
        if (chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(DEFAULTS, (s) => {
                settings = s;
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    }

    // Listen for settings changes from the popup
    if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.type === 'settingsChanged') {
                Object.assign(settings, msg.settings);
                applyAll();
            }
        });
    }

    // Clean up old broken classes from previous extension versions
    function cleanupOldClasses() {
        const oldClasses = [
            'gc-input-wrapper-layer', 'gc-chat-pill', 'gc-textarea-element',
            'gc-contents', 'gc-input-section', 'gc-toolbar-section',
            'gc-tools-wrapper-layer', 'gc-left-tools', 'gc-right-tools',
            'gc-pill-container', 'gc-pill-wrapper', 'gc-warning-text',
            'gc-warning-box', 'gc-hide-element', 'gc-hide-fade',
            'gc-hide-header', 'gc-header', 'gc-header-hidden',
            'gc-tools-left', 'gc-tools-right', 'gemini-customizer'
        ];
        oldClasses.forEach(cls => {
            document.querySelectorAll('.' + cls).forEach(el => {
                el.classList.remove(cls);
                el.style.removeProperty('display');
                el.style.removeProperty('mask-image');
                el.style.removeProperty('-webkit-mask-image');
                el.style.removeProperty('height');
                el.style.removeProperty('opacity');
                el.style.removeProperty('margin');
                el.style.removeProperty('padding');
                el.style.removeProperty('pointer-events');
                el.style.removeProperty('overflow');
                el.style.removeProperty('position');
                el.style.removeProperty('visibility');
            });
        });
    }

    // Check if home screen
    function isHomeScreen() {
        const url = window.location.pathname;
        if (url === '/app' || url === '/app/') return true;
        return false;
    }

    // Detect dark mode
    function isDarkMode() {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)') return false;
        const match = bg.match(/\d+/g);
        if (match) {
            return (parseInt(match[0]) + parseInt(match[1]) + parseInt(match[2])) / 3 < 128;
        }
        return false;
    }

    // Apply header visibility
    function applyHeader() {
        document.body.classList.toggle('gc-hide-header-on', settings.hideHeader);
    }

    // Apply fade removal
    function applyFade() {
        document.body.classList.toggle('gc-remove-fade-on', settings.removeFade);
    }

    // Apply compact input
    function applyCompactInput() {
        document.body.classList.toggle('gc-compact-input-on', settings.compactInput);
    }

    // Apply warning removal
    function applyWarning() {
        if (settings.hideWarning) {
            document.querySelectorAll('condensed-tos-disclaimer, hallucination-disclaimer').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('a, span').forEach(el => {
                if (el.innerText && el.innerText.includes('can make mistakes') && el.children.length <= 2) {
                    if (parseInt(window.getComputedStyle(el).fontSize) <= 14) {
                        el.style.display = 'none';
                        if (el.parentElement && el.parentElement.innerText.trim().length < 100) {
                            el.parentElement.style.display = 'none';
                        }
                    }
                }
            });
        }
    }

    // Create Ask button
    function createAskButton() {
        if (document.getElementById('gc-ask-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'gc-ask-btn';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>Ask</span>
        `;
        document.body.appendChild(btn);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleInputVisibility();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isInputOpen && !isHomeScreen()) {
                toggleInputVisibility();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '/' && !isHomeScreen()) {
                e.preventDefault();
                toggleInputVisibility();
            }
        });

        btnCreated = true;
    }

    function toggleInputVisibility() {
        const inputContainer = document.querySelector('input-container');
        const btn = document.getElementById('gc-ask-btn');
        if (!inputContainer || !btn) return;

        if (isInputOpen) {
            inputContainer.classList.add('gc-input-hidden');
            inputContainer.classList.remove('gc-input-visible');
            btn.classList.remove('gc-ask-btn-active');
            isInputOpen = false;
        } else {
            inputContainer.classList.remove('gc-input-hidden');
            inputContainer.classList.add('gc-input-visible');
            btn.classList.add('gc-ask-btn-active');
            isInputOpen = true;
            setTimeout(() => {
                const editor = document.querySelector('.ql-editor.textarea');
                if (editor) editor.focus();
            }, 150);
        }
    }

    // Apply toggle input feature
    function applyToggleInput() {
        const inputContainer = document.querySelector('input-container');
        const btn = document.getElementById('gc-ask-btn');

        if (settings.toggleInput) {
            if (!btnCreated) createAskButton();

            if (isHomeScreen()) {
                // Home: show input, hide button
                if (inputContainer) {
                    inputContainer.classList.remove('gc-input-hidden');
                    inputContainer.classList.remove('gc-input-visible');
                }
                if (btn) btn.style.display = 'none';
                isInputOpen = true;
            } else {
                if (btn) btn.style.display = 'flex';
                if (!isInputOpen && inputContainer) {
                    inputContainer.classList.add('gc-input-hidden');
                    inputContainer.classList.remove('gc-input-visible');
                }
            }

            // Theme the button
            if (btn) {
                btn.setAttribute('data-theme', isDarkMode() ? 'dark' : 'light');
            }
        } else {
            // Feature off: show input, hide button
            if (inputContainer) {
                inputContainer.classList.remove('gc-input-hidden');
                inputContainer.classList.remove('gc-input-visible');
            }
            if (btn) btn.style.display = 'none';
            isInputOpen = true;
        }
    }

    // Apply all settings
    function applyAll() {
        applyHeader();
        applyFade();
        applyCompactInput();
        applyWarning();
        applyToggleInput();
    }

    // Initialize
    cleanupOldClasses();
    setTimeout(cleanupOldClasses, 500);
    setTimeout(cleanupOldClasses, 1500);

    loadSettings(() => {
        applyAll();

        // Wait for input container
        const waitForInput = setInterval(() => {
            const inputContainer = document.querySelector('input-container');
            if (inputContainer) {
                applyAll();
                if (settings.toggleInput && !isHomeScreen()) {
                    inputContainer.classList.add('gc-input-hidden');
                    isInputOpen = false;
                }
                clearInterval(waitForInput);
            }
        }, 300);

        // Periodic checks for SPA navigation
        setInterval(applyAll, 2000);
    });
})();
