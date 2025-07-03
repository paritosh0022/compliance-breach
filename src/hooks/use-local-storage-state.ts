// src/hooks/use-local-storage-state.ts
"use client";

import { useState, useEffect } from 'react';

function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // This effect runs once on the client after initial render to hydrate the state from localStorage.
  // This prevents a hydration mismatch.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // This effect runs whenever the state changes, but only after hydration is complete.
  // This prevents writing the initial `defaultValue` to localStorage before the stored value has been read.
  useEffect(() => {
    if (isHydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, state, isHydrated]);

  return [state, setState];
}

export default useLocalStorageState;
