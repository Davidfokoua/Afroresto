/**
 * Universal Safe Storage Utility
 * Prevents "SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document"
 * which occurs in sandboxed/cross-origin iframes, strict privacy modes, or disabled cookie environments.
 * 
 * Provides transparent memory fallback when localStorage or sessionStorage is inaccessible.
 */

const memoryLocalStorage: Record<string, string> = {};
const memorySessionStorage: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Access to localStorage is denied by browser/iframe security settings
    }
    return memoryLocalStorage[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    memoryLocalStorage[key] = value;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Access to localStorage is denied or quota exceeded; memory store already updated
    }
  },

  removeItem: (key: string): void => {
    delete memoryLocalStorage[key];
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Access to localStorage is denied
    }
  },

  clear: (): void => {
    for (const k in memoryLocalStorage) {
      delete memoryLocalStorage[k];
    }
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch {
      // Access to localStorage is denied
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        const val = window.sessionStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Access to sessionStorage is denied
    }
    return memorySessionStorage[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    memorySessionStorage[key] = value;
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Access to sessionStorage is denied
    }
  },

  removeItem: (key: string): void => {
    delete memorySessionStorage[key];
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Access to sessionStorage is denied
    }
  },

  clear: (): void => {
    for (const k in memorySessionStorage) {
      delete memorySessionStorage[k];
    }
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
      }
    } catch {
      // Access to sessionStorage is denied
    }
  }
};
