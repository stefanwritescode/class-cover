import { TZ } from "@/lib/format";

export type WobsMood = "idle" | "cheer" | "worry" | "nap";

const LINES: Record<WobsMood, string[]> = {
  idle: [
    "Core strong, heart full. You've got this.",
    "Small reps, big days.",
    "Breathe in. Show up. Shine.",
    "Lekker to see you!",
    "Every class counts. So do you.",
    "Wobble, but don't stop.",
    "Strong springs, stronger humans.",
  ],
  cheer: ["It's yours! Go light up that class.", "Cover champion!", "Lekker, you got it!", "Teacher of the day. Absolute legend."],
  worry: ["A class needs a hero soon!", "Help! A class is about to go uncovered.", "Anyone free? Pretty please?"],
  nap: ["All covered. Nap time.", "Nothing open. Go stretch something.", "Quiet day. Rest is training too."],
};

/** Wobs' line for today: changes daily, the same all day so it doesn't flicker between screens. */
export function wobsLine(mood: WobsMood) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const n = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
  const lines = LINES[mood];
  return lines[n % lines.length];
}

function Face({ mood }: { mood: WobsMood }) {
  switch (mood) {
    case "cheer":
      return (
        <>
          <path d="M94 128 q8 -10 16 0" fill="none" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <path d="M130 128 q8 -10 16 0" fill="none" stroke="#0A0620" strokeWidth="5" strokeLinecap="round" />
          <path d="M106 142 q14 18 28 0z" fill="#0A0620" />
          <path d="M112 148 q8 6 16 0" fill="#FF8CC8" />
          <path d="M64 130 q-20 -20 -18 -44" fill="none" stroke="#FF3EA5" strokeWidth="12" strokeLinecap="round" />
          <path d="M176 130 q20 -20 18 -44" fill="none" stroke="#FF3EA5" strokeWidth="12" strokeLinecap="round" />
        </>
      );
    case "worry":
      return (
        <>
          <ellipse cx="102" cy="130" rx="8" ry="10" fill="#0A0620" />
          <ellipse cx="138" cy="130" rx="8" ry="10" fill="#0A0620" />
          <circle cx="104" cy="126" r="3" fill="#fff" />
          <circle cx="140" cy="126" r="3" fill="#fff" />
          <path d="M92 114 l16 4" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          <path d="M148 114 l-16 4" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="120" cy="152" rx="7" ry="5" fill="#0A0620" />
          <path d="M168 118 q6 10 0 14 q-6 -4 0 -14z" fill="#33F0FF" />
        </>
      );
    case "nap":
      return (
        <>
          <path d="M94 130 q8 6 16 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          <path d="M130 130 q8 6 16 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="120" cy="150" rx="5" ry="3" fill="#0A0620" />
        </>
      );
    default:
      return (
        <>
          <ellipse cx="102" cy="128" rx="7" ry="9" fill="#0A0620" />
          <ellipse cx="138" cy="128" rx="7" ry="9" fill="#0A0620" />
          <circle cx="104" cy="125" r="2.5" fill="#fff" />
          <circle cx="140" cy="125" r="2.5" fill="#fff" />
          <path d="M110 146 q10 8 20 0" fill="none" stroke="#0A0620" strokeWidth="4" strokeLinecap="round" />
        </>
      );
  }
}

/** Wobs: a wobbly pink blob in a cyan headband who cheers teachers on. */
export function Wobs({ mood = "idle", className = "h-24 w-24" }: { mood?: WobsMood; className?: string }) {
  return (
    <svg viewBox="40 40 180 150" className={`wobs-${mood} ${className}`} role="img" aria-label={`Wobs, ${mood === "nap" ? "napping" : mood === "worry" ? "worried" : mood === "cheer" ? "cheering" : "smiling"}`}>
      <ellipse cx="120" cy="180" rx="50" ry="6" fill="#0A0620" opacity="0.5" />
      <g className="wobs-body">
        <path d="M120 52 C170 52 182 100 180 130 C178 168 150 176 120 176 C90 176 62 168 60 130 C58 100 70 52 120 52Z" fill="#FF3EA5" />
        <path d="M88 76 C96 64 108 60 118 60" fill="none" stroke="#FF8CC8" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
        <path d="M64 98 C100 88 140 88 177 98 L176 112 C140 102 100 102 63 112Z" fill="#33F0FF" />
        <path d="M176 102 l20 -12 -5 13 15 3" fill="none" stroke="#33F0FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="86" cy="140" rx="9" ry="5" fill="#FF8CC8" />
        <ellipse cx="154" cy="140" rx="9" ry="5" fill="#FF8CC8" />
        <Face mood={mood} />
      </g>
      {mood === "nap" && (
        <g fill="#C9BBFF" fontFamily="var(--font-display), sans-serif">
          <text x="180" y="72" fontSize="16">z</text>
          <text x="194" y="56" fontSize="20">z</text>
        </g>
      )}
    </svg>
  );
}

export type DayPart = "morning" | "midday" | "evening";

/** Time of day right now in South Africa. */
export function partOfDayNow(): DayPart {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));
  return h >= 5 && h < 12 ? "morning" : h >= 12 && h < 17 ? "midday" : "evening";
}

const SKY: Record<DayPart, { sky: string; city: string[]; sun: string; ring: string; windows: string[] }> = {
  morning: { sky: "#2A1458", city: ["#3A1F6E", "#45257E"], sun: "#FF7A45", ring: "#FFB020", windows: ["#FFB020", "#FF8CC8"] },
  midday: { sky: "#14247A", city: ["#1E338F", "#263E9E"], sun: "#33F0FF", ring: "#C6FF3D", windows: ["#33F0FF", "#C6FF3D"] },
  evening: { sky: "#120A33", city: ["#1E1250", "#2B1C70"], sun: "#FF3EA5", ring: "#FF3EA5", windows: ["#33F0FF", "#C6FF3D"] },
};

/** Night-city backdrop for the header. The sky, sun and window lights follow the time of day. */
export function CitySky({ part }: { part: DayPart }) {
  const c = SKY[part];
  const blocks: [number, number, number][] = [[0, 70, 26], [28, 52, 18], [48, 80, 30], [250, 64, 20], [272, 78, 30], [304, 48, 16], [322, 70, 28], [352, 84, 48]];
  return (
    <svg aria-hidden viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect width="400" height="160" fill={c.sky} />
      <circle cx="330" cy="38" r="22" fill={c.sun} />
      <circle cx="330" cy="38" r="31" fill="none" stroke={c.ring} strokeWidth="1.5" opacity="0.5" />
      <circle cx="330" cy="38" r="40" fill="none" stroke={c.ring} strokeWidth="1" opacity="0.25" />
      <path d="M200 18 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#C6FF3D" opacity="0.9" />
      <path d="M262 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#33F0FF" opacity="0.9" />
      {blocks.map(([x, y, w], i) => (
        <rect key={i} x={x} y={y + 40} width={w} height={160 - y - 40} fill={c.city[i % 2]} />
      ))}
      {[[8, 120], [34, 102], [58, 130], [258, 112], [282, 126], [310, 96], [330, 118], [366, 130]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3" height="3" fill={c.windows[i % 2]} />
      ))}
    </svg>
  );
}
