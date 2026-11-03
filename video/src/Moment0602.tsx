import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadDela } from "@remotion/google-fonts/DelaGothicOne";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { Wobs } from "./Wobs";

const { fontFamily: DISPLAY } = loadDela();
const { fontFamily: BODY } = loadFigtree();

const C = { night: "#0A0620", sky: "#120A33", card: "#1E1250", pink: "#FF3EA5", cyan: "#33F0FF", lime: "#C6FF3D", amber: "#FFB020", ink: "#F4F0FF", muted: "#A99BD9" };

// Timeline, in frames at 30 fps.
const T = { buzz: 10, chaos: 75, chat: 210, wobs: 300, inhale: 330, exhale: 375, send: 405, tap: 425, pings: 445, tumble: 482, end: 520 };

const SFX: [number, string, number?][] = [
  [T.buzz, "buzz"], [T.buzz + 30, "buzz", 0.6],
  [80, "pop"], [98, "pop"], [116, "pop"], [134, "pop"], [152, "pop"], [172, "whoosh"],
  [T.chat + 4, "whoosh"], [272, "crickets"],
  [T.wobs, "boing"], [T.inhale, "inhale"], [T.exhale, "squeak"], [T.tap, "tap"],
  [T.pings, "ping"], [T.pings + 15, "ping"], [T.pings + 30, "ping"], [T.tumble, "tumble"], [T.end + 6, "chime"],
];

const CHAOS = [
  { at: 80, text: "WHO?!", x: 110, y: 330, r: -8, size: 150, color: C.pink },
  { at: 98, text: "FULL CLASS!", x: 170, y: 560, r: 6, size: 88, color: C.amber },
  { at: 116, text: "12 ON THE WAITLIST", x: 60, y: 760, r: -4, size: 60, color: C.cyan },
  { at: 134, text: "REFUNDS!!", x: 250, y: 960, r: 9, size: 100, color: C.lime },
  { at: 152, text: "BAD REVIEWS", x: 80, y: 1170, r: -7, size: 86, color: C.pink },
  { at: 172, text: "I'll teach it myself…\nin my pyjamas", x: 110, y: 1420, r: 3, size: 58, color: C.ink },
];

const Phone: React.FC<{ children: React.ReactNode; shake?: number }> = ({ children, shake = 0 }) => (
  <div
    style={{
      position: "absolute", left: 190, top: 520, width: 700, height: 1060, borderRadius: 80, background: C.card,
      border: `10px solid #2B1C70`, transform: `rotate(${shake}deg)`, padding: 44, display: "flex", flexDirection: "column", gap: 28, overflow: "hidden",
    }}
  >
    {children}
  </div>
);

