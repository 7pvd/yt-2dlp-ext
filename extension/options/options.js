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

// Constants and utilities
const storage = browser.storage;
const runtime = browser.runtime;

// Use local storage for output directory
const localStore = storage.local;

// Page Elements
const pages = {
    config: document.getElementById('configuration-page'),
    presetManager: document.getElementById('preset-manager-page')
};

function showPage(pageId) {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    pages[pageId].classList.remove('hidden');
}

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

const DEFAULT_CONFIG = {
    outputPattern: '',
    outputDir: '',
    selectedPreset: 'best',
    customPresets: {},
    connections: 4,
    speedLimit: '',
    speedUnit: 'M',
    presetOptions: {}, // Store options for each preset
    additionalParams: [] // Store additional parameters
};

// DOM Elements
const elements = {
    outputPattern: document.getElementById('outputPattern'),
    outputDir: document.getElementById('outputDir'),
    browseDir: document.getElementById('browseDir'),
    connections: document.getElementById('connections'),
    speedLimit: document.getElementById('speedLimit'),
    speedUnit: document.getElementById('speedUnit'),
    selectedPreset: document.getElementById('selectedPreset'),
    selectedPresetOptions: document.getElementById('selectedPresetOptions'),
    presetsList: document.getElementById('presetsList'),
    addCustomPreset: document.getElementById('addCustomPreset'),
    testConnection: document.getElementById('testConnection'),
    resetConfig: document.getElementById('resetConfig'),
    saveConfig: document.getElementById('saveConfig'),
    managePresets: document.getElementById('managePresets'),
    backToConfig: document.getElementById('backToConfig'),
    additionalParams: document.getElementById('additionalParams'),
    addParam: document.getElementById('addParam'),
    browseDir: document.getElementById('browseDir'),
};

// Helper Functions
function showNotification(message, type = 'info') {
    // You can implement a more sophisticated notification system here
    alert(message);
}

const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'];
const AUTO_HIDE_TIMEOUT = 5000; // 5 seconds
function displayPresetAlert(message, type = 'info') {
    const alertDiv = document.getElementById('presetSaveStatus');
    const msgDiv = document.getElementById('presetSaveStatusText');
    let msgPrefix = '✅';
    type = NOTIFICATION_TYPES.includes(type) ? type : 'info';
    if (!alertDiv.classList.contains('hidden')) {
        alertDiv.classList.add('hidden');
        window.setTimeout(()=>displayPresetAlert(message, type), 250);
        return;
    }
    alertDiv.classList.remove('hidden');
    if (type === 'error') {
        msgPrefix = '❌';
    }
    if (type === 'warning') {
        msgPrefix = '⚠️';
    }
    msgDiv.textContent = `${msgPrefix} ${message}`;
    msgDiv.className = `alert-${type}`;
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, AUTO_HIDE_TIMEOUT);
}

async function saveToStorage(data) {
    try {
        await browser.storage.sync.set(data);
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        return false;
    }
}

async function loadFromStorage() {
    try {
        const data = await browser.storage.sync.get(DEFAULT_CONFIG);
        return { ...DEFAULT_CONFIG, ...data };
    } catch (error) {
        console.error('Loading error:', error);
        return DEFAULT_CONFIG;
    }
}

// Preset Management
function createPresetElement(id, preset, config) {
    const template = document.getElementById('preset-template');
    const element = template.content.cloneNode(true).firstElementChild;
    
    element.dataset.presetId = id;
    
    const nameElement = element.querySelector('.preset-name');
    const paramsElement = element.querySelector('.preset-params');
    const embedThumbnail = element.querySelector('.embed-thumbnail');
    const writeAllThumbnails = element.querySelector('.write-all-thumbnails');
    const addMetadata = element.querySelector('.add-metadata');
    const saveButton = element.querySelector('.save-preset');
    const deleteButton = element.querySelector('.delete-preset');
    
    nameElement.textContent = preset.name;
    paramsElement.textContent = preset.params.join(' ');
    
    // Load preset options
    const options = config.presetOptions[id] || preset.defaultOptions || {};
    embedThumbnail.checked = options.embedThumbnail || false;
    writeAllThumbnails.checked = options.writeAllThumbnails || false;
    addMetadata.checked = options.addMetadata || false;
    
    // Show/hide thumbnail options based on embed thumbnail checkbox
    embedThumbnail.addEventListener('change', (e) => {
        const allVersionsLabel = element.querySelector('.thumbnail-all-versions');
        allVersionsLabel.classList.toggle('hidden', !e.target.checked);
        checkPresetChanges(element, id, preset);
    });
    
    // Add change listeners for options
    [embedThumbnail, writeAllThumbnails, addMetadata].forEach(input => {
        input.addEventListener('change', () => checkPresetChanges(element, id, preset));
    });
    
    // Handle preset actions
    element.querySelector('.clone-preset').addEventListener('click', () => clonePreset(id));
    
    if (!preset.isBuiltin) {
        deleteButton.classList.remove('hidden');
        deleteButton.addEventListener('click', () => deletePreset(id));
    }
    
    // Save button is initially hidden, shown when changes are made
    saveButton.addEventListener('click', () => savePresetChanges(element, id));
    
    return element;
}

