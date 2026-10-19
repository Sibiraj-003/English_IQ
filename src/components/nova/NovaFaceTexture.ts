import * as THREE from 'three';
import { Nova3DState, FaceParameters } from './novaAnimations';

export class NovaFaceTexture {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;

  private width = 512;
  private height = 512;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create 2D canvas context for NovaFaceTexture');
    }
    this.ctx = context;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.render({
      eyeOpenness: 1,
      eyeSurprise: 0,
      eyeHappy: 0,
      eyeThinking: 0,
      eyeFocused: 0,
      eyeLookX: 0,
      eyeLookY: 0,
      mouthOpenness: 0,
      mouthWidth: 1,
      mouthCurve: 0.2,
      glowColor: '#38BDF8',
      pupilPulse: 0.5,
    }, 'idle');
  }

  public render(params: FaceParameters, state: Nova3DState) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear transparent background
    ctx.clearRect(0, 0, w, h);

    // Color resolution based on state
    let primaryColor = '#38BDF8'; // High-tech cyan
    let glowColor = 'rgba(56, 189, 248, 0.6)';

    if (state === 'happy' || state === 'success') {
      primaryColor = '#34D399'; // Emerald
      glowColor = 'rgba(52, 211, 153, 0.6)';
    } else if (state === 'thinking') {
      primaryColor = '#FBBF24'; // Amber
      glowColor = 'rgba(251, 191, 36, 0.6)';
    } else if (state === 'listening') {
      primaryColor = '#2DD4BF'; // Teal
      glowColor = 'rgba(45, 212, 191, 0.6)';
    } else if (state === 'surprised' || state === 'excited') {
      primaryColor = '#A78BFA'; // Violet
      glowColor = 'rgba(167, 139, 250, 0.6)';
    }

    // Set glowing cyber brush
    ctx.shadowBlur = 18;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = primaryColor;

    // --- 1. EYES ---
    const eyeSpacing = 82;
    const leftEyeX = w / 2 - eyeSpacing + params.eyeLookX * 12;
    const rightEyeX = w / 2 + eyeSpacing + params.eyeLookX * 12;
    const eyeY = 195 + params.eyeLookY * 8;

    const baseEyeW = 34 * (params.eyeSurprise > 0 ? 1.25 : 1.0);
    const baseEyeH = 52 * Math.max(0.06, params.eyeOpenness) * (params.eyeSurprise > 0 ? 1.25 : 1.0);

    // Draw Left & Right Eyes
    if (state === 'happy' || state === 'success' || params.eyeHappy > 0.5) {
      // Cheerful arched eyes (^ ^)
      this.drawCurvedHappyEye(ctx, leftEyeX, eyeY - 6, baseEyeW);
      this.drawCurvedHappyEye(ctx, rightEyeX, eyeY - 6, baseEyeW);
    } else {
      // Tech capsule rounded eyes
      this.drawCapsuleEye(ctx, leftEyeX, eyeY, baseEyeW, baseEyeH, params);
      this.drawCapsuleEye(ctx, rightEyeX, eyeY, baseEyeW, baseEyeH, params);
    }

    // --- 2. MOUTH ---
    const mouthX = w / 2;
    const mouthY = 325;
    const openness = params.mouthOpenness;
    const width = params.mouthWidth;
    const curve = params.mouthCurve;

    if (openness <= 0.08) {
      // Closed mouth / subtle smile / thinking line
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const halfW = 28 * width;
      const curveOffset = curve * 14;
      ctx.moveTo(mouthX - halfW, mouthY - curveOffset * 0.3);
      ctx.quadraticCurveTo(mouthX, mouthY + curveOffset, mouthX + halfW, mouthY - curveOffset * 0.3);
      ctx.stroke();
    } else {
      // Open / Talking mouth
      const mouthW = (32 + openness * 22) * width;
      const mouthH = Math.max(12, openness * 44);

      ctx.beginPath();
      if (state === 'surprised' || params.eyeSurprise > 0.4) {
        // Round O mouth
        ctx.ellipse(mouthX, mouthY, mouthW * 0.65, mouthH * 0.9, 0, 0, Math.PI * 2);
      } else {
        // Expressive speech capsule mouth
        const r = Math.min(mouthW / 2, mouthH / 2);
        ctx.roundRect(mouthX - mouthW / 2, mouthY - mouthH / 2, mouthW, mouthH, [r]);
      }
      ctx.fill();

      // Subtle inner depth highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(mouthX, mouthY - mouthH * 0.22, mouthW * 0.3, mouthH * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flag Three.js texture for GPU re-upload
    this.texture.needsUpdate = true;
  }

  private drawCapsuleEye(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    params: FaceParameters
  ) {
    ctx.beginPath();
    const radius = Math.min(width / 2, height / 2);
    ctx.roundRect(x - width / 2, y - height / 2, width, height, [radius]);
    ctx.fill();

    // Cyber eye pupil catchlight
    if (params.eyeOpenness > 0.4) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x + width * 0.18, y - height * 0.22, Math.max(2, width * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCurvedHappyEye(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y + 6, width / 2, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();
  }

  public dispose() {
    this.texture.dispose();
  }
}
