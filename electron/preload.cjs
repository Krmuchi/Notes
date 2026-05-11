const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notesApi", {
  load: () => ipcRenderer.invoke("notes:load"),
  save: (payload) => ipcRenderer.invoke("notes:save", payload),
  exportDoc: (payload) => ipcRenderer.invoke("notes:export-doc", payload),
  exportNotebook: (payload) => ipcRenderer.invoke("notes:export-notebook", payload),
  exportNotebookZip: (payload) => ipcRenderer.invoke("notes:export-notebook-zip", payload),
  saveImage: (payload) => ipcRenderer.invoke("notes:save-image", payload),
});