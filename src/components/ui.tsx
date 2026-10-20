import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, tone }: { children: ReactNode; tone?: "urgent" | "sunk" }) {
  const toneClass =
    tone === "urgent" ? "border-urgent ring-4 ring-urgent-soft" : tone === "sunk" ? "bg-sunk" : "bg-surface";
  return <div className={`grid gap-3 rounded-2xl border border-line p-4 ${toneClass}`}>{children}</div>;
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
  primary: "bg-accent text-accent-ink",
  ghost: "border border-line text-accent bg-transparent",
  danger: "border border-line text-bad bg-transparent",
};
export function buttonClass(variant: keyof typeof BTN = "primary", small = false) {
  return `inline-flex items-center justify-center rounded-xl font-semibold disabled:opacity-50 ${
    small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5"
  } ${BTN[variant]}`;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="px-0.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">{initials}</div>;
}

export type NavItem = { href: string; label: string; active: boolean };

/** Phone-style app frame: header, scrolling content, bottom tabs. */
export function AppShell({
  eyebrow,
  title,
  nav,
  children,
}: {
  eyebrow: string;
  title: string;
  nav?: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-end justify-between gap-3 px-4 pb-3 pt-6">
        <div>
          <p className="text-xs text-muted">{eyebrow}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-xs font-semibold text-muted underline-offset-2 hover:underline">Sign out</button>
        </form>
      </header>
      <main className="grid flex-1 content-start gap-4 px-4 pb-28">{children}</main>
      {nav && (
        <nav
          className="fixed inset-x-0 bottom-0 border-t border-line bg-surface"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex max-w-md">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex-1 py-3 text-center text-xs font-semibold ${n.active ? "text-accent" : "text-muted"}`}
              >
                {n.label}
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

export const inputClass = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink";
