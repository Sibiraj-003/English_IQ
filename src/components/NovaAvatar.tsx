import React, { useEffect, useRef, useState } from "react";
import "./NovaAvatar.css";
import { NovaAvatarExpression } from "../types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NovaState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "walking"
  | "running"
  | "excited"
  | "confused"
  | "success";

export type NovaVoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface NovaAvatarProps {
  /** Base animation state. */
  state?: NovaState;
  size?: "xs" | "compact" | "sm" | "md" | "lg" | "xl";
  /** Connect to TTS state. When true it overrides `state` with "speaking". */
  speaking?: boolean;
  /** Connect to microphone state. Overrides `state` with "listening" (speaking wins). */
  listening?: boolean;
  showStatus?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;

  /* Backward-compatibility props */
  expression?: NovaAvatarExpression;
  voiceState?: NovaVoiceState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  showLabel?: boolean;
}

type MouthShape =
  | "closed"
  | "small"
  | "open"
  | "wide"
  | "smile"
  | "grin"
  | "wavy"
  | "o";

type SpeakShape = "closed" | "small" | "open" | "wide";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_LABEL: Record<NovaState, string> = {
  idle: "IDLE",
  listening: "LISTENING",
  thinking: "THINKING",
  speaking: "SPEAKING",
  happy: "HAPPY",
  walking: "WALKING",
  running: "RUNNING",
  excited: "EXCITED",
  confused: "CONFUSED",
  success: "SUCCESS",
};

type EyeMode = "normal" | "happy" | "listening" | "thinking" | "excited" | "confused";

const EYE_MODE: Record<NovaState, EyeMode> = {
  idle: "normal",
  listening: "listening",
  thinking: "thinking",
  speaking: "normal",
  happy: "happy",
  walking: "normal",
  running: "normal",
  excited: "excited",
  confused: "confused",
  success: "happy",
};

/** Natural-looking syllable flow: closed -> small -> open -> wide ... */
const SPEAK_NEXT: Record<SpeakShape, SpeakShape[]> = {
  closed: ["small", "open", "small"],
  small: ["open", "wide", "closed", "open"],
  open: ["wide", "small", "closed", "small"],
  wide: ["open", "small", "small"],
};

const MOUTH_SHAPES: MouthShape[] = [
  "closed",
  "small",
  "open",
  "wide",
  "smile",
  "grin",
  "wavy",
  "o",
];

const SPARKS = [
  { dx: -120, dy: -70, delay: 0 },
  { dx: -70, dy: -130, delay: 0.15 },
  { dx: 0, dy: -150, delay: 0.3 },
  { dx: 80, dy: -125, delay: 0.1 },
  { dx: 130, dy: -60, delay: 0.25 },
  { dx: -140, dy: 10, delay: 0.4 },
  { dx: 140, dy: 20, delay: 0.05 },
];

const STAR = "M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z";

let novaUid = 0;

