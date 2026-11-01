import { useEffect, useState } from 'react';

// localStorage can be unavailable (private windows, blocked storage), so every
// access is guarded and the app still works for the session without it.
export default function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep in-memory state only */
    }
  }, [key, value]);

  return [value, setValue];
}
