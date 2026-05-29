const wordListeners = new Set();
const activeListeners = new Set();

export function emitKaraokeWord(word) {
  for (const fn of wordListeners) fn(word);
}

export function onKaraokeWord(fn) {
  wordListeners.add(fn);
  return () => wordListeners.delete(fn);
}

export function emitKaraokeActive(active) {
  for (const fn of activeListeners) fn(active);
}

export function onKaraokeActive(fn) {
  activeListeners.add(fn);
  return () => activeListeners.delete(fn);
}
