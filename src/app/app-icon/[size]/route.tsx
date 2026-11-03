import { ImageResponse } from "next/og";

// Home-screen icons. "maskable" leaves a safe margin so Android can crop it to a circle or squircle.
const SIZES: Record<string, { px: number; pad: number }> = {
  "192": { px: 192, pad: 0 },
  "512": { px: 512, pad: 0 },
  "maskable-512": { px: 512, pad: 0.12 },
  "apple-180": { px: 180, pad: 0 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZES[size] ?? SIZES["512"];
  return new ImageResponse(<AppIcon px={s.px} pad={s.pad} />, { width: s.px, height: s.px });
}

function AppIcon({ px, pad }: { px: number; pad: number }) {
  const inner = px * (1 - pad * 2);
  return (
    <div style={{ width: px, height: px, display: "flex", alignItems: "center", justifyContent: "center", background: "#1E5A4B", position: "relative" }}>
      {/* Reformer-spring arcs, as in the app header */}
      <svg width={px} height={px} viewBox="0 0 200 200" style={{ position: "absolute", top: 0, left: 0, opacity: 0.18 }}>
        {[30, 50, 70, 90].map((r) => <circle key={r} cx="150" cy="40" r={r} fill="none" stroke="#FFFFFF" strokeWidth="7" />)}
      </svg>
      <div style={{ display: "flex", color: "#FFFFFF", fontSize: inner * 0.42, fontWeight: 800, letterSpacing: -inner * 0.02 }}>CC</div>
    </div>
  );
}
