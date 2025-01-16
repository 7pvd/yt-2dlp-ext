/*
 *             M""""""""`M            dP
 *             Mmmmmm   .M            88
 *             MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *             MMP  .MMMMM  88    88  88888"    88'  `88
 *             M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *             M         M  `88888P'  dP   `YP  `88888P'
 *             MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *             * * * * * * * * * * * * * * * * * * * * *
 *             * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *             * -  Copyright © 2025 (Z) Programing  - *
 *             *    -  -  All Rights Reserved  -  -    *
 *             * * * * * * * * * * * * * * * * * * * * *
 */

// Will execute after page (TAB) load.
console.info('Content script loaded');

// Constants
const BUTTON_ID = 'z2dlp-download-btn';
const TARGET_BUTTON = '#owner';
const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?youtube\.com/;

// Styles for the download button
const buttonStyle = `
    #${BUTTON_ID} {
        background-color: #28a745;
        color: #FFFFFF;
        border: 1px solid #3F3F3F;
        border-color: rgba(255,255,255,0.2);
        margin-left: 8px;
        padding: 0 16px;
        border-radius: 18px;
        font-size: 14px;
        font-family: Roboto, Noto, sans-serif;
        font-weight: 500;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        height: 36px;
        line-height: normal;
        cursor: pointer;
    }
    #${BUTTON_ID}:hover {
        background-color: #3F3F3F;
        color: #ffffff;
        border-color: #3F3F3F;
    }
`;

// Add styles to the document
function addStyles() {
    const style = document.createElement('style');
    style.textContent = buttonStyle;
    document.head.appendChild(style);
}

// Create download button element
function createDownloadButton() {
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.innerText = 'Download';
    button.addEventListener('click', () => {
        browser.runtime.sendMessage({command: 'forward-url'});
    });
    return button;
}

// Add download button to YouTube page
function addDownloadButton() {
    const container = document.querySelector(TARGET_BUTTON);
    if (!container || document.getElementById(BUTTON_ID)) {
        return;
    }
    
    const button = createDownloadButton();
    container.appendChild(button);
    console.log('Download button added');
}

// Watch for YouTube navigation
function watchForYouTubeNavigation() {
    // YouTube uses its own router, so we need to watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (YOUTUBE_URL_PATTERN.test(location.href)) {
                setTimeout(addDownloadButton, 1000); // Delay to ensure DOM is ready
            }
        }
    }).observe(document.body, {childList: true, subtree: true});
}

// Initialize
function init() {
    if (YOUTUBE_URL_PATTERN.test(location.href)) {
        addStyles();
        addDownloadButton();
        watchForYouTubeNavigation();
    }
}

// Listen for keyboard events
document.addEventListener('keydown', function(e) {
    console.log('Content script keydown:', e);
    if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'y' || e.key === 'Y') {
            browser.runtime.sendMessage({command: 'forward-url'});
        } else if (e.key === 'u' || e.key === 'U') {
            console.log('sending {command: forward-url-with-param}')
            browser.runtime.sendMessage({command: 'forward-url-with-param'});
        }
    }
});

// Listen for messages from background script
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.info('Content script received message:', request);
    console.info('from', sender);
    console.info(sendResponse);

    if (request.action === "showPrompt") {
        const userInput = window.prompt('Please enter parameter:');
        sendResponse({userInput: userInput});
    }
    return true; // Keep the message channel open for async response
});

// Start the script
init();