function checkPresetChanges(element, id, preset) {
    const embedThumbnail = element.querySelector('.embed-thumbnail').checked;
    const writeAllThumbnails = element.querySelector('.write-all-thumbnails').checked;
    const addMetadata = element.querySelector('.add-metadata').checked;
    
    const defaultOptions = preset.defaultOptions || {
        embedThumbnail: false,
        writeAllThumbnails: false,
        addMetadata: false
    };
    
    const hasChanges = 
        embedThumbnail !== defaultOptions.embedThumbnail ||
        writeAllThumbnails !== defaultOptions.writeAllThumbnails ||
        addMetadata !== defaultOptions.addMetadata;
    
    element.querySelector('.save-preset').classList.toggle('hidden', !hasChanges);
}

async function savePresetChanges(element, id) {
    const config = await loadFromStorage();
    
    const options = {
        embedThumbnail: element.querySelector('.embed-thumbnail').checked,
        writeAllThumbnails: element.querySelector('.write-all-thumbnails').checked,
        addMetadata: element.querySelector('.add-metadata').checked
    };
    
    config.presetOptions[id] = options;
    
    if (await saveToStorage(config)) {
        element.querySelector('.save-preset').classList.add('hidden');
        displayPresetAlert('Preset options saved successfully', 'success');
        updateSelectedPresetIfNeeded(id);
    }
}

function createSelectedPresetElement(id, preset, config) {
    const template = document.getElementById('selected-preset-template');
    const element = template.content.cloneNode(true).firstElementChild;
    
    const paramsElement = element.querySelector('.preset-params');
    const embedThumbnail = element.querySelector('.embed-thumbnail');
    const writeAllThumbnails = element.querySelector('.write-all-thumbnails');
    const addMetadata = element.querySelector('.add-metadata');
    
    paramsElement.textContent = preset.params.join(' ');
    
    // Load preset options
    const options = config.presetOptions[id] || preset.defaultOptions || {};
    embedThumbnail.checked = options.embedThumbnail || false;
    writeAllThumbnails.checked = options.writeAllThumbnails || false;
    addMetadata.checked = options.addMetadata || false;
    
    // Show/hide thumbnail options based on embed thumbnail checkbox
    embedThumbnail.addEventListener('change', (e) => {
        const allVersionsLabel = element.querySelector('.thumbnail-all-versions');
        allVersionsLabel.classList.toggle('hidden', !e.target.checked);
    });
    
    return element;
}

function updateSelectedPresetIfNeeded(id) {
    if (elements.selectedPreset.value === id) {
        updateSelectedPresetDisplay(id);
    }
}

async function updateSelectedPresetDisplay(id) {
    const config = await loadFromStorage();
    const preset = config.customPresets[id] || DEFAULT_PRESETS[id];
    
    if (!preset) return;
    
    elements.selectedPresetOptions.innerHTML = '';
    elements.selectedPresetOptions.appendChild(
        createSelectedPresetElement(id, preset, config)
    );
}

function populatePresetSelector(config) {
    elements.selectedPreset.innerHTML = '';
    
    // Add built-in presets
    Object.entries(DEFAULT_PRESETS).forEach(([id, preset]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = preset.name;
        elements.selectedPreset.appendChild(option);
    });
    
    // Add custom presets
    Object.entries(config.customPresets || {}).forEach(([id, preset]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = preset.name;
        elements.selectedPreset.appendChild(option);
    });
    
    // Set selected preset
    elements.selectedPreset.value = config.selectedPreset;
    updateSelectedPresetDisplay(config.selectedPreset);
}

