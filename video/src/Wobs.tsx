export type Mood = "idle" | "cheer" | "calm" | "sleep" | "worry" | "blow";

/** Wobs, drawn to match the app. squashX/squashY stretch him from the feet. */
export const Wobs: React.FC<{ mood?: Mood; size?: number; squashX?: number; squashY?: number; rotate?: number; helmet?: boolean }> = ({
  mood = "idle",
  size = 400,
  squashX = 1,
  squashY = 1,
  rotate = 0,
  helmet = false,
}) => (
  <svg viewBox="40 40 180 150" width={size} height={size * (150 / 180)} style={{ overflow: "visible" }}>
    <ellipse cx="120" cy="180" rx={50 * squashX} ry="6" fill="#000" opacity="0.35" />
    <g style={{ transformOrigin: "120px 176px", transform: `rotate(${rotate}deg) scale(${squashX}, ${squashY})` }}>
      <path d="M120 52 C170 52 182 100 180 130 C178 168 150 176 120 176 C90 176 62 168 60 130 C58 100 70 52 120 52Z" fill="#FF3EA5" />
      <path d="M88 76 C96 64 108 60 118 60" fill="none" stroke="#FF8CC8" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
      <path d="M64 98 C100 88 140 88 177 98 L176 112 C140 102 100 102 63 112Z" fill="#33F0FF" />
      <path d="M176 102 l20 -12 -5 13 15 3" fill="none" stroke="#33F0FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="86" cy="140" rx="9" ry="5" fill="#FF8CC8" />
      <ellipse cx="154" cy="140" rx="9" ry="5" fill="#FF8CC8" />
      {mood === "cheer" && (
        <>
          <path d="M94 128 q8 -10 16 0" fill="none" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <path d="M130 128 q8 -10 16 0" fill="none" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <path d="M106 142 q14 18 28 0z" fill="#0A0620" />
          <path d="M64 130 q-20 -20 -18 -44" fill="none" stroke="#FF3EA5" strokeWidth="12" strokeLinecap="round" />
          <path d="M176 130 q20 -20 18 -44" fill="none" stroke="#FF3EA5" strokeWidth="12" strokeLinecap="round" />
        </>
      )}
      {(mood === "calm" || mood === "sleep") && (
        <>
          <path d="M94 130 q8 6 16 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          <path d="M130 130 q8 6 16 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          {mood === "calm" ? <path d="M112 147 q8 6 16 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" /> : <ellipse cx="120" cy="150" rx="5" ry="3" fill="#0A0620" />}
        </>
      )}
      {mood === "blow" && (
        <>
          <path d="M94 126 l14 4" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <path d="M146 126 l-14 4" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="150" r="9" fill="#0A0620" />
          <ellipse cx="84" cy="142" rx="14" ry="10" fill="#FF8CC8" />
          <ellipse cx="156" cy="142" rx="14" ry="10" fill="#FF8CC8" />
        </>
      )}
      {mood === "worry" && (
        <>
          <ellipse cx="102" cy="130" rx="8" ry="10" fill="#0A0620" />
          <ellipse cx="138" cy="130" rx="8" ry="10" fill="#0A0620" />
          <circle cx="104" cy="126" r="3" fill="#fff" />
          <circle cx="140" cy="126" r="3" fill="#fff" />
          <ellipse cx="120" cy="152" rx="7" ry="5" fill="#0A0620" />
        </>
      )}
      {mood === "idle" && (
        <>
          <ellipse cx="102" cy="128" rx="7" ry="9" fill="#0A0620" />
          <ellipse cx="138" cy="128" rx="7" ry="9" fill="#0A0620" />
          <circle cx="104" cy="125" r="2.5" fill="#fff" />
          <circle cx="140" cy="125" r="2.5" fill="#fff" />
          <path d="M110 146 q10 8 20 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {helmet && (
        <g>
          <path d="M70 92 C72 48 168 48 170 92 Z" fill="#E8262B" />
          <rect x="58" y="88" width="124" height="12" rx="6" fill="#B81D22" />
          <path d="M120 50 L120 90" stroke="#B81D22" strokeWidth="5" />
          <circle cx="120" cy="72" r="11" fill="#FFD23F" />
        </g>
      )}
    </g>
  </svg>
);
