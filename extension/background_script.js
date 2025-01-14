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

// All javascript here will be execute in background.

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

async function buildDownloadParams(url, config = null) {
  const paramsManager = new ParamsManager();
  
  // Add URL as main argument
  paramsManager.addArgument(url);
  
  if (config) {
    // Load preset if available
    if (config.selectedPreset) {
      const preset = config.customPresets?.[config.selectedPreset] || DEFAULT_PRESETS[config.selectedPreset];
      if (preset) {
        const presetOptions = config.presetOptions?.[config.selectedPreset] || preset.defaultOptions || {};
        paramsManager.fromPreset(preset, presetOptions);
      }
    }
    
    // Add configuration options
    paramsManager.fromConfig(config);
  }
  
  return paramsManager.toArray();
}

async function handleCommand(command) {
  try {
    // Query active tab first
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs || !tabs[0]) {
      console.error('No active tab found');
      return;
    }
    
    const currentUrl = tabs[0].url;
    const currentTabId = tabs[0].id;
    
    if (command === 'forward-url') {
      // Quick download with default settings
      const params = await buildDownloadParams(currentUrl);
      console.log('Quick download params:', params);
      
      runtime.sendNativeMessage('z2dlp_host', {
        action: 'download',
        params: params
      }, response => {
        console.log('Native response:', response);
      });
    } 
    else if (command === 'forward-url-with-param') {
      // Advanced download with current configuration
      const config = await storage.sync.get(null);
      
      chrome.tabs.sendMessage(currentTabId, {action: "showPrompt"}, async function(response) {
        if (response && response.userInput) {
          const params = await buildDownloadParams(currentUrl, {
            ...config,
            outputPattern: response.userInput // Override output pattern with user input
          });
          
          console.log('Advanced download params:', params);
          
          runtime.sendNativeMessage('z2dlp_host', {
            action: 'download',
            params: params
          }, response => {
            console.log('Native response:', response);
          });
        }
      });
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
}

// Default presets (copied from options.js)
const DEFAULT_PRESETS = {
    'best': {
        name: 'Best Quality (Auto)',
        params: ['-f', 'best'],
        isBuiltin: true,
        defaultOptions: {
            embedThumbnail: false,
            writeAllThumbnails: false,
            addMetadata: false
        }
    },
    'bestvideo+bestaudio': {
        name: 'Best Video + Audio',
        params: ['-f', 'bestvideo+bestaudio'],
        isBuiltin: true,
        defaultOptions: {
            embedThumbnail: false,
            writeAllThumbnails: false,
            addMetadata: false
        }
    },
    'bestvideo': {
        name: 'Best Video Only',
        params: ['-f', 'bestvideo'],
        isBuiltin: true,
        defaultOptions: {
            embedThumbnail: false,
            writeAllThumbnails: false,
            addMetadata: false
        }
    },
    'bestaudio': {
        name: 'Best Audio Only',
        params: ['-f', 'bestaudio'],
        isBuiltin: true,
        defaultOptions: {
            embedThumbnail: false,
            writeAllThumbnails: false,
            addMetadata: false
        }
    }
};