function renderPresets() {
    elements.presetsList.innerHTML = '';
    
    loadFromStorage().then(config => {
        // Render built-in presets
        Object.entries(DEFAULT_PRESETS).forEach(([id, preset]) => {
            elements.presetsList.appendChild(createPresetElement(id, preset, config));
        });
        
        // Render custom presets
        Object.entries(config.customPresets || {}).forEach(([id, preset]) => {
            elements.presetsList.appendChild(createPresetElement(id, preset, config));
        });
    });
}

async function addCustomPreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;
    
    const format = prompt('Enter format (-f parameter):', 'best');
    if (!format) return;
    
    const additionalParams = prompt('Enter additional parameters (optional):', '');
    
    const config = await loadFromStorage();
    const id = 'custom_' + Date.now();
    
    const params = ['-f', format];
    if (additionalParams) {
        params.push(...additionalParams.split(' ').filter(p => p));
    }
    
    config.customPresets = {
        ...config.customPresets,
        [id]: {
            name,
            params,
            isBuiltin: false,
            defaultOptions: {
                embedThumbnail: false,
                writeAllThumbnails: false,
                addMetadata: false
            }
        }
    };
    
    if (await saveToStorage(config)) {
        renderPresets();
        populatePresetSelector(config);
        displayPresetAlert('Custom preset added successfully', 'info');
    }
}

async function clonePreset(id) {
    const config = await loadFromStorage();
    const preset = config.customPresets[id] || DEFAULT_PRESETS[id];
    
    if (!preset) return;
    
    const newName = prompt('Enter name for cloned preset:', `${preset.name} (Clone)`);
    if (!newName) return;
    
    const format = prompt('Enter format (-f parameter):', preset.params[preset.params.indexOf('-f') + 1] || 'best');
    if (!format) return;
    
    const params = [...preset.params];
    const fIndex = params.indexOf('-f');
    if (fIndex !== -1) {
        params[fIndex + 1] = format;
    } else {
        params.unshift('-f', format);
    }
    
    const newId = 'custom_' + Date.now();
    config.customPresets = {
        ...config.customPresets,
        [newId]: {
            name: newName,
            params,
            isBuiltin: false,
            defaultOptions: { ...preset.defaultOptions }
        }
    };
    
    if (await saveToStorage(config)) {
        renderPresets();
        populatePresetSelector(config);
        displayPresetAlert('Preset cloned successfully');
    }
}

async function deletePreset(id) {
    if (!confirm('Are you sure you want to delete this preset?')) return;
    
    const config = await loadFromStorage();
    
    if (config.customPresets[id]) {
        delete config.customPresets[id];
        
        // If the deleted preset was selected, switch to 'best'
        if (config.selectedPreset === id) {
            config.selectedPreset = 'best';
        }
        
        if (await saveToStorage(config)) {
            renderPresets();
            populatePresetSelector(config);
            displayPresetAlert('Preset deleted successfully', 'success');
        }
    }
}

// Additional Parameters Management
function createParamElement(key = '', value = '') {
    const template = document.getElementById('param-template');
    const element = template.content.cloneNode(true).firstElementChild;
    
    const keyInput = element.querySelector('.param-key');
    const valueInput = element.querySelector('.param-value');
    
    keyInput.value = key;
    valueInput.value = value;
    
    element.querySelector('.remove-param').addEventListener('click', () => {
        element.remove();
        saveConfiguration();
    });
    
    [keyInput, valueInput].forEach(input => {
        input.addEventListener('change', saveConfiguration);
    });
    
    return element;
}

function renderAdditionalParams(params) {
    elements.additionalParams.innerHTML = '';
    params.forEach(({key, value}) => {
        elements.additionalParams.appendChild(createParamElement(key, value));
    });
}

// Save output directory to local storage
async function saveOutputDirectory(path) {
    try {
        await browser.storage.local.set({ outputDir: path });
    } catch (error) {
        console.error('Failed to save output directory:', error);
        showNotification('Failed to save output directory', 'error');
    }
}

