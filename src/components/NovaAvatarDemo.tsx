import { useState } from "react";
import { NovaAvatar, type NovaState } from "./NovaAvatar";

const STATES: NovaState[] = [
  "idle", "listening", "thinking", "speaking", "happy",
  "walking", "running", "excited", "confused", "success",
];
const SIZES = ["sm", "md", "lg", "xl"] as const;

/** Dev-only playground. Mount temporarily, e.g. <NovaAvatarDemo /> on a scratch route. */
export default function NovaAvatarDemo() {
  const [state, setState] = useState<NovaState>("idle");
  const [size, setSize] = useState<(typeof SIZES)[number]>("lg");

  return (
    <div style={{ padding: 24, display: "grid", gap: 20, justifyItems: "center" }}>
      <NovaAvatar state={state} size={size} interactive />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {STATES.map((s) => (
          <button key={s} onClick={() => setState(s)} aria-pressed={state === s}
            style={{ padding: "6px 12px", border: "3px solid #12122e", fontWeight: 800,
              background: state === s ? "#7d8cff" : "#fff", boxShadow: "3px 3px 0 #12122e", cursor: "pointer" }}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {SIZES.map((z) => (
          <button key={z} onClick={() => setSize(z)} aria-pressed={size === z}
            style={{ padding: "4px 10px", border: "2px solid #12122e", background: size === z ? "#c9f5dd" : "#fff", cursor: "pointer" }}>
            {z}
          </button>
        ))}
      </div>
    </div>
  );
}
