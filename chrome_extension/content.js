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

// Listen for keyboard events
document.addEventListener('keydown', function(e) {
  console.log('Content script keydown:', e);
  if (e.ctrlKey && e.altKey) {
    if (e.key === 'y' || e.key === 'Y') {
      chrome.runtime.sendMessage({command: 'forward-url'});
    } else if (e.key === 'u' || e.key === 'U') {
      console.log('sending {command: forward-url-with-param}')
      chrome.runtime.sendMessage({command: 'forward-url-with-param'});
    }
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "showPrompt") {
    const userInput = window.prompt('Please enter parameter:');
    sendResponse({userInput: userInput});
  }
  return true; // Keep the message channel open for async response
}); 
