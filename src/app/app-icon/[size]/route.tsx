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

// Wobs on a night sky. Drawn as an SVG string because the image renderer doesn't run our CSS.
const WOBS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
<rect width="240" height="240" fill="#120A33"/>
<circle cx="190" cy="52" r="18" fill="#FF3EA5" opacity="0.9"/>
<path d="M44 40 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#C6FF3D"/>
<path d="M200 140 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#33F0FF"/>
<g transform="translate(0 6)">
<path d="M120 52 C170 52 182 100 180 130 C178 168 150 176 120 176 C90 176 62 168 60 130 C58 100 70 52 120 52Z" fill="#FF3EA5"/>
<path d="M88 76 C96 64 108 60 118 60" fill="none" stroke="#FF8CC8" stroke-width="7" stroke-linecap="round" opacity="0.8"/>
<path d="M64 98 C100 88 140 88 177 98 L176 112 C140 102 100 102 63 112Z" fill="#33F0FF"/>
<path d="M176 102 l20 -12 -5 13 15 3" fill="none" stroke="#33F0FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="102" cy="128" rx="7" ry="9" fill="#0A0620"/><ellipse cx="138" cy="128" rx="7" ry="9" fill="#0A0620"/>
<circle cx="104" cy="125" r="2.5" fill="#fff"/><circle cx="140" cy="125" r="2.5" fill="#fff"/>
<path d="M110 146 q10 8 20 0" fill="none" stroke="#0A0620" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="86" cy="140" rx="9" ry="5" fill="#FF8CC8"/><ellipse cx="154" cy="140" rx="9" ry="5" fill="#FF8CC8"/>
</g></svg>`;

function AppIcon({ px, pad }: { px: number; pad: number }) {
  const inner = Math.round(px * (1 - pad * 2));
  return (
    <div style={{ width: px, height: px, display: "flex", alignItems: "center", justifyContent: "center", background: "#120A33" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img width={inner} height={inner} src={`data:image/svg+xml,${encodeURIComponent(WOBS_SVG)}`} alt="" />
    </div>
  );
}
