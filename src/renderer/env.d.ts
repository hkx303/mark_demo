import type { QingjiApi } from "../../electron/preload";

declare global {
  interface Window {
    qingji: QingjiApi;
  }
}

export {};
