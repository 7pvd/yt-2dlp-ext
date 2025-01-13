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

// Detect browser type and use appropriate API
const storage = (typeof browser !== 'undefined' ? browser.storage : chrome.storage);
const runtime = (typeof browser !== 'undefined' ? browser.runtime : chrome.runtime);

// Handle keyboard shortcuts from Chrome
chrome.commands.onCommand.addListener(function(command) {
  handleCommand(command);
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received message:', request);
  if (request.command) {
    handleCommand(request.command);
  }
});

function handleCommand(command) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      
      storage.sync.get({
        urlPrefix: 'ytdlp://call'
      }).then(items => {

        if (command === 'forward-url') {
          const targetUrl = `${items.urlPrefix}?url=${encodeURIComponent(currentUrl)}`;
          console.log('QUICK Opening URL:', targetUrl);
          runtime.sendNativeMessage('z2dlp_host', {
            url: targetUrl
          }, response => {
            console.log('Native response:', response);
          });
        } 
        else if (command === 'forward-url-with-param') {
          chrome.tabs.sendMessage(tabs[0].id, {action: "showPrompt"}, function(response) {
            if (response && response.userInput) {
              const targetUrl = `${items.urlPrefix}?url=${encodeURIComponent(currentUrl)}&param1=${encodeURIComponent(response.userInput)}`;
              console.log('ADV Opening URL with param:', targetUrl);
              runtime.sendNativeMessage('z2dlp_host', {
                url: targetUrl
              }, response => {
                console.log('Native response:', response);
              });
            }
          });
        }
      }).catch(error => {
        console.error('Error getting storage:', error);
      });
    }
  });
} 
