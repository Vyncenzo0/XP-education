// A sandboxed iframe or private browsing tab may throw DOMException: SecurityError
// when attempting to interact with localStorage. This helper wraps all storage operations
// in try-catch blocks and falls back to a temporary, fast in-memory store.

const memoryStore: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    if (hasStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("Storage read failed, using memory fallback:", e);
      }
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  },

  setItem(key: string, value: string): void {
    if (hasStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn("Storage write failed, using memory fallback:", e);
      }
    }
    memoryStore[key] = value;
  },

  removeItem(key: string): void {
    if (hasStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn("Storage deletion failed, using memory fallback:", e);
      }
    }
    delete memoryStore[key];
  },

  clearMatching(predicate: (key: string) => boolean): void {
    if (hasStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && predicate(key)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      } catch (e) {
        console.warn("Storage selective clear failed:", e);
      }
    }
    
    // Always clean our internal memory store too
    Object.keys(memoryStore).forEach((key) => {
      if (predicate(key)) {
        delete memoryStore[key];
      }
    });
  },

  getKeys(): string[] {
    if (hasStorage) {
      try {
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      } catch (e) {
        console.warn("Failed retrieving storage keys, using memory fallback:", e);
      }
    }
    return Object.keys(memoryStore);
  }
};
