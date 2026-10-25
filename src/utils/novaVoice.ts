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

/**
 * Procedural Web Audio cute robot sound effects
 * Synthesizes adorable, cheerful 8-bit / robotic melodic chimes, chirps, and boops
 */
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

export const playCuteSound = (
  type: 'chirp' | 'chime' | 'boop' | 'pin' | 'unpin' | 'giggle' = 'chirp'
): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.08, now); // Gentle, pleasant cute volume
    masterGain.connect(ctx.destination);

    if (type === 'chirp') {
      // Cheerful two-tone robotic chirp (C6 -> G6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'chime' || type === 'giggle') {
      // Sweet 3-note robotic arpeggio (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.055);
        gain.gain.setValueAtTime(0.07, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.21);
      });
    } else if (type === 'boop') {
      // Playful bouncy boop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'pin') {
      // High-pitched lock chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'unpin') {
      // Playful release tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  } catch {
    // Graceful silent fallback
  }
};
