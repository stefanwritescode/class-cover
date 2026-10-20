export default function Home() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-4 py-10">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Stretch Pilates</p>
        <h1 className="text-4xl font-bold">Class Cover</h1>
        <p className="text-muted">
          Last-minute cover, filled in minutes. A studio posts a class, qualified teachers get a
          WhatsApp, and the first to accept takes it.
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <p className="font-semibold">Phase 1 in progress</p>
        <p className="text-sm text-muted">Sign-in, teacher signup and vetting are being built next.</p>
      </div>
    </main>
  );
}
