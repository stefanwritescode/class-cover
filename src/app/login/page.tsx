"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, Field, inputClass } from "@/components/ui";

type Mode = "signin" | "signup" | "link";

const nextPath = () => {
  const n = new URLSearchParams(window.location.search).get("next") ?? "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<null | "link" | "confirm">(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`;
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace(nextPath());
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        if (data.session) {
          router.replace(nextPath());
          router.refresh();
          return;
        }
        setSent("confirm");
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } });
        if (error) throw error;
        setSent("link");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        /invalid login credentials/i.test(msg)
          ? "That email and password don't match. If you've only used email links so far, sign in with a link once and set a password."
          : /rate limit/i.test(msg)
            ? "Too many emails sent in the last hour. Sign in with your password, or try the link again later."
            : msg,
      );
    }
    setBusy(false);
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => { setMode(m); setError(""); }}
      className={`flex-1 rounded-full py-2 text-sm font-semibold ${mode === m ? "bg-accent text-accent-ink" : "text-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-start gap-6 pb-10">
      <div className="relative overflow-hidden rounded-b-[2rem] bg-accent px-5 pb-8 pt-16 text-accent-ink">
        <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 opacity-15">
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" />)}
        </svg>
        <p className="relative text-xs font-semibold uppercase tracking-widest opacity-80">Class Cover</p>
        <h1 className="relative mt-3 text-4xl font-bold leading-none">{mode === "signup" ? "Create account" : "Sign in"}</h1>
        <p className="relative mt-3 opacity-80">{mode === "signup" ? "Teachers: join to pick up cover at Stretch." : "Welcome back."}</p>
      </div>

      <div className="grid gap-5 px-4">
        {sent ? (
          <div className="grid gap-2 rounded-3xl border border-line bg-surface p-4">
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-muted">
              {sent === "confirm" ? "We sent a link to confirm " : "We sent a sign-in link to "}
              <b className="text-ink">{email}</b>. Open it on this device.
            </p>
            <button className="justify-self-start text-sm font-semibold text-accent" onClick={() => setSent(null)}>Back</button>
          </div>
        ) : (
          <>
            {mode !== "link" && (
              <div className="flex rounded-full border border-line bg-surface p-1">
                {tab("signin", "Sign in")}
                {tab("signup", "Create account")}
              </div>
            )}
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Email" htmlFor="email">
                <input id="email" type="email" required autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              {mode !== "link" && (
                <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              )}
              {error && <p className="text-sm text-bad">{error}</p>}
              <button className={buttonClass()} disabled={busy}>
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a sign-in link"}
              </button>
            </form>
            <button
              type="button"
              className="justify-self-center text-sm font-semibold text-accent"
              onClick={() => { setMode(mode === "link" ? "signin" : "link"); setError(""); }}
            >
              {mode === "link" ? "Use a password instead" : "Forgot your password? Email me a link instead"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
