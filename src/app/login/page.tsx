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
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-4 py-10">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Class Cover</p>
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-muted">We&apos;ll email you a link. No password needed.</p>
      </div>
      {state === "sent" ? (
        <div className="grid gap-2 rounded-2xl border border-line bg-surface p-4">
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
    </main>
  );
}
