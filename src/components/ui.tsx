import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, tone, className = "" }: { children: ReactNode; tone?: "urgent" | "sunk"; className?: string }) {
  const toneClass =
    tone === "urgent" ? "border-urgent bg-surface ring-4 ring-urgent-soft" : tone === "sunk" ? "border-line bg-sunk" : "border-line bg-surface shadow-[0_1px_0_var(--line)]";
  return <div className={`grid gap-3 rounded-3xl border p-4 ${toneClass} ${className}`}>{children}</div>;
}

type PillTone = "accent" | "urgent" | "good" | "bad" | "muted";
const PILL: Record<PillTone, string> = {
  accent: "bg-accent-soft text-accent",
  urgent: "bg-urgent-soft text-ink",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  muted: "border border-line bg-sunk text-muted",
};
export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: PillTone }) {
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL[tone]}`}>{children}</span>;
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line bg-sunk px-2.5 py-0.5 text-xs text-muted">{children}</span>;
}

const BTN = {
  primary: "bg-accent text-accent-ink shadow-sm active:translate-y-px",
  ghost: "border border-line bg-surface text-accent",
  danger: "border border-line bg-surface text-bad",
};
export function buttonClass(variant: keyof typeof BTN = "primary", small = false) {
  return `inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition disabled:opacity-40 ${
    small ? "px-3.5 py-1.5 text-[13px]" : "px-5 py-3"
  } ${BTN[variant]}`;
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

const AVATAR_TONES = ["bg-accent-soft text-accent", "bg-urgent-soft text-ink", "bg-good-soft text-good", "bg-bad-soft text-bad"];
export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  const dim = size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-[13px]";
  return <div className={`grid flex-none place-items-center rounded-2xl font-bold ${dim} ${tone}`}>{initials}</div>;
}

/* ---------- Icons (24px line icons, currentColor) ---------- */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  people: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2" /></svg>,
  calendar: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  sliders: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>,
  bell: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  home: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /></svg>,
  check: <svg viewBox="0 0 24 24" className="h-4 w-4" {...P}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  phone: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" {...P}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>,
  plus: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>,
  rand: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><rect x="3" y="6" width="18" height="12" rx="3" /><circle cx="12" cy="12" r="2.5" /></svg>,
  user: <svg viewBox="0 0 24 24" className="h-5 w-5" {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></svg>,
  clock: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" {...P}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  bolt: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" {...P}><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></svg>,
  pin: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" {...P}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
};

export type NavItem = { href: string; label: string; active: boolean; icon: ReactNode; badge?: number };

/** Phone-style app frame: a coloured header band, scrolling content, and icon tabs. */
export function AppShell({
  eyebrow,
  title,
  subtitle,
  nav,
  headerExtra,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  nav?: NavItem[];
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="relative overflow-hidden rounded-b-[2rem] bg-accent px-5 pb-6 pt-5 text-accent-ink">
        {/* Reformer-spring motif: concentric arcs, purely decorative */}
        <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-15">
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" />)}
        </svg>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-ink/15 font-display text-xs font-bold">CC</span>
            <span className="text-xs font-semibold opacity-80">{eyebrow}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="rounded-full bg-accent-ink/10 px-3 py-1 text-xs font-semibold">Sign out</button>
          </form>
        </div>
        <h1 className="relative mt-5 text-[2rem] font-bold leading-none">{title}</h1>
        {subtitle && <p className="relative mt-2 text-sm opacity-80">{subtitle}</p>}
        {headerExtra && <div className="relative mt-4">{headerExtra}</div>}
      </header>
      <main className="grid flex-1 content-start gap-6 px-4 pb-32 pt-5">{children}</main>
      {nav && (
        <nav className="fixed inset-x-0 bottom-0 z-10 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
          <div className="mx-auto flex max-w-md gap-1 rounded-full border border-line bg-surface/95 p-1.5 shadow-lg backdrop-blur">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold ${
                  n.active ? "bg-accent text-accent-ink" : "text-muted"
                }`}
              >
                {n.icon}
                {n.label}
                {!!n.badge && (
                  <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-urgent px-1 text-[10px] text-[#2A1C05]">{n.badge}</span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputClass = "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink";

export function ErrorNote({ message }: { message: string }) {
  return (
    <Card tone="sunk">
      <p className="text-sm font-semibold text-bad">Couldn&apos;t load this</p>
      <p className="text-xs text-muted">{message}</p>
    </Card>
  );
}
