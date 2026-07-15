const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("qingji", {
  loadAppData: () => ipcRenderer.invoke("app-data:load"),
  saveAppData: (data) => ipcRenderer.invoke("app-data:save", data),
});
