import { useSyncExternalStore } from 'react';

/** True while the viewport is at most `px` wide (charts use it to shrink their label columns on phones). */
export function useNarrow(px = 600) {
  const query = `(max-width: ${px}px)`;
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
  );
}