export const Moment0602: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (at: number, damping = 10) => spring({ frame: frame - at, fps, config: { damping, mass: 0.6 } });

  // Camera shake while panicking; everything stops when Wobs arrives.
  const panic = frame >= T.chaos && frame < T.wobs;
  const shakeAmt = panic ? interpolate(frame, [T.chaos, 190, T.wobs], [4, 14, 8]) : 0;
  const camX = Math.sin(frame * 2.3) * shakeAmt;
  const camY = Math.cos(frame * 1.7) * shakeAmt;
  const flash = panic && frame < T.chat && Math.floor(frame / 4) % 2 === 0;

  // Wobs' breathing: puff up on the inhale, deflate on the exhale.
  const breath = interpolate(frame, [T.inhale, T.exhale - 5, T.exhale, T.send], [1, 1.35, 1.35, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const wobble = frame >= T.send ? Math.sin(frame / 4) * 0.04 : 0;
  const wobsIn = pop(T.wobs, 8);
  const calm = frame >= T.wobs;

  return (
    <AbsoluteFill style={{ background: flash ? "#3A0F2E" : C.night, fontFamily: BODY, color: C.ink }}>
      {SFX.map(([at, name, vol]) => (
        <Sequence key={`${name}-${at}`} from={at}>
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol ?? 0.9} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px)` }}>
        {/* 1. 06:02, the phone buzzes */}
        {frame < T.chaos + 10 && (
          <>
            <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 210, color: C.muted, opacity: interpolate(frame, [0, 12], [0, 1]) }}>
              06:02
            </div>
            <Phone shake={frame > T.buzz && frame < T.buzz + 45 ? Math.sin(frame * 3) * 3 : 0}>
              <div style={{ fontSize: 40, color: C.muted }}>Tuesday</div>
              <div
                style={{
                  marginTop: 40, background: "#fff", color: "#1A1240", borderRadius: 36, padding: "30px 34px", fontSize: 44, lineHeight: 1.3,
                  transform: `translateY(${interpolate(pop(T.buzz + 15), [0, 1], [-260, 0])}px)`, opacity: pop(T.buzz + 15),
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: "#6B6191" }}>Lerato · 7am Reformer</div>
                Hey… I&apos;m so sick. Can&apos;t do 7am. So sorry!!
              </div>
            </Phone>
          </>
        )}

        {/* 2. Panic words (they stay, freeze when Wobs arrives, then tumble away) */}
        {frame >= T.chaos && frame < T.end &&
          CHAOS.map((w, i) => {
            const s = pop(w.at, 7);
            const fall = frame >= T.tumble ? interpolate(frame - T.tumble - i * 3, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) }) : 0;
            const jitter = panic ? Math.sin(frame * 1.9 + i) * 3 : 0;
            return (
              <div
                key={w.text}
                style={{
                  position: "absolute", left: w.x, top: w.y, fontFamily: DISPLAY, fontSize: w.size, lineHeight: 1.05, whiteSpace: "pre", color: w.color,
                  transform: `scale(${s}) rotate(${w.r + jitter + fall * (i % 2 ? 80 : -80)}deg) translateY(${fall * 1600}px)`,
                  opacity: frame < w.at ? 0 : calm ? 0.28 : 1, filter: calm ? "grayscale(0.8)" : "none",
                  textShadow: calm ? "none" : `0 0 30px ${w.color}66`,
                }}
              >
                {w.text}
              </div>
            );
          })}

        {/* 3. The staff group chat */}
        {frame >= T.chat && frame < T.wobs && (
          <Phone>
            <div style={{ fontSize: 40, fontWeight: 700 }}>Studio Team <span style={{ color: C.muted, fontWeight: 400 }}>(14)</span></div>
            <div
              style={{
                alignSelf: "flex-end", background: C.pink, color: "#fff", borderRadius: "36px 36px 8px 36px", padding: "28px 34px", fontSize: 50, fontWeight: 700,
                transform: `scale(${pop(T.chat + 4)})`, transformOrigin: "right bottom",
              }}
            >
              Anyone free for 7am??? PLEASE
            </div>
            <div style={{ alignSelf: "flex-end", fontSize: 30, color: C.muted, opacity: frame > T.chat + 18 ? 1 : 0 }}>Seen by 14</div>
            {frame > 238 && frame < 268 && (
              <div style={{ background: "#2B1C70", borderRadius: 36, padding: "22px 30px", width: 150, display: "flex", gap: 14 }}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{ width: 22, height: 22, borderRadius: 11, background: C.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + d * 5) / 5)) }} />
                ))}
              </div>
            )}
            {frame >= 272 && <div style={{ marginTop: 60, textAlign: "center", fontSize: 54, fontStyle: "italic", color: C.muted, opacity: pop(272) }}>…crickets…</div>}
          </Phone>
        )}
      </AbsoluteFill>

      {/* 4. Wobs: breathe in, breathe out, Send Wobs */}
      {frame >= T.wobs && frame < T.end && (
        <>
          <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 96, color: C.lime, opacity: pop(T.wobs + 15), transform: `scale(${pop(T.wobs + 15)})` }}>
            Don&apos;t freak out.
          </div>
          <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", fontSize: 72, fontWeight: 700, color: C.cyan }}>
            {frame >= T.inhale && frame < T.exhale && <span style={{ opacity: pop(T.inhale) }}>Breathe in…</span>}
            {frame >= T.exhale && frame < T.pings && <span style={{ opacity: pop(T.exhale) }}>…and out.</span>}
            {frame >= T.pings && <span style={{ opacity: pop(T.pings) }}>Steady.</span>}
          </div>
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center",
              transform: `translateY(${interpolate(wobsIn, [0, 1], [1400, 0])}px)`,
            }}
          >
            <Wobs size={620} mood={frame >= T.pings ? "cheer" : frame >= T.inhale ? "calm" : "idle"} squashX={(breath >= 1 ? breath : 2 - breath) + wobble} squashY={breath - wobble} />
          </div>
          {frame >= T.send && frame < T.pings && (
            <div
              style={{
                position: "absolute", left: 190, right: 190, top: 1380, background: C.pink, borderRadius: 999, padding: "44px 0", textAlign: "center",
                fontFamily: DISPLAY, fontSize: 84, color: "#fff", boxShadow: `0 0 60px ${C.pink}88`,
                transform: `scale(${pop(T.send) * (frame >= T.tap && frame < T.tap + 5 ? 0.92 : 1)})`,
              }}
            >
              Send Wobs
            </div>
          )}

          {/* 5. Pings: the class is taken */}
          {[
            { at: T.pings, text: "Wobs is on it", color: C.cyan },
            { at: T.pings + 15, text: "Jenna is taking it", color: C.amber },
            { at: T.pings + 30, text: "✓ Taken by Jenna · 06:04", color: C.lime },
          ].map((n, i) =>
            frame >= n.at ? (
              <div
                key={n.text}
                style={{
                  position: "absolute", left: 90, right: 90, top: 1300 + i * 150, background: "#fff", borderRadius: 36, padding: "28px 36px",
                  fontSize: 50, fontWeight: 700, color: "#1A1240", borderLeft: `18px solid ${n.color}`,
                  transform: `translateX(${interpolate(pop(n.at), [0, 1], [1100, 0])}px)`,
                }}
              >
                {n.text}
              </div>
            ) : null,
          )}
        </>
      )}

      {/* 6. End card */}
      {frame >= T.end && (
        <AbsoluteFill style={{ background: C.sky, alignItems: "center", justifyContent: "center", gap: 40, opacity: interpolate(frame, [T.end, T.end + 8], [0, 1]) }}>
          <div style={{ position: "relative" }}>
            <Wobs size={520} mood="sleep" squashX={1.04 + Math.sin(frame / 12) * 0.02} squashY={0.94 - Math.sin(frame / 12) * 0.02} />
            {["z", "z", "Z"].map((z, i) => (
              <div
                key={i}
                style={{
                  position: "absolute", right: -10 - i * 40, top: 40 - i * 60, fontFamily: DISPLAY, fontSize: 60 + i * 20, color: "#C9BBFF",
                  opacity: interpolate((frame - T.end - i * 8) % 45, [0, 10, 35, 45], [0, 1, 1, 0]),
                }}
              >
                {z}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 92, lineHeight: 1.08, textAlign: "center", padding: "0 80px", transform: `scale(${pop(T.end + 6)})` }}>
            When a class wobbles,
            <br />
            <span style={{ color: C.pink }}>Wobs</span> steadies it.
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, color: C.cyan, opacity: pop(T.end + 20) }}>heywobs.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
