import { create } from 'zustand';

export interface UpdateInfo {
  shouldUpdate: boolean;
  availableVersionCode: number;
  currentVersionCode: number;
  currentVersionName: string;
  packageName: string;
  isImmediateAllowed: boolean;
  isFlexibleAllowed: boolean;
}

interface UpdateStoreState {
  isModalVisible: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  downloadPercent: number;
  updateInfo: UpdateInfo | null;
  showModal: (info: UpdateInfo) => void;
  hideModal: () => void;
  setDownloading: (downloading: boolean, percent?: number) => void;
  setDownloaded: (downloaded: boolean) => void;
}

export const useUpdateStore = create<UpdateStoreState>((set) => ({
  isModalVisible: false,
  isDownloading: false,
  isDownloaded: false,
  downloadPercent: 0,
  updateInfo: null,
  showModal: (info: UpdateInfo) => set({ isModalVisible: true, updateInfo: info }),
  hideModal: () => set({ isModalVisible: false }),
  setDownloading: (isDownloading: boolean, percent = 0) =>
    set({ isDownloading, downloadPercent: percent }),
  setDownloaded: (isDownloaded: boolean) =>
    set({ isDownloaded, isDownloading: false }),
}));
