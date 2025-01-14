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

const storage = (typeof browser !== 'undefined' ? browser.storage : chrome.storage);

//BEGIN shortcut setting
const commandName = 'toggle-feature';

/**
 * Update the UI: set the value of the shortcut textbox.
 */
async function updateUI() {
  let commands = await browser.commands.getAll();
  for (let command of commands) {
    if (command.name === commandName) {
      document.querySelector('#shortcut').value = command.shortcut;
    }
  }
}

/**
 * Update the shortcut based on the value in the textbox.
 */
async function updateShortcut() {
  await browser.commands.update({
    name: commandName,
    shortcut: document.querySelector('#shortcut').value
  });
}

/**
 * Reset the shortcut and update the textbox.
 */
async function resetShortcut() {
  await browser.commands.reset(commandName);
  updateUI();
}

/**
 * Update the UI when the page loads.
 */
document.addEventListener('DOMContentLoaded', updateUI);

/**
 * Handle update and reset button clicks
 */
document.querySelector('#update').addEventListener('click', updateShortcut)
document.querySelector('#reset').addEventListener('click', resetShortcut)
//END shortcut setting

const handleSaveDirectory = () => {
  const folderPath = document.getElementById("folderPath").value;
  storage.sync.set({ defaultFolder: folderPath }, () => {
    alert("Default folder saved!");
  });
}

// Save Params
document.getElementById("saveParams").addEventListener("click", () => {
  const params = document.getElementById("params").value.split("\n");
  storage.sync.set({ params }, () => {
    alert("Params saved!");
  });
});

// Add Custom Param
document.getElementById("addParam").addEventListener("click", () => {
  const div = document.createElement("div");
  div.innerHTML = `
    <input type="text" placeholder="Key" />
    <input type="text" placeholder="Value" />
  `;
  document.getElementById("customParams").appendChild(div);
});

// Save Custom Params
document.getElementById("saveCustomParams").addEventListener("click", () => {
  const inputs = document.querySelectorAll("#customParams input");
  const customParams = {};
  for (let i = 0; i < inputs.length; i += 2) {
    const key = inputs[i].value;
    const value = inputs[i + 1].value;
    if (key) customParams[key] = value;
  }
  storage.sync.set({ customParams }, () => {
    alert("Custom params saved!");
  });
});

document.getElementById("saveBtn").addEventListener("click", handleSaveDirectory);

// Directory picker for Firefox
document.getElementById("directoryPicker").addEventListener("change", (event) => {
  const files = event.target.files;
  console.log(event);
  if (files.length > 0) {
    const directoryPath = files[0].webkitRelativePath.split("/")[0]; // Get folder name
    console.info('picked: ', directoryPath);
    storage.sync.set({ defaultDirectory: directoryPath }, () => {
      document.getElementById("directoryPath").innerText = `Selected: ${directoryPath}`;
      alert("Default directory saved!");
    });
  } else {
    console.log("No directory selected");
  }
});

function saveOptions() {
  const urlPrefix = document.getElementById('urlPrefix').value;
  storage.sync.set({
    urlPrefix: urlPrefix
  }).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

function restoreOptions() {
  storage.sync.get({
    urlPrefix: 'ext+ytdlp://call'
  }).then(items => {
    document.getElementById('urlPrefix').value = items.urlPrefix;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions); 
