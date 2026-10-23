/**
 * NOVA AI Unified Voice Engine
 * Ensures 100% voice parity (identical natural female voice, pitch, rate, and emoji stripping)
 * across both the Live Voice tutor (AiTeacher) and the 3D Floating Assistant (NovaFloatingAssistant).
 */

export interface NovaVoiceOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

/**
 * Strips emojis, markdown syntax, and weird characters so TTS doesn't read
 * out "glowing star", "backtick", or raw URLs aloud.
 */
export const cleanSpeechText = (rawText: string): string => {
  if (!rawText) return '';
  return rawText
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{200D}\u{20E3}]/gu, '')
    .replace(/[*#_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+([.,!?:;])/g, (_m, p) => p)
    .replace(/\n\n+/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/[^\S\r\n]{2,}/g, ' ')
    .trim();
};

let cachedFemaleVoice: SpeechSynthesisVoice | null = null;

/**
 * Discovers and caches the highest quality natural female voice installed in the browser.
 * Prioritizes Microsoft Jenny/Aria Natural, Samantha, Google US English, and Zira.
 */
export const getPreferredFemaleVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  if (cachedFemaleVoice) return cachedFemaleVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 1. High-fidelity natural female English voices
  const best =
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Jenny') ||
          v.name.includes('Aria') ||
          (v.name.includes('Natural') && (v.name.includes('Female') || v.name.includes('Jenny') || v.name.includes('Aria'))) ||
          v.name.includes('Samantha') ||
          v.name.includes('Google US English') ||
          v.name.includes('Zira') ||
          v.name.includes('Karen') ||
          v.name.includes('Victoria') ||
          v.name.toLowerCase().includes('female'))
    ) ||
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) ||
    voices.find((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')) ||
    voices[0];

  if (best) {
    cachedFemaleVoice = best;
  }
  return best;
};

// Auto-refresh when system voices load asynchronously in Chromium/WebKit
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedFemaleVoice = null;
    getPreferredFemaleVoice();
  };
}

/**
 * Universal speech player using the standard live female voice
 */
export const speakWithNovaVoice = (
  text: string,
  options: NovaVoiceOptions = {}
): SpeechSynthesisUtterance | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  try {
    window.speechSynthesis.cancel();

    const clean = cleanSpeechText(text);
    if (!clean) return null;

    const utterance = new SpeechSynthesisUtterance(clean);
    // Standard live voice settings: pitch 1.05 and rate 1.0 (friendly, crystal clear female cadence)
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.05;

    const voice = getPreferredFemaleVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      options.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.warn('Nova speech synthesis error:', err);
    options.onError?.(err);
    return null;
  }
};

/**
 * Cancel any ongoing speech immediately
 */
export const stopNovaSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if speech is currently playing
 */
export const isNovaSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

/**
 * Returns all available voices
 */
export const getAllAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
};
