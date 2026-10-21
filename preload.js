const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('termAPI', {
  windowAction: (action) => ipcRenderer.invoke('window:action', action),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveSimulation: (item) => ipcRenderer.invoke('library:save', item),
  deleteSimulation: (id) => ipcRenderer.invoke('library:delete', id),
  fetchLocalModels: (params) => ipcRenderer.invoke('ai:fetch-models', params),
  generateAI: (params) => ipcRenderer.invoke('ai:generate', params)
});
