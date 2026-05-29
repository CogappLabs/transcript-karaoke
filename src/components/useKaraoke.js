import { useEffect } from 'react';

import { emitKaraokeActive, emitKaraokeWord } from './karaokeState';

/** Build a flat list of speakable words with their OCR bounding boxes */
function buildWordList(pageTexts) {
  const words = [];
  if (!pageTexts) return words;
  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex++) {
    const page = pageTexts[pageIndex];
    if (!page?.lines) continue;
    for (const line of page.lines) {
      if (line.spans) {
        for (const span of line.spans) {
          if (span.isExtra) continue;
          const text = span.text.replace(/\n$/, '').trim();
          if (!text) continue;
          words.push({ text, pageIndex, x: span.x, y: span.y, width: span.width, height: span.height });
        }
      } else if (line.text) {
        const text = line.text.replace(/\n$/, '').trim();
        if (!text) continue;
        words.push({ text, pageIndex, x: line.x, y: line.y, width: line.width, height: line.height });
      }
    }
  }
  return words;
}

export default function useKaraoke(active, pageTexts) {
  useEffect(() => {
    emitKaraokeActive(active);

    if (!active) {
      window.speechSynthesis.cancel();
      emitKaraokeWord(null);
      return;
    }

    const words = buildWordList(pageTexts);
    if (!words.length) return;

    // Pre-compute the character offset at which each word starts in the utterance string
    let offset = 0;
    const wordOffsets = words.map((w) => {
      const start = offset;
      offset += w.text.length + 1; // +1 for the joining space
      return start;
    });

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(words.map((w) => w.text).join(' '));
    utterance.lang = 'de-DE';
    const germanVoice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;

    utterance.onboundary = (event) => {
      if (event.name !== 'word') return;
      // Find the last word whose start offset is ≤ the current char position
      let idx = -1;
      for (let i = 0; i < wordOffsets.length; i++) {
        if (wordOffsets[i] <= event.charIndex) idx = i;
        else break;
      }
      if (idx >= 0) emitKaraokeWord(words[idx]);
    };

    utterance.onend = () => emitKaraokeWord(null);
    utterance.onerror = () => emitKaraokeWord(null);

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      emitKaraokeWord(null);
    };
  }, [active, pageTexts]);
}
