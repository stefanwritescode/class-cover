"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, Field, inputClass } from "@/components/ui";

// Set or change your password while signed in. No email is sent.
export default function SetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== again) return setError("The two passwords don't match.");
    setState("busy");
    setError("");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) {
      setError(/session/i.test(error.message) ? "You need to be signed in to set a password." : error.message);
      setState("idle");
    } else setState("done");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-5 py-10">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Class Cover</p>
        <h1 className="text-3xl font-bold">{state === "done" ? "Password saved" : "Set a password"}</h1>
        <p className="text-muted">{state === "done" ? "Next time, sign in with your email and this password." : "Then you can sign in without waiting for an email."}</p>
      </div>
      {state === "done" ? (
        <button className={buttonClass()} onClick={() => { router.replace("/"); router.refresh(); }}>Done</button>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Field label="New password" htmlFor="pw" hint="At least 8 characters.">
            <input id="pw" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Type it again" htmlFor="again">
            <input id="again" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={again} onChange={(e) => setAgain(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-bad">{error}</p>}
          <button className={buttonClass()} disabled={state === "busy"}>{state === "busy" ? "Saving…" : "Save password"}</button>
        </form>
      )}
    </main>
  );
}
