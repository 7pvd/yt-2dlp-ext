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
const COMMAND_DELAY = 3000; // 3 seconds delay between commands
let lastCommandTime = 0;
let commandQueue = [];

function queueCommand(command) {
    const now = Date.now();
    const timeToWait = Math.max(0, lastCommandTime + COMMAND_DELAY - now);
    
    // Add command to queue with metadata
    commandQueue.push({
        command,
        scheduledTime: now + timeToWait
    });
    
    // Update badge to show queue length
    chrome.browserAction.setBadgeText({ text: commandQueue.length > 0 ? commandQueue.length.toString() : '' });
    chrome.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });
    
    // Schedule command execution
    setTimeout(() => processNextCommand(), timeToWait);
}

async function processNextCommand() {
    if (commandQueue.length === 0) return;
    
    const now = Date.now();
    const nextCommand = commandQueue[0];
    
    if (now >= nextCommand.scheduledTime) {
        commandQueue.shift();
        lastCommandTime = now;
        
        try {
            await handleCommand(nextCommand.command);
        } catch (error) {
            console.error('Command execution failed:', error);
            // Retry logic
            if (!nextCommand.retryCount || nextCommand.retryCount < 3) {
                const retryDelay = 1000 * (nextCommand.retryCount || 0 + 1);
                commandQueue.unshift({
                    ...nextCommand,
                    scheduledTime: now + retryDelay,
                    retryCount: (nextCommand.retryCount || 0) + 1
                });
            }
        }
        
        // Update badge
        chrome.browserAction.setBadgeText({ text: commandQueue.length > 0 ? commandQueue.length.toString() : '' });
    }
}

chrome.commands.onCommand.addListener(function(command) {
    queueCommand(command);
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Received message:', request);
    if (request.command) {
        queueCommand(request.command);
    }
});

async function buildDownloadParams(url, config = null, getManager = false) {
  const paramsManager = new ParamsManager();
  
  // Add URL as main argument
  paramsManager.addArgument(url);
  
  // Get default config if not provided
  if (!config) {
    config = await storage.sync.get(null);
  }
  
  // Add required params only if they exist in config
  if (config) {
    // Load preset if available
    if (config.selectedPreset) {
      const preset = config.customPresets?.[config.selectedPreset] || DEFAULT_PRESETS[config.selectedPreset];
      if (preset) {
        const presetOptions = config.presetOptions?.[config.selectedPreset] || preset.params || {};
        paramsManager.fromPreset(preset, presetOptions);
      }
    } else {
      // If no preset, add format option
      paramsManager.addOption('f', 'best', true);
    }
    
    // Add configuration options
    paramsManager.fromConfig(config);
  }
  
  if (getManager) {
    return paramsManager;
  }
  console.info('download params', paramsManager.toArray());

  return paramsManager.toArray();
}

// Utility function for native messaging
async function sendNativeMessage(action, params = null) {
    try {
        const message = {
            action: action
        };
        if (params) {
            message.params = params;
        }
        const response = await runtime.sendNativeMessage('z2dlp_host', message);
        console.log('Native response:', response);
        return response;
    } catch (error) {
        console.error('Native messaging error:', error);
        throw error;
    }
}

async function handleCommand(command) {
    try {
        // Query active tab using browser.tabs API
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        if (!tabs || !tabs.length) {
            console.error('No active tab found');
            return;
        }
        
        const currentUrl = tabs[0].url;
        const currentTabId = tabs[0].id;
        const config = Object.assign(await storage.sync.get(null), await storage.local.get(null));
        if (command === 'forward-url') {
            // Quick download with default settings

            const paramsManager = await buildDownloadParams(currentUrl, config, true);
            console.log('Quick download params:', paramsManager.toArray());
            
            await sendNativeMessage('download', paramsManager.toArray());
        } 
        else if (command === 'forward-url-with-param') {
            // Advanced download with current configuration

            
            const response = await browser.tabs.sendMessage(currentTabId, {action: "showPrompt"});
            if (response && response.userInput) {
                const params = await buildDownloadParams(currentUrl, {
                    ...config,
                    outputPattern: response.userInput // Override output pattern with user input
                });
                
                console.log('Advanced download params:', params);
                await sendNativeMessage('download', params);
            }
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

// Handle browser action click
browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});
