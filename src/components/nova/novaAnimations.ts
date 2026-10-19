/**
 * NOVA 3D Avatar - Procedural Animations & Facial State Definitions
 * Handles natural blinking, smooth mouth interpolation, state transitions, and body kinematics.
 */

export type Nova3DState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'surprised'
  | 'confused'
  | 'success'
  | 'excited';

export type MouthShape =
  | 'CLOSED'
  | 'SMALL_OPEN'
  | 'MEDIUM_OPEN'
  | 'WIDE_OPEN'
  | 'SMILE'
  | 'SURPRISED';

export interface FaceParameters {
  eyeOpenness: number; // 0 (closed/blink) to 1 (full open)
  eyeSurprise: number; // 0 to 1
  eyeHappy: number; // 0 to 1
  eyeThinking: number; // 0 to 1
  eyeFocused: number; // 0 to 1
  eyeLookX: number; // -1 (left) to 1 (right)
  eyeLookY: number; // -1 (down) to 1 (up)
  mouthOpenness: number; // 0 (closed) to 1 (wide)
  mouthWidth: number; // 0.6 to 1.4
  mouthCurve: number; // -1 (frown) to 0 (flat) to 1 (smile)
  glowColor: string; // Hex color for eyes/mouth
  pupilPulse: number; // Glow pulse 0 to 1
}

// Check for prefers-reduced-motion
export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Procedural Blink Controller
export class BlinkController {
  private blinkProgress: number = 0; // 0 = not blinking, 1 = peak blink (closed)
  private isBlinking: boolean = false;
  private nextBlinkTime: number = 0;
  private blinkDuration: number = 0.16; // 160ms natural human/bot blink

  constructor() {
    this.scheduleNextBlink(1.5);
  }

  private scheduleNextBlink(delay?: number) {
    // Natural random blink interval between 2.8s and 5.2s
    const randomInterval = delay !== undefined ? delay : 2.8 + Math.random() * 2.4;
    this.nextBlinkTime = performance.now() / 1000 + randomInterval;
  }

  public update(delta: number): number {
    const now = performance.now() / 1000;

    if (!this.isBlinking && now >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta / this.blinkDuration;
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.scheduleNextBlink();
      }
      // Symmetric triangle wave: 0 -> 1 -> 0
      const phase = this.blinkProgress * Math.PI;
      return 1 - Math.sin(phase); // 1 at open, 0 at closed
    }

    return 1.0; // fully open
  }
}

// Procedural Speech / Phoneme Mouth Controller
export class SpeechMouthController {
  private currentOpenness: number = 0;
  private targetOpenness: number = 0;
  private targetWidth: number = 1.0;
  private currentWidth: number = 1.0;
  private targetCurve: number = 0.2;
  private currentCurve: number = 0.2;
  private syllableTimer: number = 0;
  private currentShape: MouthShape = 'CLOSED';

  // Cadence timing generator for realistic syllables
  public update(delta: number, isSpeaking: boolean, state: Nova3DState): {
    openness: number;
    width: number;
    curve: number;
    shape: MouthShape;
  } {
    if (!isSpeaking && state !== 'speaking') {
      // Transition smoothly back to state-based mouth
      switch (state) {
        case 'happy':
        case 'success':
        case 'excited':
          this.targetOpenness = 0.15;
          this.targetWidth = 1.25;
          this.targetCurve = 0.85; // Wide smile
          this.currentShape = 'SMILE';
          break;
        case 'surprised':
          this.targetOpenness = 0.85;
          this.targetWidth = 0.85;
          this.targetCurve = 0.0;
          this.currentShape = 'SURPRISED';
          break;
        case 'thinking':
          this.targetOpenness = 0.05;
          this.targetWidth = 0.9;
          this.targetCurve = -0.1;
          this.currentShape = 'CLOSED';
          break;
        case 'confused':
          this.targetOpenness = 0.1;
          this.targetWidth = 0.95;
          this.targetCurve = -0.2;
          this.currentShape = 'CLOSED';
          break;
        default:
          this.targetOpenness = 0.0;
          this.targetWidth = 1.0;
          this.targetCurve = 0.25; // Gentle subtle smile
          this.currentShape = 'CLOSED';
      }
    } else {
      // REAL-TIME SPEAKING: Procedural syllable generation with natural phoneme pacing
      this.syllableTimer -= delta;
      if (this.syllableTimer <= 0) {
        const pattern = Math.random();
        if (pattern < 0.22) {
          // Vowel A/O - Wide Open
          this.targetOpenness = 0.75 + Math.random() * 0.25;
          this.targetWidth = 1.1 + Math.random() * 0.2;
          this.targetCurve = 0.3;
          this.currentShape = 'WIDE_OPEN';
          this.syllableTimer = 0.12 + Math.random() * 0.08;
        } else if (pattern < 0.55) {
          // Vowel E/I - Medium Open / Spread
          this.targetOpenness = 0.45 + Math.random() * 0.25;
          this.targetWidth = 1.25 + Math.random() * 0.15;
          this.targetCurve = 0.4;
          this.currentShape = 'MEDIUM_OPEN';
          this.syllableTimer = 0.10 + Math.random() * 0.06;
        } else if (pattern < 0.82) {
          // Consonant / Low Vowel - Small Open
          this.targetOpenness = 0.20 + Math.random() * 0.20;
          this.targetWidth = 0.95 + Math.random() * 0.15;
          this.targetCurve = 0.2;
          this.currentShape = 'SMALL_OPEN';
          this.syllableTimer = 0.08 + Math.random() * 0.05;
        } else {
          // Bilabial Pause (M, B, P or micro-pause between words)
          this.targetOpenness = 0.02;
          this.targetWidth = 0.9;
          this.targetCurve = 0.25;
          this.currentShape = 'CLOSED';
          this.syllableTimer = 0.06 + Math.random() * 0.05;
        }
      }
    }

    // Smooth cubic interpolation (avoids jerky snapping)
    const lerpSpeed = isSpeaking ? 16.0 : 8.0;
    this.currentOpenness += (this.targetOpenness - this.currentOpenness) * Math.min(1.0, delta * lerpSpeed);
    this.currentWidth += (this.targetWidth - this.currentWidth) * Math.min(1.0, delta * lerpSpeed);
    this.currentCurve += (this.targetCurve - this.currentCurve) * Math.min(1.0, delta * lerpSpeed);

    return {
      openness: Math.max(0, Math.min(1, this.currentOpenness)),
      width: Math.max(0.6, Math.min(1.5, this.currentWidth)),
      curve: Math.max(-1, Math.min(1, this.currentCurve)),
      shape: this.currentShape,
    };
  }
}
