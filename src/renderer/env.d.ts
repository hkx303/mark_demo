import type { AppData } from "../shared/notes";

interface QingjiApi {
  loadAppData: () => Promise<AppData>;
  saveAppData: (data: AppData) => Promise<AppData>;
}

declare global {
  interface Window {
    qingji?: QingjiApi;
  }
}

export {};
