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
const handleSaveDirectory = () => {
  const folderPath = document.getElementById("folderPath").value;
  chrome.storage.sync.set({ defaultFolder: folderPath }, () => {
    alert("Default folder saved!");
  });
}
// Save Params
document.getElementById("saveParams").addEventListener("click", () => {
  const params = document.getElementById("params").value.split("\n");
  chrome.storage.sync.set({ params }, () => {
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
  chrome.storage.sync.set({ customParams }, () => {
    alert("Custom params saved!");
  });
});

document.getElementById("saveBtn").addEventListener("click", handleSaveDirectory);
// dir picker chrome
document.getElementById("chooseDirectory") && document.getElementById("chooseDirectory").addEventListener("click", async () => {
  try {
    const directoryHandle = await window.showDirectoryPicker();
    const directoryPath = directoryHandle.name;

    // Save directory path or handle (persistent in Chrome only)
    chrome.storage.sync.set({ defaultDirectory: directoryPath }, () => {
      document.getElementById("directoryPath").innerText = `Selected: ${directoryPath}`;
      alert("Default directory saved!");
    });
  } catch (error) {
    console.error("Directory selection cancelled or failed:", error);
  }
});

// SUPPORT ALL

// if (window.showDirectoryPicker) {
//   // Use Directory Picker (Chromium)
// } else {
//   // Fallback to manual input or file picker
// }

// picker firefox
// TODO: abs path support
document.getElementById("directoryPicker").addEventListener("change", (event) => {
  const files = event.target.files;
  console.log(event);
  if (files.length > 0) {
    const directoryPath = files[0].webkitRelativePath.split("/")[0]; // Get folder name
    console.info('picked: ', directoryPath);
    chrome.storage.sync.set({ defaultDirectory: directoryPath }, () => {
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
