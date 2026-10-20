"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-start gap-6 pb-10">
      <div className="relative overflow-hidden rounded-b-[2rem] bg-accent px-5 pb-8 pt-16 text-accent-ink">
        <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 opacity-15">
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" />)}
        </svg>
        <p className="relative text-xs font-semibold uppercase tracking-widest opacity-80">Class Cover</p>
        <h1 className="relative mt-3 text-4xl font-bold leading-none">Sign in</h1>
        <p className="relative mt-3 opacity-80">We&apos;ll email you a link. No password needed.</p>
      </div>
      <div className="grid gap-6 px-4">
      {state === "sent" ? (
        <div className="grid gap-2 rounded-3xl border border-line bg-surface p-4">
          <p className="font-semibold">Check your email</p>
          <p className="text-sm text-muted">
            We sent a sign-in link to <b className="text-ink">{email}</b>. Open it on this device. It can take a minute to arrive.
          </p>
          <button className="justify-self-start text-sm font-semibold text-accent" onClick={() => setState("idle")}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="grid gap-4">
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {state === "error" && <p className="text-sm text-bad">{error}</p>}
          <button className={buttonClass()} disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
      </div>
    </main>
  );
}
