import { contextBridge, ipcRenderer } from "electron";
import { AppData } from "../src/shared/notes.js";

const api = {
  loadAppData: (): Promise<AppData> => ipcRenderer.invoke("app-data:load"),
  saveAppData: (data: AppData): Promise<AppData> => ipcRenderer.invoke("app-data:save", data),
};

contextBridge.exposeInMainWorld("qingji", api);

export type QingjiApi = typeof api;