function restingMouth(state: NovaState, idleAlt: boolean): MouthShape {
  switch (state) {
    case "listening":
      return "closed";
    case "thinking":
      return "o";
    case "happy":
    case "excited":
    case "success":
    case "running":
      return "grin";
    case "confused":
      return "wavy";
    case "idle":
      return idleAlt ? "closed" : "smile";
    default:
      return "smile";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NovaAvatar({
  state,
  size = "md",
  speaking,
  listening,
  showStatus,
  interactive = false,
  onClick,
  className,
  expression,
  voiceState,
  isSpeaking,
  isThinking,
  showLabel,
}: NovaAvatarProps) {
  const [uid] = useState(() => ++novaUid);
  const id = `nova-${uid}`;

  const [poked, setPoked] = useState(false);
  const pokeTimer = useRef<number | undefined>(undefined);

  // Resolve effective state with support for both modern props and legacy props
  const effectiveSpeaking = speaking || isSpeaking || voiceState === "speaking";
  const effectiveListening = listening || voiceState === "listening";
  const effectiveThinking = isThinking || voiceState === "thinking";

  let computedState: NovaState = state || "idle";
  if (effectiveSpeaking) {
    computedState = "speaking";
  } else if (effectiveListening) {
    computedState = "listening";
  } else if (effectiveThinking) {
    computedState = "thinking";
  } else if (expression) {
    switch (expression) {
      case "celebrating":
        computedState = "success";
        break;
      case "encouraging":
        computedState = "happy";
        break;
      case "concerned":
        computedState = "confused";
        break;
      case "greeting":
        computedState = "happy";
        break;
      case "thinking":
        computedState = "thinking";
        break;
      default:
        computedState = state || "idle";
    }
  }

  const effectiveShowStatus = showStatus !== undefined ? showStatus : showLabel !== undefined ? showLabel : true;
  const current: NovaState = poked && computedState === "idle" ? "happy" : computedState;

  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [speakMouth, setSpeakMouth] = useState<SpeakShape>("closed");
  const [idleAlt, setIdleAlt] = useState(false);

  /* ---------- blinking (works in every state) ---------- */
  useEffect(() => {
    let alive = true;
    let t1 = 0;
    let t2 = 0;
    const schedule = (delay: number) => {
      t1 = window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        t2 = window.setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          schedule(Math.random() < 0.2 ? 160 : 1800 + Math.random() * 3400);
        }, 130);
      }, delay);
    };
    schedule(1200 + Math.random() * 1500);
    return () => {
      alive = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  /* ---------- eye gaze ---------- */
  useEffect(() => {
    let alive = true;
    let t = 0;
    let flip = false;
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const step = () => {
      if (!alive) return;
      let next = { x: 0, y: 0 };
      let delay = 2000;
      switch (current) {
        case "thinking":
          flip = !flip;
          next = { x: flip ? 1 : -0.8, y: -1 };
          delay = 950;
          break;
        case "confused":
          flip = !flip;
          next = { x: flip ? 0.9 : -0.9, y: -0.3 };
          delay = 750;
          break;
        case "listening":
          next = { x: (Math.random() - 0.5) * 0.3, y: 0.05 };
          delay = 1500;
          break;
        case "speaking":
          next = { x: (Math.random() - 0.5) * 0.9, y: (Math.random() - 0.4) * 0.6 };
          delay = 700 + Math.random() * 700;
          break;
        case "walking":
        case "running":
          next = { x: 0.8, y: 0 };
          delay = 1200;
          break;
        case "happy":
        case "excited":
        case "success":
          next = { x: 0, y: -0.2 };
          delay = 1500;
          break;
        default:
          next = pick([
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0.1 },
            { x: 0.6, y: -0.6 },
            { x: -0.7, y: 0.4 },
            { x: 0, y: 0 },
          ]);
          delay = 1500 + Math.random() * 2200;
      }
      setLook(next);
      t = window.setTimeout(step, delay);
    };
    step();
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [current]);

  /* ---------- speaking mouth (cycles shapes continuously) ---------- */
  useEffect(() => {
    if (current !== "speaking") return;
    let alive = true;
    let t = 0;
    let prev: SpeakShape = "closed";
    const step = () => {
      if (!alive) return;
      let delay = 80 + Math.random() * 100;
      let next: SpeakShape;
      if (Math.random() < 0.08) {
        // tiny pause, like a breath between phrases
        next = "closed";
        delay = 230;
      } else {
        const opts = SPEAK_NEXT[prev];
        next = opts[Math.floor(Math.random() * opts.length)];
      }
      prev = next;
      setSpeakMouth(next);
      t = window.setTimeout(step, delay);
    };
    step();
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [current]);

  /* ---------- small idle expression change ---------- */
  useEffect(() => {
    if (current !== "idle") return;
    let alive = true;
    let t = 0;
    const loop = (alt: boolean) => {
      t = window.setTimeout(
        () => {
          if (!alive) return;
          setIdleAlt(!alt);
          loop(!alt);
        },
        alt ? 1400 : 5500 + Math.random() * 4000,
      );
    };
    loop(false);
    return () => {
      alive = false;
      window.clearTimeout(t);
      setIdleAlt(false);
    };
  }, [current]);

  useEffect(() => () => window.clearTimeout(pokeTimer.current), []);

  const mouth: MouthShape =
    current === "speaking" ? speakMouth : restingMouth(current, idleAlt);

  const locomotion = current === "walking" || current === "running";
  const eyeMode = EYE_MODE[current];

  const handleClick = () => {
    if (!interactive) return;
    setPoked(true);
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPoked(false), 1400);
    onClick?.();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const rootStyle = {
    "--look-x": look.x,
    "--look-y": look.y,
  } as React.CSSProperties;

  const normalizedSize = size;

  const rootClass = [
    "nova",
    `nova--${normalizedSize}`,
    interactive ? "nova--interactive" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      data-state={current}
      data-eyes={eyeMode}
      data-blink={blink && eyeMode !== "happy" ? "true" : "false"}
      style={rootStyle}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`NOVA AI learning companion, ${STATUS_LABEL[current].toLowerCase()}`}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKey : undefined}
    >
      <svg
        className="nova-svg"
        viewBox="0 -34 400 518"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${id}-head`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f2ff" />
            <stop offset="0.55" stopColor="#dcd8f4" />
            <stop offset="1" stopColor="#bdb6e8" />
          </linearGradient>
          <linearGradient id={`${id}-hood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34346a" />
            <stop offset="0.5" stopColor="#222247" />
            <stop offset="1" stopColor="#1a1a38" />
          </linearGradient>
          <radialGradient id={`${id}-eye`} cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#8a79f2" />
            <stop offset="1" stopColor="#4a3bbb" />
          </radialGradient>
          <radialGradient id={`${id}-aura`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8f9bff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#8f9bff" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          {/* Fades the hoodie out at the bottom (bust view); legs appear when walking/running. */}
          <linearGradient
            id={`${id}-fadeGrad`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="398"
            x2="0"
            y2="434"
          >
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask
            id={`${id}-fade`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="400"
            height="480"
          >
            <rect x="0" y="0" width="400" height="480" fill={`url(#${id}-fadeGrad)`} />
            <rect className="nova-mask-full" x="0" y="380" width="400" height="100" fill="#fff" />
          </mask>
        </defs>

        {/* ---------------- ambient effects (behind) ---------------- */}
        <g className="nova-effects">
          <circle className="nova-aura" cx="200" cy="170" r="165" fill={`url(#${id}-aura)`} />

          <g className="nova-burst" stroke="#ffd84d" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M22 104 L44 120" />
            <path d="M12 140 L38 142" />
            <path d="M24 176 L44 164" />
          </g>

          <g transform="translate(338 104)"><path className="nova-twinkle t1" d="M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6Z" fill="#aab4ff" /></g>
          <g transform="translate(40 66)"><path className="nova-twinkle t2" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill="#aab4ff" /></g>
          <g transform="translate(46 268)"><path className="nova-twinkle t3" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="#aab4ff" /></g>
          <g transform="translate(356 252)"><path className="nova-twinkle t4" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="#aab4ff" /></g>

          {/* thinking dots */}
          <g className="nova-think-dots" fill="#7d8cff" stroke="#12122e" strokeWidth="2.5">
            <circle className="d1" cx="334" cy="78" r="7" />
            <circle className="d2" cx="354" cy="58" r="9" />
            <circle className="d3" cx="378" cy="34" r="11" />
          </g>

          {/* confused mark */}
          <text
            className="nova-question"
            x="334"
            y="92"
            fontFamily="'Space Grotesk','Inter',system-ui,sans-serif"
            fontWeight="800"
            fontSize="54"
            fill="#7d8cff"
            stroke="#12122e"
            strokeWidth="2.5"
            paintOrder="stroke"
          >
            ?
          </text>
        </g>

        {/* ---------------- character ---------------- */}
        <g className="nova-travel">
        <g className="nova-character">
          <ellipse className="nova-shadow" cx="200" cy="476" rx="80" ry="5" fill="#12122e" />

          {/* body (hoodie + legs), fades out at the bottom unless walking/running */}
          <g className="nova-bodywrap" mask={`url(#${id}-fade)`}>
            {/* legs */}
            <g className="nova-legs">
              <g className="nova-leg nova-leg-l">
                <rect x="156" y="418" width="34" height="46" rx="12" fill="#25254b" stroke="#12122e" strokeWidth="3" />
                <rect x="148" y="456" width="50" height="19" rx="9" fill="#e6e3fa" stroke="#4e46a0" strokeWidth="3" />
              </g>
              <g className="nova-leg nova-leg-r">
                <rect x="210" y="418" width="34" height="46" rx="12" fill="#25254b" stroke="#12122e" strokeWidth="3" />
                <rect x="202" y="456" width="50" height="19" rx="9" fill="#e6e3fa" stroke="#4e46a0" strokeWidth="3" />
              </g>
            </g>

            {/* torso */}
            <g className="nova-body">
              {/* hood behind head */}
              <path
                d="M112 268 Q200 218 288 268 Q280 312 200 318 Q120 312 112 268Z"
                fill="#2c2c5e"
                stroke="#12122e"
                strokeWidth="3"
              />
              <path
                d="M92 436 L96 308 Q98 262 150 254 L250 254 Q302 262 304 308 L308 436 Q200 448 92 436Z"
                fill={`url(#${id}-hood)`}
                stroke="#12122e"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* hood opening + neck */}
              <ellipse cx="200" cy="268" rx="62" ry="22" fill="#0f0f28" />
              <rect x="178" y="226" width="44" height="46" rx="10" fill="#8f89cc" stroke="#12122e" strokeWidth="3" />
              {/* hood rim highlight */}
              <path d="M122 270 Q200 224 278 270" fill="none" stroke="#6b64c9" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M104 318 Q104 280 140 266" fill="none" stroke="#4a4a8e" strokeWidth="3" strokeLinecap="round" />
              <path d="M296 318 Q296 280 260 266" fill="none" stroke="#4a4a8e" strokeWidth="3" strokeLinecap="round" />
              {/* drawstrings */}
              <path d="M178 292 L176 340" stroke="#f1f0ff" strokeWidth="5" strokeLinecap="round" />
              <path d="M222 292 L224 340" stroke="#f1f0ff" strokeWidth="5" strokeLinecap="round" />
              <circle cx="176" cy="344" r="5" fill="#f1f0ff" stroke="#12122e" strokeWidth="2" />
              <circle cx="224" cy="344" r="5" fill="#f1f0ff" stroke="#12122e" strokeWidth="2" />
              {/* NOVA patch */}
              <rect x="150" y="360" width="100" height="36" rx="8" fill="#f4f2ff" stroke="#12122e" strokeWidth="3" />
              <text
                x="200"
                y="386"
                textAnchor="middle"
                fontFamily="'Space Grotesk','Inter',system-ui,sans-serif"
                fontWeight="800"
                fontSize="22"
                letterSpacing="2.5"
                fill="#1b1b3f"
              >
                NOVA
              </text>
            </g>

            {/* arms */}
            <g className="nova-arms">
              <g className="nova-arm nova-arm-l">
                <rect x="82" y="278" width="36" height="98" rx="18" fill={`url(#${id}-hood)`} stroke="#12122e" strokeWidth="3" />
                <path d="M85 356 H115" stroke="#4a4a8e" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="384" r="14" fill="#e6e3fa" stroke="#4e46a0" strokeWidth="3" />
              </g>
              <g className="nova-arm nova-arm-r">
                <rect x="282" y="278" width="36" height="98" rx="18" fill={`url(#${id}-hood)`} stroke="#12122e" strokeWidth="3" />
                <path d="M285 356 H315" stroke="#4a4a8e" strokeWidth="3" strokeLinecap="round" />
                <circle cx="300" cy="384" r="14" fill="#e6e3fa" stroke="#4e46a0" strokeWidth="3" />
              </g>
            </g>
          </g>

          {/* ---------------- head ---------------- */}
          <g className="nova-head">
          <g transform="translate(200 254) scale(1.18) translate(-200 -240)">
            {/* headband (behind head) */}
            <path d="M103 160 C94 112 100 84 126 64" fill="none" stroke="#1d1d42" strokeWidth="11" strokeLinecap="round" />

            {/* antenna */}
            <g className="nova-antenna">
              <path d="M252 70 L264 34" stroke="#2a2a5c" strokeWidth="6" strokeLinecap="round" />
              <rect x="242" y="62" width="22" height="10" rx="4" fill="#2a2a5c" stroke="#12122e" strokeWidth="2.5" />
              <g className="nova-halo">
                <ellipse className="nova-halo-glow" cx="268" cy="22" rx="27" ry="9" fill="none" stroke="#7b86ff" strokeWidth="9" filter={`url(#${id}-glow)`} />
                <ellipse cx="268" cy="22" rx="27" ry="9" fill="none" stroke="#7b86ff" strokeWidth="5" />
                <ellipse cx="268" cy="22" rx="27" ry="9" fill="none" stroke="#c9cfff" strokeWidth="1.6" strokeDasharray="22 40" />
              </g>
              <ellipse cx="265" cy="34" rx="11" ry="4" fill="#2a2a5c" stroke="#12122e" strokeWidth="2" />
            </g>

            {/* left ear cup (behind head edge) */}
            <ellipse cx="102" cy="160" rx="17" ry="38" fill="#1b1b3d" stroke="#0e0e26" strokeWidth="3" />
            <rect x="94" y="140" width="6" height="34" rx="3" fill="#4a4a95" />

            {/* head shell */}
            <rect x="105" y="65" width="190" height="170" rx="42" fill={`url(#${id}-head)`} stroke="#5a50ae" strokeWidth="3.5" />
            <path d="M124 104 Q128 80 160 76" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
            <path d="M158 231 H252 Q290 231 292 192" fill="none" stroke="#9d96dc" strokeWidth="6" strokeLinecap="round" opacity="0.5" />

            {/* ---------------- face ---------------- */}
            <g className="nova-face">
              {/* cheeks */}
              <ellipse cx="132" cy="186" rx="13" ry="7" fill="#ff9bb8" opacity="0.55" />
              <ellipse cx="268" cy="186" rx="13" ry="7" fill="#ff9bb8" opacity="0.55" />

              {/* brows */}
              <path className="nova-brow nova-brow-l" d="M140 128 Q160 112 184 124" fill="none" stroke="#3a2f86" strokeWidth="4" strokeLinecap="round" />
              <path className="nova-brow nova-brow-r" d="M216 124 Q240 112 260 128" fill="none" stroke="#3a2f86" strokeWidth="4" strokeLinecap="round" />

              {/* eyes */}
              <g className="nova-eyes">
                {[162, 238].map((cx, i) => (
                  <g
                    key={cx}
                    className={`nova-eye ${i === 0 ? "nova-eye-l" : "nova-eye-r"}`}
                    transform={`translate(${cx} 158)`}
                  >
                    <g className="nova-eye-shape">
                      <ellipse rx="20" ry="25" fill={`url(#${id}-eye)`} stroke="#2b2170" strokeWidth="3" />
                      <g className="nova-pupil">
                        <ellipse cx="0" cy="3" rx="11.5" ry="15.5" fill="#2a1f6e" />
                        <circle cx="-6" cy="-8" r="6.5" fill="#fff" />
                        <circle cx="6" cy="10" r="3" fill="#fff" opacity="0.9" />
                      </g>
                    </g>
                    <path className="nova-eye-happy" d="M-17 7 Q0 -17 17 7" fill="none" stroke="#2a1f6e" strokeWidth="5.5" strokeLinecap="round" />
                  </g>
                ))}
              </g>

              {/* mouth: every shape is its own layer, only one visible at a time */}
              <g className="nova-mouth" transform="translate(200 203)">
                {MOUTH_SHAPES.map((m) => (
                  <g
                    key={m}
                    className={`nova-mouth-shape mouth-${m}${mouth === m ? " is-active" : ""}`}
                  >
                    {m === "closed" && (
                      <path d="M-14 0 Q0 8 14 0" fill="none" stroke="#3a1a5e" strokeWidth="4.5" strokeLinecap="round" />
                    )}
                    {m === "small" && (
                      <>
                        <path d="M-8 -2 Q0 -5 8 -2 Q7 10 0 11 Q-7 10 -8 -2Z" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M-4 8 Q0 4 4 8 Q0 11 -4 8Z" fill="#ff7fa6" />
                      </>
                    )}
                    {m === "open" && (
                      <>
                        <path d="M-13 -4 Q0 -8 13 -4 Q13 16 0 18 Q-13 16 -13 -4Z" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M-8 13 Q0 5 8 13 Q0 19 -8 13Z" fill="#ff7fa6" />
                      </>
                    )}
                    {m === "wide" && (
                      <>
                        <path d="M-18 -6 Q0 -11 18 -6 Q19 22 0 25 Q-19 22 -18 -6Z" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M-11 18 Q0 7 11 18 Q0 25 -11 18Z" fill="#ff7fa6" />
                      </>
                    )}
                    {m === "smile" && (
                      <>
                        <path d="M-17 -4 Q0 -1 17 -4 Q14 16 0 17 Q-14 16 -17 -4Z" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M-8 12 Q0 5 8 12 Q0 18 -8 12Z" fill="#ff7fa6" />
                      </>
                    )}
                    {m === "grin" && (
                      <>
                        <path d="M-20 -5 Q0 0 20 -5 Q17 19 0 20 Q-17 19 -20 -5Z" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M-17 -3 Q0 1 17 -3 L16 3 Q0 7 -16 3Z" fill="#fff" />
                        <path d="M-9 14 Q0 7 9 14 Q0 20 -9 14Z" fill="#ff7fa6" />
                      </>
                    )}
                    {m === "wavy" && (
                      <path d="M-15 5 Q-7.5 -3 0 5 T15 5" fill="none" stroke="#3a1a5e" strokeWidth="4.5" strokeLinecap="round" />
                    )}
                    {m === "o" && (
                      <>
                        <ellipse cx="0" cy="4" rx="6" ry="7" fill="#3a1a5e" stroke="#2a1450" strokeWidth="2.5" />
                        <ellipse cx="0" cy="7" rx="3" ry="2" fill="#ff7fa6" />
                      </>
                    )}
                  </g>
                ))}
              </g>
            </g>

            {/* right ear cup with glowing ring */}
            <g className="nova-cup-r">
              <ellipse cx="298" cy="166" rx="21" ry="40" fill="#1b1b3d" stroke="#0e0e26" strokeWidth="3" />
              <circle className="nova-ring-pulse p1" cx="300" cy="166" r="15" fill="none" stroke="#7d8cff" strokeWidth="3" />
              <circle className="nova-ring-pulse p2" cx="300" cy="166" r="15" fill="none" stroke="#7d8cff" strokeWidth="3" />
              <circle cx="300" cy="166" r="15" fill="#15153a" stroke="#7d8cff" strokeWidth="5" />
              <circle className="nova-ring-glow" cx="300" cy="166" r="15" fill="none" stroke="#9fa9ff" strokeWidth="9" filter={`url(#${id}-glow)`} />
            </g>

            {/* mic boom */}
            <path d="M304 202 C308 240 282 252 244 247" fill="none" stroke="#1b1b3d" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="238" cy="247" rx="11" ry="7.5" fill="#1b1b3d" stroke="#0e0e26" strokeWidth="2.5" />
            <ellipse cx="235" cy="245" rx="4.5" ry="2.6" fill="#6a63c8" />
          </g>
          </g>

          {/* celebration sparks */}
          <g className="nova-sparks" transform="translate(200 150)">
            {SPARKS.map((s, i) => (
              <path
                key={i}
                className="nova-spark"
                d={STAR}
                fill={i % 2 ? "#ffd84d" : "#aab4ff"}
                stroke="#12122e"
                strokeWidth="1.2"
                style={
                  {
                    "--dx": `${s.dx}px`,
                    "--dy": `${s.dy}px`,
                    animationDelay: `${s.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </g>
        </g>
        </g>
      </svg>

      {effectiveShowStatus && (
        <div className="nova-status" aria-live="polite" data-locomotion={locomotion || undefined}>
          <span className="nova-status__dot" aria-hidden="true" />
          <span className="nova-status__text">{STATUS_LABEL[current]}</span>
        </div>
      )}
    </div>
  );
}

export default NovaAvatar;
