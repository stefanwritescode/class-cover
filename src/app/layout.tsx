import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Dela_Gothic_One({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const body = Figtree({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["500"] });

export const metadata: Metadata = {
  title: "Class Cover",
  description: "Last-minute Pilates cover, filled in minutes.",
  appleWebApp: { capable: true, title: "Class Cover", statusBarStyle: "default" },
  icons: { apple: "/app-icon/apple-180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#120A33" },
    { media: "(prefers-color-scheme: dark)", color: "#120A33" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
