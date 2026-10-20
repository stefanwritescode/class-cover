"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink print:hidden">
      Print or save as PDF
    </button>
  );
}
