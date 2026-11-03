import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadDela } from "@remotion/google-fonts/DelaGothicOne";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { Wobs } from "./Wobs";

const { fontFamily: DISPLAY } = loadDela();
const { fontFamily: BODY } = loadFigtree();

const C = { night: "#0A0620", sky: "#120A33", card: "#1E1250", pink: "#FF3EA5", cyan: "#33F0FF", lime: "#C6FF3D", amber: "#FFB020", ink: "#F4F0FF", muted: "#A99BD9", fire: "#FF6A1A", flame: "#FFD23F" };

// Timeline, in frames at 30 fps.
const T = {
  type: 20, sent: 78, flop: 92, snore: 100,
  sunny: 130, ping: 235, glasses: 250, drop: 262, fire: 272,
  wobs: 385, inhale: 412, blow: 445, out: 470, send: 478, tap: 494,
  pings: 505, calm: 520, end: 600,
};

const SFX: [number, string, number?][] = [
  [T.type, "typing", 0.6], [T.sent, "whoosh"], [T.flop, "pop", 0.5], [T.snore, "snore", 0.7],
  [T.sunny, "whoosh"], [T.sunny + 12, "birds", 0.8], [T.sunny + 60, "birds", 0.6],
  [T.ping, "ping"], [T.glasses, "tap", 0.6], [T.drop, "splat"], [T.fire, "crackle"], [T.fire + 6, "alarm", 0.7], [T.fire + 50, "alarm", 0.6],
  [292, "pop"], [308, "pop"], [324, "pop"], [342, "pop"], [T.fire + 100, "crackle", 0.8],
  [T.wobs, "boing"], [T.inhale, "inhale"], [T.blow, "blow"], [T.blow + 18, "poof"], [T.blow + 28, "poof", 0.6],
  [T.tap, "tap"], [T.pings, "ping"], [T.pings + 15, "ping"], [T.pings + 30, "ping"], [T.calm + 20, "birds", 0.7], [T.end + 6, "chime"],
];

const PANIC = [
  { at: 292, text: "9AM IS FULL!", x: 60, y: 190, r: -6, size: 90, color: C.flame },
  { at: 308, text: "MY SATURDAY!!", x: 50, y: 400, r: 5, size: 80, color: C.pink },
  { at: 324, text: "WHO?!", x: 640, y: 520, r: 10, size: 110, color: C.cyan },
  { at: 342, text: "NOT AGAIN", x: 60, y: 660, r: -9, size: 80, color: C.lime },
];

function useClock() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (at: number, damping = 10) => spring({ frame: frame - at, fps, config: { damping, mass: 0.6 } });
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  return { frame, pop, clamp };
}

/** A cartoon flame that flickers. */
const Flame: React.FC<{ x: number; y: number; size: number; seed: number; grow: number }> = ({ x, y, size, seed, grow }) => {
  const { frame } = useClock();
  const flick = 1 + 0.15 * Math.sin(frame / 2.5 + seed) + 0.08 * Math.sin(frame / 1.3 + seed * 3);
  const sway = 6 * Math.sin(frame / 4 + seed);
  return (
    <svg
      viewBox="-60 -170 120 175"
      width={size}
      height={size * 1.46}
      style={{ position: "absolute", left: x - size / 2, top: y - size * 1.42, overflow: "visible", transformOrigin: "50% 100%", transform: `scale(${grow}, ${grow * flick}) skewX(${sway}deg)` }}
    >
      <path d="M0 0 C-60 -20 -50 -90 -18 -120 C-20 -90 0 -95 6 -165 C30 -120 60 -80 40 -30 C30 -10 20 0 0 0Z" fill={C.fire} />
      <path d="M0 0 C-30 -10 -30 -60 -6 -80 C-6 -60 8 -64 12 -100 C28 -70 34 -40 22 -16 C16 -4 8 0 0 0Z" fill={C.flame} />
    </svg>
  );
};

