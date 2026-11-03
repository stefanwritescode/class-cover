"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "cc-install-dismissed";

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {}
  return null;
}

/** Registers the service worker, and offers "Add to home screen" until it's installed or dismissed. */
export function InstallApp() {
  const [android, setAndroid] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone || store(DISMISSED)) return;
    setHidden(false);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setAndroid(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || (!android && !ios)) return null;

  function dismiss() {
    store(DISMISSED, "1");
    setHidden(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app-icon/192" alt="" className="h-10 w-10 flex-none rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Add Class Cover to your home screen</p>
        {ios ? (
          <p className="text-xs text-muted">In Safari, tap Share <span aria-hidden>⎋</span> then &ldquo;Add to Home Screen&rdquo;.</p>
        ) : (
          <p className="text-xs text-muted">Opens full screen, like an app.</p>
        )}
      </div>
      {android && (
        <button
          className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink"
          onClick={async () => {
            await android.prompt();
            if ((await android.userChoice).outcome === "accepted") setHidden(true);
          }}
        >
          Install
        </button>
      )}
      <button aria-label="Not now" className="flex-none px-1 text-lg text-muted" onClick={dismiss}>×</button>
    </div>
  );
}
