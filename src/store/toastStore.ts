import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // milliseconds
}

type ToastListener = (toast: ToastConfig | null) => void;

class ToastManager {
  private static instance: ToastManager;
  private currentToast: ToastConfig | null = null;
  private listeners: Set<ToastListener> = new Set();
  private timer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public show(config: ToastConfig) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const toast: ToastConfig = {
      ...config,
      id: config.id || Math.random().toString(36).substring(7),
      duration: config.duration || 3500,
    };

    this.currentToast = toast;
    this.notify();

    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      this.timer = setTimeout(() => {
        this.hide();
      }, toast.duration);
    }
  }

  public hide() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentToast = null;
    this.notify();
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.currentToast);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentToast));
  }
}

export const toastManager = ToastManager.getInstance();

/**
 * Global helper to trigger a toast from anywhere in the app (even outside React components)
 */
export const showToast = (config: ToastConfig) => {
  toastManager.show(config);
};

export const hideToast = () => {
  toastManager.hide();
};

/**
 * React Hook to observe the active toast
 */
export const useToast = () => {
  const [activeToast, setActiveToast] = useState<ToastConfig | null>(null);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((toast) => {
      setActiveToast(toast);
    });
    return unsubscribe;
  }, []);

  return {
    activeToast,
    showToast,
    hideToast,
  };
};