/** The studio owner: bun, sunglasses, smoothie. */
const Owner: React.FC<{ shock: number; glasses: number; smoothie: boolean; bob: number; scorched: boolean }> = ({ shock, glasses, smoothie, bob, scorched }) => {
  const { frame } = useClock();
  return (
    <svg viewBox="0 0 300 560" width={330} height={616} style={{ overflow: "visible", transform: `translateY(${bob}px)` }}>
      <rect x="100" y="400" width="40" height="150" rx="20" fill="#2B1C70" />
      <rect x="160" y="400" width="40" height="150" rx="20" fill="#2B1C70" />
      <rect x="78" y="208" width="144" height="210" rx="64" fill={C.lime} />
      <circle cx="150" cy="128" r="84" fill="#C68B59" />
      <circle cx="150" cy="38" r="38" fill="#3A1F14" />
      <path d="M68 118 C70 50 230 50 232 118 C200 84 100 84 68 118Z" fill="#3A1F14" />
      {scorched && (
        <g opacity={0.6 + 0.4 * Math.sin(frame / 6)}>
          <path d={`M150 0 q${12 + 6 * Math.sin(frame / 8)} -30 0 -60 q-12 -30 0 -60`} fill="none" stroke="#B9B2CF" strokeWidth="9" strokeLinecap="round" />
        </g>
      )}
      {shock > 0.5 ? (
        <>
          <circle cx="120" cy="128" r="17" fill="#fff" /><circle cx="180" cy="128" r="17" fill="#fff" />
          <circle cx="120" cy="130" r="7" fill="#0A0620" /><circle cx="180" cy="130" r="7" fill="#0A0620" />
          <ellipse cx="150" cy="178" rx="20" ry={14 + 12 * shock} fill="#0A0620" />
        </>
      ) : (
        <>
          <path d="M108 132 q12 -12 24 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
          <path d="M168 132 q12 -12 24 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
          <path d="M126 168 q24 22 48 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      <g transform={`translate(${glasses * 500} ${-glasses * 1200}) rotate(${glasses * 300} 150 127)`}>
        <rect x="92" y="108" width="54" height="38" rx="14" fill="#0A0620" />
        <rect x="154" y="108" width="54" height="38" rx="14" fill="#0A0620" />
        <rect x="140" y="118" width="20" height="6" fill="#0A0620" />
        <rect x="100" y="114" width="18" height="8" rx="4" fill={C.cyan} opacity="0.7" />
      </g>
      <path d="M210 260 q40 10 44 -40" fill="none" stroke="#C68B59" strokeWidth="26" strokeLinecap="round" />
      {smoothie && (
        <g>
          <path d="M232 150 l46 0 -8 82 -30 0z" fill={C.pink} />
          <rect x="228" y="142" width="54" height="12" rx="6" fill="#fff" />
          <path d="M262 142 l14 -40" stroke={C.cyan} strokeWidth="7" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

/** The sick instructor, tucked up in bed. */
const SickBed: React.FC<{ asleep: boolean; typing: boolean; armUp: boolean }> = ({ asleep, typing, armUp }) => {
  const { frame } = useClock();
  const breathe = Math.sin(frame / 10) * 6;
  return (
    <svg viewBox="0 0 1080 900" width={1080} height={900} style={{ position: "absolute", top: 820, left: 0 }}>
      <rect x="60" y="300" width="960" height="560" rx="60" fill="#2B1C70" />
      <rect x="120" y="230" width="360" height="170" rx="80" fill="#F4F0FF" />
      <circle cx="300" cy="250" r="120" fill="#E8B796" />
      <path d="M180 230 C190 120 410 110 420 230 C380 170 240 170 180 230Z" fill="#7A3DFF" />
      {asleep ? (
        <>
          <path d="M240 255 q20 14 40 0" fill="none" stroke="#0A0620" strokeWidth="8" strokeLinecap="round" />
          <path d="M320 255 q20 14 40 0" fill="none" stroke="#0A0620" strokeWidth="8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M240 250 l40 0" stroke="#0A0620" strokeWidth="8" strokeLinecap="round" />
          <path d="M320 250 l40 0" stroke="#0A0620" strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      <circle cx="300" cy="290" r="22" fill="#FF5A5A" />
      <path d="M330 320 l90 34" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
      <circle cx="420" cy="354" r="10" fill="#FF3B3B" />
      <path d={`M90 ${390 + breathe} C300 ${330 + breathe} 700 ${350 - breathe} 1000 ${380 + breathe} L1000 860 L90 860Z`} fill={C.pink} />
      <path d={`M90 ${420 + breathe} C300 ${360 + breathe} 700 ${380 - breathe} 1000 ${410 + breathe}`} fill="none" stroke="#FF8CC8" strokeWidth="14" />
      {armUp && (
        <g transform={typing ? `translate(0 ${Math.sin(frame) * 3})` : ""}>
          <path d="M560 420 q40 -120 60 -190" stroke="#E8B796" strokeWidth="44" strokeLinecap="round" fill="none" />
          <rect x="560" y="70" width="130" height="220" rx="22" fill="#0A0620" />
          <rect x="572" y="84" width="106" height="188" rx="12" fill={C.cyan} opacity="0.85" />
        </g>
      )}
      <rect x="840" y="160" width="130" height="140" rx="20" fill="#C9BBFF" />
      <path d="M880 160 q25 -60 50 0" fill="#fff" />
    </svg>
  );
};

export const SickDay: React.FC = () => {
  const { frame, pop, clamp } = useClock();

  // Scene flags.
  const bedroom = frame < T.sunny;
  const yard = frame >= T.sunny && frame < T.end;
  const burning = frame >= T.fire && frame < T.out;
  const fireGrow = frame < T.fire ? 0 : frame < T.blow ? interpolate(frame, [T.fire, T.fire + 70], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) }) : interpolate(frame, [T.blow + 5, T.out], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });

  const sky = interpolateColors(frame, [T.fire, T.fire + 60, T.blow + 10, T.out + 20], ["#8EE3FF", "#FF5A36", "#FF5A36", "#8EE3FF"]);
  const shake = burning && frame < T.wobs ? Math.sin(frame * 2.1) * 10 : 0;
  const ownerShock = frame >= T.glasses && frame < T.calm ? 1 : 0;
  const glasses = frame < T.glasses ? 0 : frame < T.calm ? interpolate(frame, [T.glasses, T.glasses + 8], [0, 1], clamp) : interpolate(frame, [T.calm, T.calm + 8], [1, 0], clamp);
  const sunX = interpolate(frame, [T.fire + 40, T.fire + 90, T.out, T.out + 25], [0, 700, 700, 0], clamp);

  const breath = interpolate(frame, [T.inhale, T.blow - 4, T.blow, T.blow + 25, T.send], [1, 1.55, 1.55, 0.85, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const wobsIn = pop(T.wobs, 8);

  // Typing the message, letter by letter.
  const msg = "So sorry!! Fever of 39. Can't teach the 9am";
  const typed = msg.slice(0, Math.floor(interpolate(frame, [T.type, T.sent - 8], [0, msg.length], clamp)));

  return (
    <AbsoluteFill style={{ background: C.night, fontFamily: BODY, color: C.ink, overflow: "hidden" }}>
      {SFX.map(([at, name, vol]) => (
        <Sequence key={`${name}-${at}`} from={at}>
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol ?? 0.9} />
        </Sequence>
      ))}

      {/* 1. The instructor, sick in bed */}
      {bedroom && (
        <AbsoluteFill style={{ background: C.sky, opacity: interpolate(frame, [T.sunny - 10, T.sunny], [1, 0], clamp) }}>
          <div style={{ position: "absolute", top: 150, left: 90, width: 300, height: 300, borderRadius: 30, background: "#1E1250", border: "10px solid #2B1C70" }}>
            <div style={{ position: "absolute", top: 50, left: 140, width: 90, height: 90, borderRadius: 45, background: "#F4F0FF", boxShadow: "-24px 10px 0 0 #1E1250 inset" }} />
          </div>
          <div style={{ position: "absolute", top: 180, right: 80, fontFamily: DISPLAY, fontSize: 90, color: C.muted }}>06:40</div>
          <SickBed asleep={frame >= T.flop} typing={frame < T.sent} armUp={frame < T.flop} />
          {frame >= T.type && (
            <div
              style={{
                position: "absolute", top: 520, left: 380, right: 70, background: "#fff", color: "#1A1240", borderRadius: "36px 36px 8px 36px",
                padding: "26px 32px", fontSize: 46, fontWeight: 700, lineHeight: 1.25,
                transform: frame >= T.sent ? `translate(${interpolate(frame, [T.sent, T.sent + 10], [0, 900], clamp)}px, ${interpolate(frame, [T.sent, T.sent + 10], [0, -300], clamp)}px)` : `scale(${pop(T.type)})`,
              }}
            >
              {typed}
              {frame < T.sent - 8 && <span style={{ opacity: Math.floor(frame / 6) % 2 }}>|</span>}
            </div>
          )}
          {frame >= T.sent && frame < T.sent + 25 && (
            <div style={{ position: "absolute", top: 460, right: 90, fontSize: 40, fontWeight: 700, color: C.lime, opacity: interpolate(frame, [T.sent, T.sent + 6, T.sent + 20, T.sent + 25], [0, 1, 1, 0]) }}>Sent ✓</div>
          )}
          {frame >= T.snore &&
            ["z", "z", "Z"].map((z, i) => (
              <div key={i} style={{ position: "absolute", left: 470 + i * 50, top: 850 - i * 70, fontFamily: DISPLAY, fontSize: 60 + i * 24, color: "#C9BBFF", opacity: interpolate((frame - T.snore - i * 6) % 30, [0, 6, 22, 30], [0, 1, 1, 0], clamp) }}>
                {z}
              </div>
            ))}
          <div style={{ position: "absolute", bottom: 160, width: "100%", textAlign: "center", fontSize: 54, fontWeight: 700, color: C.muted, opacity: interpolate(frame, [T.flop, T.flop + 10], [0, 1], clamp) }}>
            …and back to sleep.
          </div>
        </AbsoluteFill>
      )}

      {/* 2-5. The owner's sunny Saturday */}
      {yard && (
        <AbsoluteFill style={{ background: sky, transform: `translate(${shake}px, ${shake * 0.6}px)`, opacity: interpolate(frame, [T.sunny, T.sunny + 10], [0, 1], clamp) }}>
          {/* Sun: rays spin; it sweats and slides away when the fire starts */}
          <div style={{ position: "absolute", top: 120, left: 760 + sunX, width: 220, height: 220 }}>
            <svg viewBox="-110 -110 220 220" width={220} height={220} style={{ overflow: "visible" }}>
              <g transform={`rotate(${frame * 2})`}>
                {Array.from({ length: 10 }, (_, i) => <rect key={i} x="-8" y="-120" width="16" height="36" rx="8" fill={C.flame} transform={`rotate(${i * 36})`} />)}
              </g>
              <circle r="70" fill={C.flame} />
              {burning ? (
                <>
                  <circle cx="-24" cy="-8" r="10" fill="#0A0620" /><circle cx="24" cy="-8" r="10" fill="#0A0620" />
                  <ellipse cx="0" cy="28" rx="14" ry="10" fill="#0A0620" />
                  <path d="M52 -30 q8 14 0 20 q-8 -6 0 -20z" fill={C.cyan} />
                </>
              ) : (
                <>
                  <path d="M-34 -10 q10 -10 20 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
                  <path d="M14 -10 q10 -10 20 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
                  <path d="M-22 18 q22 20 44 0" fill="none" stroke="#0A0620" strokeWidth="6" strokeLinecap="round" />
                </>
              )}
            </svg>
          </div>

          {/* House */}
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <rect x="0" y="1500" width="1080" height="420" fill={burning ? "#5A7D2E" : "#7ED957"} />
            <rect x="60" y="900" width="460" height="600" rx="20" fill="#FFE7F3" />
            <path d="M30 920 L290 680 L550 920Z" fill={C.pink} />
            <rect x="120" y="1000" width="140" height="140" rx="16" fill={burning ? "#FF9A3C" : C.cyan} />
            <rect x="320" y="1220" width="130" height="280" rx="16" fill="#7A3DFF" />
            {[160, 760, 940].map((x, i) => {
              const wilt = burning ? interpolate(frame, [T.fire + 20 + i * 10, T.fire + 50 + i * 10], [0, 70], clamp) * (i % 2 ? 1 : -1) : 0;
              return (
                <g key={x} transform={`rotate(${wilt} ${x} 1640)`}>
                  <rect x={x - 5} y="1560" width="10" height="80" fill="#2E7D32" />
                  <circle cx={x} cy="1550" r="30" fill={[C.pink, C.amber, C.cyan][i]} />
                  <circle cx={x} cy="1550" r="12" fill="#fff" />
                </g>
              );
            })}
          </svg>

          {/* Fire */}
          {fireGrow > 0.01 && (
            <>
              <Flame x={150} y={930} size={170} seed={1} grow={fireGrow} />
              <Flame x={290} y={720} size={220} seed={2} grow={fireGrow} />
              <Flame x={440} y={930} size={180} seed={3} grow={fireGrow} />
              <Flame x={190} y={1150} size={130} seed={4} grow={fireGrow} />
              <Flame x={80} y={1520} size={190} seed={5} grow={fireGrow} />
              <Flame x={560} y={1530} size={150} seed={6} grow={fireGrow} />
              <Flame x={1000} y={1530} size={200} seed={7} grow={fireGrow} />
            </>
          )}
          {/* Smoke puffs after Wobs blows it out */}
          {frame >= T.blow + 15 && frame < T.calm + 40 &&
            [180, 300, 450, 620, 900].map((x, i) => {
              const t = frame - T.blow - 15 - i * 3;
              return <div key={x} style={{ position: "absolute", left: x, top: 900 - t * 9, width: 140 + t * 3, height: 140 + t * 3, borderRadius: "50%", background: "#E6E1F2", opacity: interpolate(t, [0, 10, 60], [0, 0.85, 0], clamp) }} />;
            })}

          {/* Owner, centre stage */}
          <div style={{ position: "absolute", left: 610, top: 1080 }}>
            <Owner shock={ownerShock} glasses={glasses} smoothie={frame < T.drop || frame >= T.calm} bob={frame < T.ping ? Math.sin(frame / 5) * 8 : 0} scorched={frame >= T.out} />
          </div>
          {/* The smoothie falling and splatting */}
          {frame >= T.drop && frame < T.calm && (
            <div style={{ position: "absolute", left: 830, top: interpolate(frame, [T.drop, T.drop + 8], [1180, 1600], clamp) }}>
              {frame < T.drop + 8 ? (
                <div style={{ width: 50, height: 80, background: C.pink, borderRadius: 8, transform: `rotate(${(frame - T.drop) * 25}deg)` }} />
              ) : (
                <div style={{ width: 170, height: 40, background: C.pink, borderRadius: "50%", marginLeft: -60 }} />
              )}
            </div>
          )}

          {frame < T.ping && (
            <div style={{ position: "absolute", top: 440, left: 70, right: 70 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 110, color: "#1A1240", opacity: pop(T.sunny + 8), transform: `scale(${pop(T.sunny + 8)})`, transformOrigin: "left" }}>Meanwhile…</div>
              <div style={{ marginTop: 20, fontSize: 54, fontWeight: 700, color: "#1A1240", opacity: pop(T.sunny + 30) }}>Saturday. Sun&apos;s out.<br />Smoothie in hand.</div>
            </div>
          )}

          {/* The message lands */}
          {frame >= T.ping && frame < T.wobs && (
            <div
              style={{
                position: "absolute", top: 90, left: 60, right: 60, background: "#fff", color: "#1A1240", borderRadius: 36, padding: "26px 32px", fontSize: 44, lineHeight: 1.25,
                transform: `translateY(${interpolate(pop(T.ping), [0, 1], [-300, 0])}px)`,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 700, color: "#6B6191" }}>Lerato · 9am Reformer</div>
              So sorry!! Fever of 39. Can&apos;t teach the 9am
            </div>
          )}

          {/* Panic words */}
          {frame >= T.fire && frame < T.out &&
            PANIC.map((w, i) => {
              const blown = frame >= T.blow ? interpolate(frame, [T.blow + i * 2, T.blow + 16 + i * 2], [0, 1400], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
              return frame >= w.at ? (
                <div
                  key={w.text}
                  style={{
                    position: "absolute", left: w.x, top: w.y + 200, fontFamily: DISPLAY, fontSize: w.size, color: w.color, WebkitTextStroke: "3px #0A0620",
                    transform: `scale(${pop(w.at, 7)}) rotate(${w.r + (frame < T.wobs ? Math.sin(frame * 1.7 + i) * 3 : 0)}deg) translateX(${blown}px)`,
                    opacity: frame >= T.wobs && frame < T.blow ? 0.45 : 1,
                  }}
                >
                  {w.text}
                </div>
              ) : null;
            })}

          {/* Wobs the firefighter */}
          {frame >= T.wobs && (
            <>
              {frame < T.pings && (
                <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 92, color: C.lime, WebkitTextStroke: "3px #0A0620", transform: `scale(${pop(T.wobs + 12)})` }}>Don&apos;t freak out.</div>
                  <div style={{ marginTop: 16, fontSize: 70, fontWeight: 800, color: "#fff", WebkitTextStroke: "2px #0A0620" }}>
                    {frame >= T.inhale && frame < T.blow && "Breathe in…"}
                    {frame >= T.blow && "…and BLOW!"}
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", left: 40, top: 1040, transform: `translateY(${interpolate(wobsIn, [0, 1], [1100, 0])}px)` }}>
                <Wobs
                  size={480}
                  helmet
                  mood={frame >= T.pings ? "cheer" : frame >= T.blow && frame < T.blow + 30 ? "blow" : frame >= T.inhale ? "calm" : "idle"}
                  squashX={breath >= 1 ? breath : 2 - breath}
                  squashY={breath}
                />
              </div>
              {frame >= T.blow && frame < T.blow + 30 && (
                <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                  {[0, 1, 2, 3].map((i) => {
                    const t = frame - T.blow - i * 3;
                    const x = 470 + t * 30;
                    return <path key={i} d={`M${x} ${1250 - i * 40} q60 -30 120 0 q60 30 120 0`} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" opacity={interpolate(t, [0, 4, 20], [0, 0.9, 0], clamp)} />;
                  })}
                </svg>
              )}
              {frame >= T.send && frame < T.pings && (
                <div
                  style={{
                    position: "absolute", left: 190, right: 190, top: 820, background: C.pink, borderRadius: 999, padding: "40px 0", textAlign: "center",
                    fontFamily: DISPLAY, fontSize: 80, color: "#fff", boxShadow: `0 0 60px ${C.pink}88`,
                    transform: `scale(${pop(T.send) * (frame >= T.tap && frame < T.tap + 5 ? 0.92 : 1)})`,
                  }}
                >
                  Send Wobs
                </div>
              )}
              {[
                { at: T.pings, text: "Wobs is on it", color: C.cyan },
                { at: T.pings + 15, text: "Naomi is taking it", color: C.amber },
                { at: T.pings + 30, text: "✓ Taken by Naomi · 06:43", color: C.lime },
              ].map((n, i) =>
                frame >= n.at ? (
                  <div
                    key={n.text}
                    style={{
                      position: "absolute", left: 70, right: 70, top: 140 + i * 140, background: "#fff", borderRadius: 36, padding: "26px 34px",
                      fontSize: 48, fontWeight: 700, color: "#1A1240", borderLeft: `18px solid ${n.color}`, boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                      transform: `translateX(${interpolate(pop(n.at), [0, 1], [1100, 0])}px)`,
                    }}
                  >
                    {n.text}
                  </div>
                ) : null,
              )}
            </>
          )}
        </AbsoluteFill>
      )}

      {/* 6. End card */}
      {frame >= T.end && (
        <AbsoluteFill style={{ background: C.sky, alignItems: "center", justifyContent: "center", gap: 36, opacity: interpolate(frame, [T.end, T.end + 8], [0, 1]) }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 86, color: C.lime, transform: `scale(${pop(T.end + 4)})` }}>Sick day?</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 86, color: C.ink, transform: `scale(${pop(T.end + 14)})` }}>Saturday saved.</div>
          <Wobs size={460} helmet mood="sleep" squashX={1.04 + Math.sin(frame / 12) * 0.02} squashY={0.94 - Math.sin(frame / 12) * 0.02} />
          <div style={{ fontFamily: DISPLAY, fontSize: 64, lineHeight: 1.1, textAlign: "center", padding: "0 80px", opacity: pop(T.end + 28) }}>
            When a class wobbles,
            <br />
            <span style={{ color: C.pink }}>Wobs</span> steadies it.
          </div>
          <div style={{ fontSize: 58, fontWeight: 700, color: C.cyan, opacity: pop(T.end + 40) }}>heywobs.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