// Load output directory from local storage
async function loadOutputDirectory() {
    try {
        const result = await browser.storage.local.get({ outputDir: '' });
        return result.outputDir;
    } catch (error) {
        console.error('Failed to load output directory:', error);
        return '';
    }
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

async function testHostConnection() {
    try {
        const response = await sendNativeMessage('ping');
        return response && response.status === 'ok';
    } catch (error) {
        console.error('Host connection test failed:', error);
        return false;
    }
}

async function handleBrowse() {
    const browseBtn = document.getElementById('browseDir');
    const buttonText = browseBtn.querySelector('.button-text');
    const spinner = browseBtn.querySelector('.spinner');

    try {
        // Test host connection first
        const isHostConnected = await testHostConnection();
        if (!isHostConnected) {
            alert('Failed to initialize directory picker.');
            updateUIForHostStatus(false);
            return;
        }

        // Show loading state
        browseBtn.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');

        const response = await sendNativeMessage('browse_directory');
        if (response && response.status === 'ok' && response.path) {
            document.getElementById('outputDir').value = response.path;
            await saveOutputDirectory(response.path);
        }
    } catch (error) {
        console.error('Failed to browse directory:', error);
        updateUIForHostStatus(false);
    } finally {
        // Restore button state
        browseBtn.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Save and Reset Functions
async function saveConfiguration() {
    const config = await loadFromStorage();
    
    // Save synced settings
    config.outputPattern = elements.outputPattern.value;
    config.connections = parseInt(elements.connections.value, 10);
    config.speedLimit = elements.speedLimit.value;
    config.speedUnit = elements.speedUnit.value;
    config.selectedPreset = elements.selectedPreset.value;
    
    // Collect and save additional parameters
    const additionalParams = Array.from(elements.additionalParams.children).map(elem => ({
        key: elem.querySelector('.param-key').value,
        value: elem.querySelector('.param-value').value
    })).filter(param => param.key || param.value);
    config.additionalParams = additionalParams;
    
    // Save output directory separately to local storage
    debugger
    await saveOutputDirectory(elements.outputDir.value);
    
    if (await saveToStorage(config)) {
        showNotification('Configuration saved successfully', 'success');
    } else {
        showNotification('Failed to save configuration', 'error');
    }
}

async function resetConfiguration() {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;
    
    if (await saveToStorage(DEFAULT_CONFIG)) {
        await loadConfiguration();
        showNotification('Configuration reset to default', 'success');
    } else {
        showNotification('Failed to reset configuration', 'error');
    }
}

// Initial Setup
async function loadConfiguration() {
    const config = await loadFromStorage();
    const outputDir = await loadOutputDirectory();
    
    elements.outputPattern.value = config.outputPattern;
    elements.outputDir.value = outputDir;
    elements.connections.value = config.connections;
    elements.speedLimit.value = config.speedLimit;
    elements.speedUnit.value = config.speedUnit;
    
    renderAdditionalParams(config.additionalParams || []);
    populatePresetSelector(config);
    renderPresets();
}

// Event Listeners
function setupEventListeners() {
    elements.addCustomPreset.addEventListener('click', addCustomPreset);
    elements.testConnection.addEventListener('click', async () => {
        const isHostConnected = await testHostConnection();
        updateUIForHostStatus(isHostConnected);
        
        if (isHostConnected) {
            showNotification('Native host connection successful!', 'success');
        } else {
            showNotification('Native host connection failed!', 'error');
        }
    });
    elements.resetConfig.addEventListener('click', resetConfiguration);
    elements.saveConfig.addEventListener('click', saveConfiguration);
    elements.selectedPreset.addEventListener('change', (e) => updateSelectedPresetDisplay(e.target.value));
    
    // Page navigation
    elements.managePresets.addEventListener('click', () => showPage('presetManager'));
    elements.backToConfig.addEventListener('click', () => showPage('config'));
    
    // Additional parameters
    elements.addParam.addEventListener('click', () => {
        elements.additionalParams.appendChild(createParamElement());
    });
    
    // Add browse button handler
    elements.browseDir.addEventListener('click', handleBrowse);

    // Manual directory input
    elements.outputDir.addEventListener('change', async () => {
        await saveOutputDirectory(elements.outputDir.value);
    });
}

function updateUIForHostStatus(isHostConnected) {
    const browseBtn = document.getElementById('browseDir');
    const outputDirInput = document.getElementById('outputDir');
    const existingAlert = document.querySelector('.host-directory-alert');
    
    if (!isHostConnected) {
        browseBtn.style.display = 'none';
        
        // Only show alert if it doesn't exist
        if (!existingAlert) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info host-directory-alert';
            alert.textContent = 'If left empty, downloads will be saved in the host launcher directory';
            outputDirInput.parentNode.insertBefore(alert, outputDirInput);
        }
    } else if (existingAlert) {
        // Remove alert if host is connected
        existingAlert.remove();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    setupEventListeners();
    showPage('config');
    

}); 
