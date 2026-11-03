"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CitySky, partOfDayNow, Wobs } from "@/components/wobs";
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
  const [code, setCode] = useState("");
  const [linkError, setLinkError] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link")
      setLinkError("That sign-in link had expired or was already used. Email links work once, and only the newest one works. Some work email systems open links to scan them, which uses them up, so use the code from the email instead.");
  }, []);
  // After "forgot password", land on the page to set a new one.
  const afterLink = () => (mode === "link" ? "/account/password" : nextPath());

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setError(/expired|invalid/i.test(error.message) ? "That code has expired or isn't right. Check it's from the newest email, or send a new one." : error.message);
      setBusy(false);
      return;
    }
    router.replace(afterLink());
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterLink())}`;
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
      <div className="relative overflow-hidden rounded-b-[2rem] bg-night px-5 pb-6 pt-12 text-white">
        <CitySky part={partOfDayNow()} />
        <div className="relative flex items-end gap-2">
          <div className="min-w-0 flex-1 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan">Wobs</p>
            <h1 className="mt-3 text-4xl leading-none">{mode === "signup" ? "Create account" : "Sign in"}</h1>
            <p className="mt-3 text-white/80">{mode === "signup" ? "Teachers: join to pick up cover at Stretch." : "Welcome back. Wobs missed you."}</p>
          </div>
          <Wobs className="h-24 w-24 flex-none" />
        </div>
      </div>

      <div className="grid gap-5 px-4">
        {sent ? (
          <div className="grid gap-2 rounded-3xl border border-line bg-surface p-4">
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-muted">
              {sent === "confirm" ? "We sent a link to confirm " : "We sent a sign-in email to "}
              <b className="text-ink">{email}</b>. Open the link on this device, or type the code from the email here.
            </p>
            {sent === "link" && (
              <form onSubmit={verifyCode} className="grid gap-3">
                <input
                  aria-label="Code from the email"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Code from the email"
                  className={`${inputClass} text-center font-mono text-xl tracking-[0.25em]`}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                {error && <p className="text-sm text-bad">{error}</p>}
                <button className={buttonClass()} disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in with code"}</button>
              </form>
            )}
            <button className="justify-self-start text-sm font-semibold text-accent" onClick={() => { setSent(null); setCode(""); setError(""); }}>Back</button>
          </div>
        ) : (
          <>
            {linkError && !error && <p className="rounded-2xl bg-urgent-soft px-4 py-3 text-sm">{linkError}</p>}
            {mode === "link" && <p className="text-sm text-muted">We&apos;ll email you a sign-in link and code. Once you&apos;re in, you can set a new password.</p>}
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
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link and code"}
              </button>
            </form>
            <button
              type="button"
              className="justify-self-center text-sm font-semibold text-accent"
              onClick={() => { setMode(mode === "link" ? "signin" : "link"); setError(""); }}
            >
              {mode === "link" ? "Use a password instead" : "Forgot or never set a password?"}
            </button>
            <a href="/privacy" className="justify-self-center text-xs text-muted underline">Privacy notice</a>
          </>
        )}
      </div>
    </main>
  );
}
